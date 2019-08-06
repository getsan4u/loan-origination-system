'use strict';
const helmet = require('helmet');
const bodyParser = require('body-parser');
const xmlparser = require('express-xml-bodyparser');
const os = require('os');
const winstonSNS = require('winston-sns');
// const winstonNewRelic = require('winston-newrelic-update');
const utilities = require('../container/decision-engine-service-container/utilities');
const { parseNumbers, parseBooleans, } = utilities.helpers;
const jsonToXML = require('convertjson2xml').singleton;
const periodic = require('periodicjs');

let hostname = os.hostname().replace(/\./g, '-');
var apm = require('elastic-apm-node').start({
  serviceName: hostname,
  serverUrl: 'http://wazuh.digifi.cc:8200'
});

/**
 * this function is used to add additional customizations to the express application before the express server starts. The function is bound with the periodic singleton instance
 * 
 * @returns 
 */
function customExpressConfiguration() {

  return new Promise((resolve, reject) => {
    try {
      const env = this.settings.application.environment;
      const permittedCSP = ['\'self\'',
        // '\'unsafe-inline\'',
        // '\'unsafe-eval\'',
        'https://s.pinimg.com/ct/core.js', '*.digifi.cc', '*.promisefinancial.net', '*.digifi.io', '*.google.com', '*.facebook.com', '*.facebook.net', '*.twitter.com', '*.addthis.com', '*.googleadservices.com', '*.doubleclick.net', '*.google-analytics.com', 'promisefinancial.evyy.net', '*.youtube.com', '*.plaid.com', '*.newrelic.com', '*.facebook.net', 's3-us-west-2.amazonaws.com', 'bam.nr-data.net', 'data:', 'd3cxv97fi8q177.cloudfront.net', 'd33wwcok8lortz.cloudfront.net', 'tapestry.tapad.com', 'd33wwcok8lortz.cloudfront.net', 'www.ojrq.net', '*.yodlee.com', '*.pinterest.com', '*.yodleeinteractive.com', '*.zopim.com', '*.zopim.io', '*.googleapis.com', 'wss://*.zopim.com', '*.eoriginal.com', ];
      const cspOptions = {
        directives: {
          defaultSrc: permittedCSP,
          reportUri: '/report-violation',
          //objectSrc: [] // An empty array allows nothing through
        },
        // Set to true if you only want browsers to report errors, not block them
        reportOnly: true,
        // Set to true if you want to blindly set all headers: Content-Security-Policy,
        // X-WebKit-CSP, and X-Content-Security-Policy.
        setAllHeaders: false,
        // Set to true if you want to disable CSP on Android where it can be buggy.
        disableAndroid: true,
        // Set to false if you want to completely disable any user-agent sniffing.
        // This may make the headers less compatible but it will be much faster.
        // This defaults to `true`.
        browserSniff: true,
      };
      const ninetyDaysInMilliseconds = 7776000000;
      this.app.use(xmlparser({
        explicitArray: false,
        normalize: false,
        normalizeTags: true,
        trim: true,
        explicitRoot: false,
        mergeAttrs: true,
        valueProcessors: [parseNumbers, parseBooleans,],
      }));
      this.app.use(helmet.frameguard({ action: 'sameorigin', }));
      this.app.use(helmet.hidePoweredBy());
      this.app.use(helmet.ieNoOpen());
      this.app.use(helmet.noSniff());
      this.app.use(helmet.xssFilter());
      this.app.use(helmet.hsts({
        maxAge: ninetyDaysInMilliseconds,     // Must be at least 18 weeks to be approved by Google
        includeSubDomains: true, // Must be enabled to be approved by Google
        preload: true,
      }));
      const helmetCSP = helmet.contentSecurityPolicy(cspOptions);
      // this.app.use(helmetCSP);
      this.app.post('/report-violation',
        bodyParser.json({
          type: ['json', 'application/csp-report', ],
        }), (req, res) => {
          let userdata = {};
          if (req && req.user && req.user.email) {
            userdata = {
              email:req.user.email,
              username:req.user.username,
              firstname:req.user.firstname,
              lastname:req.user.lastname,
            };
          }
          if (req.body) {
            this.logger.warn('CSP Violation: ', {
              reqBody:req.body,
              ipinfo:{
                date: new Date(),
                'x-forwarded-for': req.headers['x-forwarded-for'],
                remoteAddress: req.connection.remoteAddress,
                originalUrl: req.originalUrl,
                headerHost: req.headers.host,
                userAgent: req.headers['user-agent'],
                referer: req.headers.referer,
                user: userdata,
                osHostname: os.hostname(),
              },
            });
          } else {
            this.logger.error('CSP Violation: No data received!');
          }
          res.status(204).end();
        });
      this.app.use(function (err, req, res, next) {
        if (req.url === '/api/v2' && !res.headersSent) {
          let status = err.status === 400 ? err.status : 500;
          let response = {
            status_code: status,
            status_message: status === 400 ? 'Bad Request' : 'Internal Server Error',
            error: [
              {
                message: err.message,
              },
            ],
          };
          if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
            res.set('Content-Type', 'application/xml');
            response.error[ 0 ].message = response.error[ 0 ].message.split('\n').join(' '); 
            let xml = jsonToXML(response);
            if (xml instanceof Error) {
              return res.status(status).send(xml.message);
            } else {
              return res.status(status).send(xml);
            }
          } else {
            return res.status(status).send(response);
          }
        } else {
          return next(err);
        }
      });
      /**
       * this.app// is a reference to periodic's express instance
       * app.use((req,res,next)=>{
       * //custom middleware
       * next(); 
       * })
       */

      /**TODO move aws config to db */
      const loggerCredentials = periodic.settings && periodic.settings.extensions && periodic.settings.extensions['periodicjs.ext.packagecloud'] ? periodic.settings.extensions['periodicjs.ext.packagecloud'].logger : {};
      this.logger.add(winstonSNS, {
        "aws_key": loggerCredentials.aws_key,
        "aws_secret": loggerCredentials.aws_secret,
        "subscriber": loggerCredentials.subscriber, // Subscriber number - found in your SNS AWS Console, after clicking on a topic. Same as AWS Account ID. [required]
        "topic_arn": loggerCredentials.topic_arn, // Also found in SNS AWS Console - listed under a topic as Topic ARN. [required]
        "region": loggerCredentials.region, //AWS Region to use. Can be one of: us-east-1,us-west-1,eu-west-1,ap-southeast-1,ap-northeast-1,us-gov-west-1,sa-east-1. (default: us-east-1)
        "subject": this.settings.name+' Server Log (%l) [' + env + ' - ' + os.hostname() + ']', // Subject for notifications. Uses placeholders for level (%l), error message (%e), and metadata (%m). (default: 'Winston Error Report')
        //message: Message of notifications. Uses placeholders for level (%l), error message (%e), and metadata (%m). (default: 'Level '%l' Error:\n%e\n\nMetadata:\n%m')
        message: 'Level \'%l\'\r\n Message:\r\n%e\r\n \r\nMetadata:\r\n%m',
        level: 'error', //lowest level this transport will log. (default: info)
        json: true, // use json instead of a prettier (human friendly) string for meta information in the notification. (default: false)
        handleExceptions: true, // set to true to have this transport handle exceptions. (default: false)
      });

      // this.logger.add(winstonNewRelic, {});
      this.logger.exitOnError = false;
      if (this.settings.application.environment === 'development') {
        this.app.all('*', function(req, res, next) {
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,DELETE,DEL,PUT');
          res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, entitytype, clientid, username, password, organization, x-access-token, X-Access-Token');
          // console.log({ req })
          if (req.method === 'OPTIONS') {
            res.sendStatus(200);
          // next();
          } else {
            next();
          }
        });
      }
      resolve(true);
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  customExpressConfiguration,
};

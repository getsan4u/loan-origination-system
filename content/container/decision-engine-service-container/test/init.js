'use strict';

const path = require('path');
const fs = require('fs-extra');
const flatten = require('flat');
const events = require('events');
const chai = require('chai');
const sinon = require('sinon');
const semver = require('semver');
const periodic = require('periodicjs');
const expect = require('chai').expect;
chai.use(require('sinon-chai'));
require('mocha-sinon');
let periodicSingleton;

describe('Periodic initialization', function () {
  this.timeout(30000);
  describe('periodic initializes properly', function () {
    before(async (done) => {
      // initialize
      const periodicInitStatus = await periodic.init({ debug: true });
      const reactappUtilities = periodic.locals.extensions.get('@digifi-los/reactapp');
      periodic.locals.extensions.set('periodicjs.ext.reactapp', reactappUtilities);
      const reactappSettings = periodic.settings.extensions[ '@digifi-los/reactapp' ];
      periodic.settings.extensions[ 'periodicjs.ext.reactapp' ] = reactappSettings;
      const THEMESETTINGS = periodic.settings.container['decision-engine-service-container'];
      
      // on configuration complete
      const utilities = require('../utilities');
      const csv = require('fast-csv');
      const numeral = require('numeral');
      const Promisie = require('promisie');
      const readFile = Promisie.promisify(fs.readFile);
      const writeFile = Promisie.promisify(fs.writeFile);
      const logger = periodic.logger;
      const exec = require('child_process').exec;
      const redis = require('redis');
      const CREDIT_PIPELINE = require('@digifi-los/credit-process');
      const AWS = require('aws-sdk');
      const util = require('util');
      const os = require('os');
      const mongodb = require('mongodb');
      const streamBuffers = require('stream-buffers');
      const ObjectId = mongodb.ObjectID;
      const hostname = os.hostname();
      let vision;

      function promisifyClientConnect(uri, db) {
        return new Promise((resolve, reject) => {
          try {
            const client = new mongodb.MongoClient(THEMESETTINGS.gridfs.uri);
            client.connect(async function (err) {
              if (err) logger.warn(err);
              else {
                const db = client.db(THEMESETTINGS.gridfs.db);
                const bucket = new mongodb.GridFSBucket(db);
                periodic.gridfs = { db, bucket };
                return resolve(true);
              }
            })
          } catch (err) {
            return reject(err)
          }
        });
      }

      await promisifyClientConnect(THEMESETTINGS.gridfs.uri, THEMESETTINGS.gridfs.db);
      const port = reactAppSettings.session.port;
      const host = reactAppSettings.session.host;
      periodic.app.locals.redisClient = redis.createClient(port, host);
      periodic.app.locals.redisClient.auth(reactAppSettings.session.auth, (err, res) => logger.warn);
      periodic.app.locals.redisClient.on('connect', () => {
        logger.silly('REDIS CONNECTED');
      });
      const updateGlobalRulesVariables = require('../crons/update_rules_variables.cron')(periodic);
      
      updateGlobalRulesVariables();

      const basename = periodic.settings.extensions[ 'periodicjs.ext.reactapp' ].basename;
      periodic.app.locals.THEMESETTINGS = Object.assign(THEMESETTINGS, {
        basename,
      });
      periodic.app.locals.strategiesCache = {};

      const servers = periodic.servers;
      const httpServer = servers.get('http')
      const httpsServer = servers.get('https')
      httpServer.keepAliveTimeout = 0;
      httpsServer.keepAliveTimeout = 0;
      periodic.servers.set('http', httpServer);
      periodic.servers.set('https', httpsServer);

      const machineLearningSettings = periodic.settings.container[ 'decision-engine-service-container' ].machinelearning;
      const googleVisionSettings = periodic.settings.container[ 'decision-engine-service-container' ].googlevision;
      const aws_configs = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].client;
      AWS.config.update({
        region: aws_configs.region,
      });
      AWS.config.setPromisesDependency(require('promisie'));
      periodic.aws = {};
      AWS.config.credentials = new AWS.Credentials(THEMESETTINGS.sagemaker.key, THEMESETTINGS.sagemaker.secret, null);
      periodic.aws.sagemaker = new AWS.SageMaker();
      periodic.aws.sagemakerruntime = new AWS.SageMakerRuntime();
      periodic.aws.sagemaker_bucket = THEMESETTINGS.sagemaker.bucket;
      AWS.config.credentials = new AWS.Credentials(aws_configs.accessKeyId, aws_configs.accessKey, null);
      const s3 = new AWS.S3();
      periodic.aws.s3 = s3;
      window.process = global.process;
      vision = require('@google-cloud/vision').v1p3beta1;
      periodic.googlevision = new vision.ImageAnnotatorClient({
        credentials: {
          client_email: googleVisionSettings.client_email,
          private_key: googleVisionSettings.key,
        },
        projectId: googleVisionSettings.project_id,
      });

      const machinelearning = new AWS.MachineLearning();
      periodic.aws.machinelearning = machinelearning;
      exec('npm run sass', (err, stdout, stderr) => {
        if (err) logger.error('Unable to npm run sass', err);
        logger.silly(`stdout: ${stdout}`);
        logger.silly(`stderr: ${stderr}`);
      });
      exec('npm run watch', (err, stdout, stderr) => {
        if (err) logger.error('Unable to npm run watch', err);
        logger.silly(`stdout: ${stdout}`);
        logger.silly(`stderr: ${stderr}`);
      });
      done();
    })
    it('should generate a periodic singleton',()=>{
      expect(periodic).to.be.a('object');
    });
  })
});
'use strict';
const periodic = require('periodicjs');
var CronJob = require('cron').CronJob;
const utilities = require('./utilities');
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const numeral = require('numeral');
const Promisie = require('promisie');
const readFile = Promisie.promisify(fs.readFile);
const writeFile = Promisie.promisify(fs.writeFile);
const logger = periodic.logger;
const exec = require('child_process').exec;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const redis = require('redis');
const CREDIT_PIPELINE = require('@digifi-los/credit-process');
const AWS = require('aws-sdk');
const util = require('util');
let os = require('os');
const mongodb = require('mongodb');
const streamBuffers = require('stream-buffers');
const ObjectId = mongodb.ObjectID;
const hostname = os.hostname();
let vision;

const mlcrons = utilities.mlcrons;
let credit_engine = CREDIT_PIPELINE(periodic);
require('convertjson2xml').singleton({
  trim: true,
  hideUndefinedTag: true,
  nullValueTag: 'full',
  emptyStringTag: 'full',
});

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

module.exports = () => {
  periodic.status.on('configuration-complete', async (status) => {
    await promisifyClientConnect(THEMESETTINGS.gridfs.uri, THEMESETTINGS.gridfs.db);
    // let updateBalanceCron = require('./crons/update_balance_aggregation.cron')(periodic);
    let reactAppSettings = periodic.settings.extensions[ '@digifi-los/reactapp' ];
    let port = reactAppSettings.session.port;
    let host = reactAppSettings.session.host;
    periodic.app.locals.redisClient = redis.createClient(port, host);
    periodic.app.locals.redisClient.auth(reactAppSettings.session.auth, (err, res) => logger.warn);
    periodic.app.locals.redisClient.on('connect', () => {
      logger.silly('REDIS CONNECTED');
    });
    let updateGlobalRulesVariables = require('./crons/update_rules_variables.cron')(periodic);
    let hourlyExportCron = require('./crons/hourly_export.cron')(periodic);
    
    updateGlobalRulesVariables();

    let basename = periodic.settings.extensions[ 'periodicjs.ext.reactapp' ].basename;
    periodic.app.locals.THEMESETTINGS = Object.assign(THEMESETTINGS, {
      basename,
    });
    periodic.app.locals.strategiesCache = {};

    // This overrides default profile picture
    // periodic.settings.extensions[ 'periodicjs.ext.reactapp' ].default_user_image = THEMESETTINGS.company_logo;

    let servers = periodic.servers;
    let httpServer = servers.get('http')
    let httpsServer = servers.get('https')
    httpServer.keepAliveTimeout = 0;
    httpsServer.keepAliveTimeout = 0;
    periodic.servers.set('http', httpServer);
    periodic.servers.set('https', httpsServer);

    let machineLearningSettings = periodic.settings.container[ 'decision-engine-service-container' ].machinelearning;
    let googleVisionSettings = periodic.settings.container[ 'decision-engine-service-container' ].googlevision;
    let aws_configs = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].client;
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
    let s3 = new AWS.S3();
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

    let machinelearning = new AWS.MachineLearning();
    periodic.aws.machinelearning = machinelearning;

    if (machineLearningSettings.use_mlcrons) {
      // for debugging purposes
      // let active = setInterval(async () => {
      //   const redisClient = periodic.app.locals.redisClient;
      //   const getAllKeys = Promisie.promisify(redisClient.keys).bind(redisClient);
      //   const getValues = Promisie.promisify(redisClient.hgetall).bind(redisClient);
      //   const allLLKeys = await getAllKeys(`${periodic.environment}_ml_sagemaker_ll:*`);
      //   // const allLLValues = await Promise.all(allLLKeys.map(key => getValues(key)));
      //   const allAWSKeys = await getAllKeys(`${periodic.environment}_ml_aws:*`);
      //   const allAWSValues = await Promise.all(allAWSKeys.map(key => getValues(key)));
      //   const allXGBKeys = await getAllKeys(`${periodic.environment}_ml_sagemaker_xgb:*`);
      //   // const allXGBValues = await Promise.all(allXGBKeys.map(key => getValues(key)));
      //   // redisClient.del('development_ml_aws:5c424f53940423bc336e3a90');
      // }, 5000);
      mlcrons.sageMaker();
      mlcrons.digifi();
      mlcrons.modelSelectionUpdater();
      setInterval(() => {
        mlcrons.overallModelUpdater();
      }, 5000);
      setInterval(async () => {
        const redisClient = periodic.app.locals.redisClient;
        const getAllKeys = Promisie.promisify(redisClient.keys).bind(redisClient);
        const getValues = Promisie.promisify(redisClient.hgetall).bind(redisClient);
        const allKeys = await getAllKeys(`${periodic.environment}_ml_preprocessing:*`);
        const allValues = await Promise.all(allKeys.map(key => getValues(key)));
        allValues.forEach(mlmodel => {
          mlcrons.preTrainingProcess({ mlmodel, });
          redisClient.del(`${periodic.environment}_ml_preprocessing:${mlmodel._id.toString()}`);
        });
      }, 15000);
      setInterval(() => {
        periodic.app.locals.redisClient.keys(`${periodic.environment}_ml_aws:*`, function (err, model_keys) {
          if (model_keys.length) {
            let data_sources = {};
            let ml_models = {};
            let upload_datasources = {};
            let getValueAsync = (model_key) => new Promise((resolve, reject) => {
              try {
                periodic.app.locals.redisClient.hgetall(model_key, function (err, results) {
                  return resolve(results);
                });
              } catch (err) {
                return reject(err);
              }
            });
            let getValues = model_keys.map(model_key => getValueAsync(model_key));
            Promise.all(getValues)
              .then(values => {
                model_keys.forEach((model_key, idx) => {
                  let current_model = values[ idx ];
                  if (current_model && current_model.status === 'datasource_cleanup' && !current_model.data_source_training_status) {
                    upload_datasources[ current_model._id ] = current_model;
                  }
                  if (current_model && !current_model.model_id) return;
                  if (current_model && current_model.data_source_training_status === 'true' && current_model.data_source_testing_status === 'true' && current_model.ml_model_status === 'false') {
                    ml_models[ current_model.model_id ] = current_model;
                  } else if (current_model && (current_model.data_source_training_status === 'false' || current_model.data_source_testing_status === 'false')) {
                    data_sources[ current_model.model_id ] = current_model;
                  } else if (current_model && current_model.data_source_training_status === 'true' && current_model.data_source_testing_status === 'true' && current_model.ml_model_status === 'true') {
                    return;
                  }
                  mlcrons.checkDataSources(machinelearning, data_sources);
                  mlcrons.checkMLModels(machinelearning, ml_models);
                  mlcrons.batchUpdater({ s3, machinelearning, });
                  mlcrons.modelUpdater();
                });
              });
          } else {
            mlcrons.batchUpdater({ s3, machinelearning, });
            mlcrons.modelUpdater();
          }
        });
        // }, 5000);

      }, machineLearningSettings.cron_interval || 60000);
    }

    if (periodic.settings.application.environment === 'cloud') {
      try {
        new CronJob('0 * * * *', function () {
          hourlyExportCron();
        }, null, true, 'America/New_York');
      } catch (err) {
        console.log({
          err,
        });
      }
    }

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
  });
  return Promise.resolve();
};

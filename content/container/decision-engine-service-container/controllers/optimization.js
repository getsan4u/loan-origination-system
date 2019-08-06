'use strict';

const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const numeral = require('numeral');
const logger = periodic.logger;
const flat = require('flat');
const Promisie = require('promisie');
const fs = Promisie.promisifyAll(require('fs-extra'));
const util = require('util');
const converter = require('json-2-csv');
const flatten = require('flat').flatten;
const unflatten = require('flat').unflatten;
const moment = require('moment');
const path = require('path');
const capitalize = require('capitalize');
const utilities = require('../utilities');
const MAX_BATCH_PROCESS_FILESIZE = THEMESETTINGS.optimization.batch_process_upload_filesize_limit;
const AWS = require('aws-sdk');
const csv = require('fast-csv');
const pluralize = require('pluralize');
const zlib = require('zlib');
const helpers = utilities.helpers;
const getCollectionCounter = helpers.getCollectionCounter;
const updateCollectionCounter = helpers.updateCollectionCounter;
const transformhelpers = utilities.transformhelpers;
// const addQueue = require('../utilities/promisequeue').addQueue;
const Busboy = require('busboy');
const XLSX = require('xlsx');

/**
 * Setup the test case template for csv download.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function getDataSourceTemplate(req, res, next) {
  req.controllerData = req.controllerData || {};
  req.body = req.body || {};
  req.controllerData.flattenedOutput = [{
    // name: 'example data source',
    field_1: 'example value1',
    field_2: 'example value2',
    field_3: 'example value3',
    field_4: 'example value4',
    field_5: 'example value5',
    field_6: 'example value6',
    field_7: 'example value7',
    field_8: 'example value8',
    field_9: 'example value9',
    field_10: 'example value10',
    historical_result: 'example historical result value',
  }, ];
  req.controllerData.flattenedOutputName = 'data_source_upload_template';
  return next();
}

/** 
 * Retrieves single datasource
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function getDataSource(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Datasource = periodic.datas.get('standard_datasource');
    if ((req.query && (req.query.type === 'getDataSourceSchema' || req.query.type === 'getDataSourceTransformations')) || (req.body && (req.body.data_source || req.body.type && req.body[ `data_source_${req.body.type}` ]))) {
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      if (req.body.type) req.body.data_source = req.body[ `data_source_${req.body.type}` ];
      Datasource.load({ query: { _id: req.body.data_source || req.params.id, organization, }, })
        .then(datasource => {
          if (!datasource) return res.status(500).send({
            status: 500,
            data: {
              error: 'Could not find the resource.',
            },
          });
          datasource = datasource.toJSON ? datasource.toJSON() : datasource;
          req.controllerData.datasource = datasource;
          next();
        })
        .catch(next);
    } else {
      next();
    }
  } catch (e) {
    logger.warn('Error in getDataSource', e);
    return next(e);
  }
}

/** 
 * Retrieves single datasource to be used for download
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function getDataSourceForDownload(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.data = req.controllerData.data || {};
    const Datasource = periodic.datas.get('standard_datasource');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    Datasource.load({
      query: {
        _id: req.params.id,
        // organization
      },
    })
      .then(datasource => {
        if (!datasource) {
          throw new Error('Could not find datasource');
        } else {
          datasource = datasource.toJSON ? datasource.toJSON() : datasource;
          req.controllerData.data = datasource;
          next();
        }
      })
      .catch(e => {
        throw new Error('Could not find datasource');
      });
  } catch (e) {
    logger.warn('Error in getDataSource', e);
    return res.status(500).send({
      status: 500,
      data: {
        error: e.message,
      },
    });
  }
}

function transformDataSource(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.transforms = req.controllerData.transforms || {};
    if (req.controllerData.datasource && req.controllerData.datasource.transformations && Object.keys(req.controllerData.datasource.transformations).length) {
      let aws_container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
      let aws_configs = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].client;
      AWS.config.update({ region: aws_configs.region, });
      AWS.config.credentials = new AWS.Credentials(aws_configs.accessKeyId, aws_configs.accessKey, null);
      let s3 = new AWS.S3();
      let transformations = req.controllerData.datasource.transformations;
      let transformation_keys = Object.keys(transformations);
      let function_transformations = {};
      transformation_keys.forEach(var_name => {
        function_transformations[ var_name ] = { evaluator: new Function('x', transformations[ var_name ].evaluator), type: transformations[ var_name ].type, };
      });
      let trainings3Params = {
        Bucket: `${aws_container_name}/mldata`,
        Key: `${req.controllerData.datasource.training_data_asset.attributes.original_filename}`,
      };
      let testings3Params = {
        Bucket: `${aws_container_name}/mldata`,
        Key: `${req.controllerData.datasource.testing_data_asset.attributes.original_filename}`,
      };
      const s3TrainingStream = s3.getObject(trainings3Params).createReadStream();
      const s3TestingStream = s3.getObject(testings3Params).createReadStream();
      let trainingCSV = [];
      let testingCSV = [];
      s3TrainingStream.pipe(csv())
        .on('data', (data) => {
          trainingCSV.push(data);
        })
        .on('error', function (e) {
          logger.warn(`Invalid csv format: ${e.message}`);
          next(e);
        })
        .on('end', async function () {
          let headers = trainingCSV.shift();
          let transform_indices = {};
          transformation_keys.forEach(key => (transform_indices[ headers.indexOf(key) ] = function_transformations[ key ].evaluator));
          let transformedTraining = await helpers.transformColumns({ data: trainingCSV, transform_indices, });
          transformedTraining.unshift(headers);
          s3TestingStream.pipe(csv())
            .on('data', (data) => {
              testingCSV.push(data);
            })
            .on('error', function (e) {
              logger.warn(`Invalid csv format: ${e.message}`);
              next(e);
            })
            .on('end', async function () {
              testingCSV.shift();
              let transformedTesting = await helpers.transformColumns({ data: testingCSV, transform_indices, });
              transformedTesting.unshift(headers);
              const testingName = `${moment().format('YYYY-MM-DD_HH-mm')}_${req.controllerData.datasource.name}_testing.csv`;
              const trainingName = `${moment().format('YYYY-MM-DD_HH-mm')}_${req.controllerData.datasource.name}_training.csv`;
              function createCSVString(aggregate, rowArray) {
                let row = rowArray.join(',');
                aggregate += row + '\r\n';
                return aggregate;
              }
              let transformedTrainingCSV = transformedTraining.reduce(createCSVString, '');
              let transformedTestingCSV = transformedTesting.reduce(createCSVString, '');
              let trainingParams = {
                Bucket: `${aws_container_name}/mldata`,
                Key: trainingName,
                Body: transformedTrainingCSV,
              };
              let testingParams = {
                Bucket: `${aws_container_name}/mldata`,
                Key: testingName,
                Body: transformedTestingCSV,
              };
              let options = { partSize: 10 * 1024 * 1024, queueSize: 1, };
              let trainingUploadResult = await s3.upload(trainingParams, options).promise();
              let testingUploadResult = await s3.upload(testingParams, options).promise();
              req.controllerData.transforms = Object.assign({}, req.controllerData.transforms, {
                transformations: function_transformations,
                trainingName,
                testingName,
                trainingUploadResult,
                testingUploadResult,
              });
              next();
            });
        });
    } else {
      next();
    }
  } catch (e) {
    logger.warn('Error in createS3DataSource: ', e);
    return next(e);
  }
}

/** 
 * Generate datasource in AWS Machine Learning
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function createAWSDataSource(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.datasource && req.controllerData.datasource.training_data_asset && req.controllerData.datasource.testing_data_asset) {
      let datasource = req.controllerData.datasource;
      let aws_configs = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].client;
      let aws_container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
      AWS.config.update({ region: aws_configs.region, });
      AWS.config.credentials = new AWS.Credentials(aws_configs.accessKeyId, aws_configs.accessKey, null);
      let machinelearning = new AWS.MachineLearning();
      let data_source_upload_date = new Date();
      let trainingParams = {
        DataSourceId: `${datasource.training_data_source_id}_${data_source_upload_date.getTime()}`,
        DataSpec: {
          DataLocationS3: (req.controllerData.transforms && req.controllerData.transforms.trainingUploadResult) ? `s3://${aws_container_name}/${req.controllerData.transforms.trainingUploadResult.Key}` : `s3://${aws_container_name}/${datasource.training_data_asset.attributes.cloudfilepath}`,
          DataSchema: datasource.data_schema,
        },
        ComputeStatistics: true,
        DataSourceName: `${datasource.display_name} Training Data - ${datasource.training_data_source_id}`,
      };

      let testingParams = {
        DataSourceId: `${datasource.testing_data_source_id}_${data_source_upload_date.getTime()}`,
        DataSpec: {
          DataLocationS3: (req.controllerData.transforms && req.controllerData.transforms.testingUploadResult) ? `s3://${aws_container_name}/${req.controllerData.transforms.testingUploadResult.Key}` : `s3://${aws_container_name}/${datasource.testing_data_asset.attributes.cloudfilepath}`,
          DataSchema: datasource.data_schema,
        },
        ComputeStatistics: false,
        DataSourceName: `${datasource.display_name} Testing Data - ${datasource.testing_data_source_id}`,
      };
      function getTrainingResponse(params) {
        return new Promise((resolve, reject) => {
          try {
            machinelearning.createDataSourceFromS3(params, function (err, data) {
              if (err) reject(err);
              else resolve(data);
            });
          } catch (err) {
            return reject(err);
          }
        });
      }

      async function uploadAWSDataSource() {
        try {
          let training_response = await getTrainingResponse(trainingParams);
          let testing_response = await getTrainingResponse(testingParams);
          if (training_response && testing_response) {
            req.controllerData.training_data_source_id = training_response.DataSourceId;
            req.controllerData.testing_data_source_id = testing_response.DataSourceId;
            req.controllerData.data_source_upload_date = data_source_upload_date;
          }
          next();
        } catch (e) {
          logger.warn('Error in uploadAWSDataSource: ', e);
          return next(e);
        }
      }

      uploadAWSDataSource();
    } else {
      next();
    }
  } catch (e) {
    logger.warn('Error in createS3DataSource: ', e);
    return next(e);
  }
}

/** 
 * Generate datasource in all available ML Providers
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function createProviderDataSources(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.aws = req.controllerData.aws || {};
    if (req.controllerData.datasource && req.controllerData.datasource.training_data_asset && req.controllerData.datasource.testing_data_asset) {
      // create AWS Datasource
      let { aws_training_response, aws_testing_response, data_source_upload_date, } = await helpers.createAWSDataSource(req);
      req.controllerData.aws = Object.assign({}, {
        training_data_source_id: aws_training_response.DataSourceId,
        testing_data_source_id: aws_testing_response.DataSourceId,
        data_source_upload_date: data_source_upload_date,
      })
      // create Other Datasources...
      next();
    } else {
      next();
    }
  } catch (e) {
    logger.warn('Error in createS3DataSource: ', e);
    return next(e);
  }
}

/** 
 * Generates data source in mongo
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function createMongoDataSource(req, res, next) {
  try {
    req.body = req.body || {};
    if (req.body && req.body.data) {
      let Datasource = periodic.datas.get('standard_datasource');
      let datasource = req.body.data;
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      let createOptions = {
        name: datasource.data_source_system_name,
        display_name: datasource.data_source_name,
        training_data_asset: datasource.training_asset._id,
        testing_data_asset: datasource.testing_asset._id,
        training_data_source_id: datasource.training_asset._id.toString(),
        testing_data_source_id: datasource.testing_asset._id.toString(),
        data_schema: JSON.stringify(datasource.data_schema),
        strategy_data_schema: JSON.stringify(datasource.strategy_data_schema),
        statistics: datasource.statistics,
        transformations: datasource.transformations || {},
        observation_count: datasource.csv_data_length,
        predictor_variable_count: datasource.csv_headers_length,
        user: req.user._id,
        organization,
      };
      Datasource.create(createOptions)
        .then(result => next())
        .catch(next);
    } else {
      return next();
    }
  } catch (e) {
    logger.warn('Error in createDataSource: ', e);
    return next(e);
  }
}

/**
 * Sends success response.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 */
function handleControllerDataResponse(req, res) {
  req.controllerData = req.controllerData || {};
  delete req.controllerData.authorization_header;
  let controllerData = Object.assign({}, req.controllerData);
  delete req.controllerData;
  delete req.body;
  return res.send((controllerData.useSuccessWrapper) ? {
    result: 'success',
    data: controllerData,
  } : controllerData);
}

/** 
 * Retrieves multiple datasources to be displayed on datasource index page
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function getDataSources(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Datasource = periodic.datas.get('standard_datasource');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let skip = req.query.pagenum ? ((Number(req.query.pagenum) - 1) * 10) : 0;
    let queryOptions = (['datasources', 'deleteTestCasesModal', ].indexOf(req.query.pagination) !== -1)
      ? { query: { organization, }, sort: {}, fields: ['name', 'display_name', 'createdat', 'user', 'status', ], }
      : req.body.query ? { query: Object.assign({}, req.body.query, organization), sort: {}, } : { query: { organization, }, sort: {}, };
    if (req.query.query) {
      queryOptions.query[ '$or' ] = [{
        name: new RegExp(req.query.query, 'gi'),
      }, {
        display_name: new RegExp(req.query.query, 'gi'),
      }, ];
    }
    Datasource.query(queryOptions)
      .then(datasources => {
        if (datasources && datasources.length) {
          datasources = datasources.map(datasource => {
            datasource = datasource.toJSON ? datasource.toJSON() : datasource;
            datasource.formattedCreatedAt = (datasource.createdat && datasource.user) ? `${transformhelpers.formatDateNoTime(datasource.createdat, user.time_zone)} by ${datasource.user.first_name} ${datasource.user.last_name}` : '';
            return datasource;
          });
          datasources = helpers.mergeSort(datasources, 'createdat');
          req.controllerData.datasources = datasources;
          if (req.query.pagination === 'datasources') {
            req.controllerData = Object.assign({}, req.controllerData, {
              rows: datasources.slice(skip),
              numPages: Math.ceil(datasources.length / 10),
              numItems: datasources.length,
            });
          }
        }
        return next();
      })
      .catch(e => {
        logger.error('Unable to query datasources', e);
        return next(e);
      });
  } catch (e) {
    logger.warn('Error in getDataSources: ', e);
  }
}

/** 
 * Get all models and put it on req.controllerData
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function getModels(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const MLModel = periodic.datas.get('standard_modelgroup');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let mlmodels = await MLModel.query({ query: { organization, }, });
    mlmodels = mlmodels.map(mlmodel => mlmodel.toJSON ? mlmodel.toJSON() : mlmodel);
    req.controllerData.mlmodels = mlmodels;
    return next();
  } catch (err) {
    logger.warn('Error in getModels: ', err);
  }
}

async function getMlModelsIndex(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const MLModel = periodic.datas.get('standard_modelgroup');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let pagenum = 1;
    if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
    let skip = 10 * (pagenum - 1);
    let queryOptions = { query: { organization, }, paginate: true, limit: 10, pagelength: 10, skip, sort: '-createdat', fields: ['name', 'display_name', 'type', 'createdat', 'user', 'status', 'progress', 'model_training_status', ], };
    if (req.query.query) {
      queryOptions.query[ '$or' ] = [{
        name: new RegExp(req.query.query, 'gi'),
      }, {
        type: new RegExp(req.query.query, 'gi'),
      }, {
        display_name: new RegExp(req.query.query, 'gi'),
      }, ];
    }
    let result = await MLModel.query(queryOptions);
    let mlmodels = (result && result[ '0' ] && result[ '0' ].documents) ? result[ '0' ].documents : [];
    mlmodels = mlmodels.map(mlmodel => {
      mlmodel = mlmodel.toJSON ? mlmodel.toJSON() : mlmodel;
      let formattedCreatedAt = (mlmodel.createdat && mlmodel.user) ? `${transformhelpers.formatDateNoTime(mlmodel.createdat, user.time_zone)} by ${mlmodel.user.first_name} ${mlmodel.user.last_name}` : '';
      let type = (mlmodel.type === 'regression') ? 'Linear' 
        : (mlmodel.type)
          ? capitalize(mlmodel.type)
          : '';
      let status = (mlmodel.status) ? capitalize.words(mlmodel.status.replace('_', ' ')) : '';
      let organization = mlmodel.organization._id.toString();
      let progress = Math.round(mlmodel.progress);
      let progressBar = {
        progress: progress,
        state: (mlmodel.status === 'Error' || mlmodel.status === 'failed')
          ? 'error'
          : (mlmodel.status === 'complete' || mlmodel.status === 'Complete' || mlmodel.progress === 100)
            ? 'success'
            : null,
      };
      return {
        _id: mlmodel._id,
        type,
        display_name: mlmodel.display_name,
        'datasource.display_name': mlmodel.datasource ? mlmodel.datasource.display_name : '',
        status,
        organization,
        progress: progress,
        progressBar,
        formattedCreatedAt,
      };
    });
    req.controllerData = Object.assign({}, req.controllerData, {
      numItems: result.collection_count,
      numPages: result.collection_pages,
      rows: mlmodels,
    });
    next();
  } catch (e) {
    logger.warn(e.message);
    req.error = e.message;
    next();
  }
}

/** 
 * Retrieves ml models to be displayed on models index page
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function getMLModels(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const MLModel = periodic.datas.get('standard_modelgroup');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let skip = req.query.pagenum ? ((Number(req.query.pagenum) - 1) * 10) : 0;
    let queryOptions = (['mlmodels', 'deleteTestCasesModal', ].indexOf(req.query.pagination) !== -1)
      ? { query: { organization, }, sort: {}, fields: ['name', 'display_name', 'type', 'createdat', 'user', 'status', 'progress', 'model_training_status', ], }
      : req.body.query ? { query: Object.assign({}, req.body.query, organization), sort: {}, } : { query: { organization, }, sort: {}, };
    if (req.query.query) {
      queryOptions.query[ '$or' ] = [{
        name: new RegExp(req.query.query, 'gi'),
      }, {
        type: new RegExp(req.query.query, 'gi'),
      }, {
        display_name: new RegExp(req.query.query, 'gi'),
      }, ];
    }
    MLModel.query(queryOptions)
      .then(mlmodels => {
        if (mlmodels && mlmodels.length) {
          mlmodels = mlmodels.map(mlmodel => {
            mlmodel = mlmodel.toJSON ? mlmodel.toJSON() : mlmodel;
            mlmodel.formattedCreatedAt = (mlmodel.createdat && mlmodel.user) ? `${transformhelpers.formatDateNoTime(mlmodel.createdat, user.time_zone)} by ${mlmodel.user.first_name} ${mlmodel.user.last_name}` : '';
            mlmodel.type = (mlmodel.type === 'regression')
              ? 'Linear'
              : mlmodel.type
                ? capitalize(mlmodel.type)
                : '';
            mlmodel.status = capitalize.words(mlmodel.status.replace('_', ' '));
            mlmodel.organization = mlmodel.organization._id.toString();
            // mlmodel.progressBar = { progress: mlmodel.progress, label: mlmodel.model_training_status || 'Complete', state: (mlmodel.progress === 100) ? 'success' : '', };
            let progress = Math.round(mlmodel.progress);
            mlmodel.progressBar = {
              progress: progress,
              state: (mlmodel.status === 'Error' || mlmodel.status === 'failed')
                ? 'error'
                : (mlmodel.status === 'complete' || mlmodel.status === 'Complete' || mlmodel.progress === 100)
                  ? 'success'
                  : null,
            };
            return mlmodel;
          });
          mlmodels = helpers.mergeSort(mlmodels, 'createdat');
          req.controllerData.mlmodels = mlmodels;
          if (req.query.pagination === 'mlmodels') {
            req.controllerData = Object.assign({}, req.controllerData, {
              rows: mlmodels.slice(skip),
              numPages: Math.ceil(mlmodels.length / 10),
              numItems: mlmodels.length,
            });
          }
        }
        return next();
      })
      .catch(e => {
        logger.error('Unable to query mlmodels', e);
        return next(e);
      });
  } catch (e) {
    logger.warn('Error in getMLModels: ', e);
  }
}

/**
 * Loads all the strategies for copying segments from another strategy
 * 
 * @param {*} req Express Request Object
 * @param {*} res Express Response Object
 * @param {*} next Express next function 
 */
function getProcessingModels(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let user = req.user;
    const MLModel = periodic.datas.get('standard_modelgroup');
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let queryOptions = (['mlsimulations', 'deleteTestCasesModal', ].indexOf(req.query.pagination) !== -1)
      ? { fields: ['display_name', ], query: { organization, }, }
      : { query: { organization, }, };
    MLModel.query(queryOptions)
      .then(mlmodels => {
        mlmodels = mlmodels.map(mlmodel => mlmodel.toJSON ? mlmodel.toJSON() : mlmodel);
        req.controllerData.mlmodels = mlmodels;
        return next();
      })
      .catch(e => {
        logger.error('Unable to query models', e);
        return next(e);
      });
  } catch (e) {
    logger.error('getProcessingModels error', e);
    return next(e);
  }
}

/** 
 * Formats model training request before kicking off model training process
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function formatModelCreate(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.data = req.controllerData.data || {};
    const Datasource = periodic.datas.get('standard_datasource');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    Datasource.query({
      query: {
        organization,
      },
    })
      .then(datasources => {
        if (datasources && datasources.length) {
          let dataFormOptions = datasources.reduce((returnData, datasource) => {
            let data_schema = (datasource.data_schema) ? JSON.parse(datasource.data_schema) : {};
            if (data_schema.attributes) {
              data_schema.attributes.forEach(attr => {
                if (attr.attributeName === 'historical_result' && attr.attributeType) {
                  let data_source_formoption_type = (attr.attributeType === 'NUMERIC') ? 'regression_data_source' : `${attr.attributeType.toLowerCase()}_data_source`;
                  returnData[ data_source_formoption_type ].push({ label: datasource.display_name, value: datasource._id, });
                }
              });
            }
            return returnData;
          }, {
            binary_data_source: [],
            regression_data_source: [],
            categorical_data_source: [],
          });
          req.controllerData = Object.assign({}, req.controllerData, {
            formoptions: dataFormOptions,
            data: {
              type: 'binary',
            },
          });
          return next();
        } else {
          return next();
        }
      })
      .catch(next);
  } catch (e) {
    logger.warn('Error in formatModelCreate: ', e);
    return next(e);
  }
}

// old version
/** 
 * Generates mongo machine learning model and initial mongo batch prediction documents
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function createMongoMLModelandBatches(req, res, next) {
  try {
    let redisClient = periodic.app.locals.redisClient;
    const MLModel = periodic.datas.get('standard_modelgroup');
    const BatchPrediction = periodic.datas.get('standard_modelgroupbatchprediction');
    req.controllerData = req.controllerData || {};
    if (req.body && req.controllerData.datasource && req.controllerData.datasource.training_data_asset && req.controllerData.datasource.testing_data_asset) {
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      let variableMap = req.controllerData.variableMap;
      let datasource = req.controllerData.datasource;
      let name = req.body.name.toLowerCase().replace(/\s+/g, '_');
      let model_createdat = req.controllerData.data_source_upload_date;
      let strategy_data_schema = JSON.parse(datasource.strategy_data_schema);
      let data_schema_attributes = (datasource && datasource.data_schema) ? JSON.parse(datasource.data_schema).attributes : [];
      let model_variables = {};
      data_schema_attributes.forEach(el => {
        // let transformation_function = (datasource.transformations && datasource.transformations[el.attributeName]) ? datasource.transformations[el.attributeName].evaluator : '';
        if (el.attributeName === 'historical_result') return;
        if (variableMap[ el.attributeName ]) model_variables[ el.attributeName ] = { variable_id: variableMap[ el.attributeName ], data_type: strategy_data_schema[ el.attributeName ].data_type, };
        else model_variables[ el.attributeName ] = { variable_id: '', data_type: strategy_data_schema[ el.attributeName ].data_type, };
      });
      let createOptions = {
        name,
        datasource: datasource._id.toString(),
        display_name: req.body.name,
        description: req.body.description,
        training_data_source_id: `${datasource.training_data_source_id}_${model_createdat.getTime()}`,
        testing_data_source_id: `${datasource.testing_data_source_id}_${model_createdat.getTime()}`,
        type: req.body.type,
        batch_training_status: '',
        batch_testing_status: '',
        evaluation_status: '',
        batch_training_id: null,
        batch_testing_id: null,
        evaluation_id: null,
        real_time_endpoint: null,
        real_time_endpoint_status: null,
        user: user._id,
        organization,
        variables: model_variables,
        createdat: model_createdat,
        status: 'data_transformation',
        progress: 0,
        observation_count: datasource.observation_count,
        predictor_variable_count: datasource.predictor_variable_count,
      };
      let mlmodel;
      return MLModel.create(createOptions)
        .then(createdModel => {
          if (createdModel) {
            createdModel = createdModel.toJSON ? createdModel.toJSON() : createdModel;
            mlmodel = createdModel;

            let trainingBatchOptions = {
              name: `${name}_training_batch_prediction`,
              type: 'training',
              mlmodel: createdModel._id.toString(),
              display_name: `${req.body.name} Training Batch Prediction`,
              user: user._id,
              organization,
              status: 'not_initialized',
              createdat: model_createdat,
              original_datasource_filename: datasource.training_data_asset.attributes.original_filename || null,
            };

            let testingBatchOptions = {
              name: `${name}_testing_batch_prediction`,
              type: 'testing',
              mlmodel: createdModel._id.toString(),
              display_name: `${req.body.name} Testing Batch Prediction`,
              user: user._id,
              organization,
              status: 'not_initialized',
              createdat: model_createdat,
              original_datasource_filename: datasource.testing_data_asset.attributes.original_filename || null,
            };

            return Promise.all([BatchPrediction.create(trainingBatchOptions), BatchPrediction.create(testingBatchOptions), ])
              .then(results => {
                let [trainingBatch, testBatch, ] = results;
                trainingBatch = trainingBatch.toJSON ? trainingBatch.toJSON() : trainingBatch;
                testBatch = testBatch.toJSON ? testBatch.toJSON() : testBatch;
                redisClient.hmset(`machinelearning:${mlmodel._id.toString()}`, {
                  data_source_training_status: false,
                  data_source_testing_status: false,
                  ml_model_status: false,
                  datasource: mlmodel.datasource.toString(),
                  'training_data_source_id': mlmodel.training_data_source_id,
                  'testing_data_source_id': mlmodel.testing_data_source_id,
                  // 'model_id': 'TESTMODEL9',
                  aws_model_id: `${mlmodel._id.toString()}_${mlmodel.createdat.getTime()}`,
                  'model_id': mlmodel._id.toString(),
                  batch_training_id: '',
                  batch_training_mongo_id: trainingBatch._id.toString(),
                  batch_training_aws_id: `${trainingBatch._id.toString()}_${trainingBatch.createdat.getTime()}`,
                  batch_testing_id: '',
                  batch_testing_mongo_id: testBatch._id.toString(),
                  batch_testing_aws_id: `${testBatch._id.toString()}_${trainingBatch.createdat.getTime()}`,
                  evaluation_id: '',
                  real_time_endpoint: '',
                  real_time_endpoint_status: '',
                  model_name: mlmodel.name,
                  model_type: mlmodel.type,
                  progress: 0,
                  organization: organization.toString(),
                });
                next();
              })
              .catch(e => {
                logger.warn('Error in mongo batch prediction creation: ', e);
                next(e);
              });
          } else {
            logger.warn('Did not create batch predictions after creating mlmodel');
            next();
          }
        })
        .catch(e => {
          logger.warn('Error in createMongoMLModelandBatches: ', e);
          next(e);
        });
    } else {
      return next();
    }
  } catch (e) {
    logger.warn('Error in createMongoMLModel: ', e);
    return next(e);
  }
}

async function createMongoModelGroup(req, res, next) {
  try {
    let redisClient = periodic.app.locals.redisClient;
    const ModelGroup = periodic.datas.get('standard_modelgroup');
    const BatchPrediction = periodic.datas.get('standard_modelgroupbatchprediction');
    req.controllerData = req.controllerData || {};
    if (req.body && req.controllerData.datasource && req.controllerData.datasource.training_data_asset && req.controllerData.datasource.testing_data_asset) {
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      let model_createdat = req.controllerData.aws.data_source_upload_date;
      let datasource = req.controllerData.datasource;
      let name = req.body.name.toLowerCase().replace(/\s+/g, '_');
      // AWS MODEL CONFIG SETUP
      let aws_model_configs = await helpers.createAWSMongoModelConfigs(req);
      // OTHER MODEL CONFIG SETUP
      // e.g. let ibm_model_configs = await helpers.createIBMMongoModelConfigs(req);
      // e.g. let microsoft_model_configs = await helpers.createMicrosoftMongoModelConfigs(req);
      // MONGO MODEL DOCUMENT SETUP
      let modelCreateOptions = {
        name,
        datasource: datasource._id.toString(),
        display_name: req.body.name,
        description: req.body.description,
        training_data_source_id: `${datasource.training_data_source_id}_${model_createdat.getTime()}`,
        testing_data_source_id: `${datasource.testing_data_source_id}_${model_createdat.getTime()}`,
        type: req.body.type,
        // batch_training_status: '',
        // batch_testing_status: '',
        // evaluation_status: '',
        // batch_training_id: null,
        // batch_testing_id: null,
        // evaluation_id: null,
        // real_time_endpoint: null,
        // real_time_endpoint_status: null,
        user: user._id,
        organization,
        variables: aws_model_configs.model_variables,
        createdat: model_createdat,
        selected_provider: 'aws',
        // status: 'data_transformation',
        // progress: 0,
        observation_count: datasource.observation_count,
        predictor_variable_count: datasource.predictor_variable_count,
        aws: aws_model_configs,
        ibm: {}, // ibm_model_configs,
        microsoft: {}, // microsoft_model_configs,
      };
      // AWS MONGO MODEL CREATION
      let mlmodel = await ModelGroup.create({ newdoc: modelCreateOptions, });
      mlmodel = mlmodel.toJSON ? mlmodel.toJSON() : mlmodel;
      
      let trainingAWSBatchOptions = {
        name: `${name}_training_batch_prediction`,
        type: 'training',
        provider: 'aws',
        mlmodel: mlmodel._id.toString(),
        display_name: `${req.body.name} Training Batch Prediction`,
        user: user._id,
        organization,
        status: 'not_initialized',
        createdat: model_createdat,
        original_datasource_filename: datasource.training_data_asset.attributes.original_filename || null,
      };

      let testingAWSBatchOptions = {
        name: `${name}_testing_batch_prediction`,
        type: 'testing',
        provider: 'aws',
        mlmodel: mlmodel._id.toString(),
        display_name: `${req.body.name} Testing Batch Prediction`,
        user: user._id,
        organization,
        status: 'not_initialized',
        createdat: model_createdat,
        original_datasource_filename: datasource.testing_data_asset.attributes.original_filename || null,
      };
      
      let [trainingBatch, testBatch, ] = await Promise.all([BatchPrediction.create(trainingAWSBatchOptions), BatchPrediction.create(testingAWSBatchOptions), ]);
      // REDIS STAGING
      let aws_options = { mlmodel, organization, trainingBatch, testBatch, };
      let redisOptions = { aws_options, };
      await helpers.stageRedisForMLCrons(redisOptions, redisClient);
      next();
    } else {
      return next();
    }
  } catch (e) {
    logger.warn('Error in createMongoModelGroup: ', e);
    return next(e);
  }
}

/** 
 * Retrieves batch analysis data
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function getBatchAnalysisData(req, res, next) {
  try {
    if (req.body.init) {
      res.status(200).send({
        result: 'success',
        data: {},
        _children: {
          optimization_chart_card: [],
        },
      });
    } else {
      const MLModel = periodic.datas.get('standard_modelgroup');
      let _id = (req.method === 'POST') ? req.body.selected_model : req.query.model_id;
      MLModel.load({ query: { _id, }, })
        .then(model => {
          if (model) {
            model = model.toJSON ? model.toJSON() : model;
            req.controllerData = req.controllerData || {};
            req.controllerData.data = model;
            next();
          } else {
            res.status(200).send({
              result: 'success',
              data: {},
            });
          }
        })
        .catch(e => {
          next(e);
        });
    }
  } catch (e) {
    next(e);
  }
}

/** 
 * Generates model evaluation dropdown
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function getModelEvaluationDropdown(req, res, next) {
  try {
    const MLModel = periodic.datas.get('standard_mlmodel');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    MLModel.query({ query: { status: 'complete', organization, }, })
      .then(models => {
        req.controllerData = req.controllerData || {};
        req.controllerData.data = req.controllerData.data || {};
        req.controllerData.formoptions = {
          selected_model: models.map(model => {
            model = model.toJSON ? model.toJSON() : model;
            return { label: `${model.display_name} - ${capitalize((model.type === 'regression') ? 'linear' : model.type)}`, value: model._id, };
          }),
        };
        next();
      })
      .catch(e => {
        next(e);
      });
  } catch (e) {
    next(e);
  }
}

/**
 * Retrieves batch prediction data from AWS s3
 * @param {Object} batchdata Batch data configuration for the data that will be downloaded from AWS s3
 */
function fetchPredictionDataAsync({ batchdata = {}, }) {
  return new Promise((resolve, reject) => {
    try {
      let { mlmodel, name, _id, datasource_filename, createdat, } = batchdata;
      let aws_container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
      let s3Params = {
        Bucket: `${aws_container_name}/mldata/batch_predictions/${mlmodel._id.toString()}_${createdat.getTime()}_${name}/batch-prediction/result`,
        Key: `${_id.toString()}_${createdat.getTime()}-${datasource_filename}.gz`,
      };
      let aws_configs = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].client;
      AWS.config.update({ region: aws_configs.region, });
      AWS.config.credentials = new AWS.Credentials(aws_configs.accessKeyId, aws_configs.accessKey, null);
      let s3 = new AWS.S3();
      const s3PStream = s3.getObject(s3Params).createReadStream();
      let batchcsv = [];
      const gunzip = zlib.createGunzip();
      s3PStream.pipe(gunzip).pipe(csv())
        .on('data', (data) => {
          batchcsv.push(data);
        })
        .on('error', function (e) {
          logger.warn(`Invalid csv format: ${e.message}`);
          reject(e);
        })
        .on('end', function () {
          return resolve(batchcsv);
        });
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Retrieves data source associated with selected batch prediction AWS s3
 * @param {Object} batchdata Batch data configuration for the data that will be downloaded from AWS s3
 */
function fetchBatchDataSourceAsync({ batchdata = {}, }) {
  return new Promise((resolve, reject) => {
    try {
      let { mlmodel, name, _id, datasource_filename, original_datasource_filename, } = batchdata;
      let aws_container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
      let s3Params = {
        Bucket: `${aws_container_name}/mldata`,
        Key: original_datasource_filename || datasource_filename,
      };
      let aws_configs = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].client;
      AWS.config.update({ region: aws_configs.region, });
      AWS.config.credentials = new AWS.Credentials(aws_configs.accessKeyId, aws_configs.accessKey, null);
      let s3 = new AWS.S3();
      const s3Stream = s3.getObject(s3Params).createReadStream();
      let batchcsv = [];
      s3Stream.pipe(csv())
        .on('data', (data) => {
          batchcsv.push(data);
        })
        .on('error', function (e) {
          logger.warn(`Invalid csv format: ${e.message}`);
          reject(e);
        })
        .on('end', function () {
          return resolve(batchcsv);
        });
    } catch (err) {
      return reject(err);
    }
  });
}

/** 
 * Downloads batch prediction data
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function downloadBatchData(req, res) {
  if (req.controllerData.data) {
    let batchdata = req.controllerData.data;
    let model_type = batchdata.mlmodel.type || 'binary';
    Promise.all([fetchBatchDataSourceAsync({ batchdata, }), fetchPredictionDataAsync({ batchdata, }), ])
      .then(([datasource, predictions, ]) => {
        let prediction_headers = predictions[0];
        if (model_type === 'categorical') {
          predictions = predictions.map((row, idx) => {
            if (!idx) return ['predicted_result', ];
            else {
              row.shift();
              let numRows = row.map(stringNum => {
                if (isNaN(Number(stringNum))) return 0;
                else return Number(stringNum); 
              });
              return prediction_headers[numRows.indexOf(Math.max(...numRows)) + 1];
            }
          });
        } else {
          predictions = predictions.map((row, idx) => {
            if (!idx) return ['predicted_result', ];
            else return row.slice(-1);
          });
        }
        if (Array.isArray(datasource) && Array.isArray(predictions) && (datasource.length === predictions.length)) {
          let combined = datasource.map((row, idx) => row.concat(predictions[ idx ]));
          let csvContent = '';
          combined.forEach(function (rowArray) {
            let row = rowArray.join(',');
            csvContent += row + '\r\n';
          });
          res.set('Content-Type', 'text/csv');
          res.attachment(`${batchdata.name}_${new Date()}.csv`);
          res.status(200).send(csvContent).end();
        } else {
          throw new Error('Failed to download batchdata');
        }
      })
      .catch(e => {
        logger.warn(e.message);
        return res.status(500).send({
          status: 500,
          data: {
            error: 'Failed to download batchdata.',
          },
        });
      });
  } else {
    return res.status(500).send({
      status: 500,
      data: {
        error: 'Failed to download batchdata.',
      },
    });
  }
}

/** 
 * Downloads uploaded datasource data
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
function downloadDataSourceData(req, res) {
  try {
    if (req.controllerData.data && req.query.scope) {
      let datasource = req.controllerData.data;
      let datasourceAsync = [];
      if (req.query.scope !== 'testing' && datasource.training_data_asset) {
        datasourceAsync.push({ datasource_filename: datasource.training_data_asset.attributes.original_filename, });
      }
      if (req.query.scope !== 'training' && datasource.testing_data_asset) {
        datasourceAsync.push({ datasource_filename: datasource.testing_data_asset.attributes.original_filename, });
      }
      Promise.all(datasourceAsync.map(batchdata => fetchBatchDataSourceAsync({ batchdata, })))
        .then(([ training, testing, ]) => {
          training = Array.isArray(training) ? training : [];
          testing = Array.isArray(testing) ? testing : [];
          if (training.length && testing.length) testing.shift();
          let combined = training.concat(testing);
          let csvContent = '';
          combined.forEach(function (rowArray) {
            rowArray = rowArray.map(el => {
              if (el.indexOf(',') !== -1) return `"${el}"`;
              else return el;
            });
            let row = rowArray.join(',');
            csvContent += row + '\r\n';
          });
          res.set('Content-Type', 'text/csv');
          res.attachment(`${datasource.name.replace('.csv', '')}_${new Date()}.csv`);
          res.status(200).send(csvContent).end();
        })
        .catch(e => {
          throw new Error('Failed to download datasource file');
        });
    } else {
      throw new Error('Failed to download datasource file');
    }
  } catch (e) {
    return res.status(500).send({
      status: 500,
      data: {
        error: 'Failed to download batchdata.',
      },
    });
  }
}

/** 
 * Retrieves batch prediction mongo document
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function getBatchData(req, res, next) {
  try {
    const BatchPrediction = periodic.datas.get('standard_modelgroupbatchprediction');
    req.controllerData = req.controllerData || {};
    req.controllerData.data = req.controllerData.data || {};
    if (req.params.id) {
      BatchPrediction.load({ query: { _id: req.params.id, }, })
        .then(batch => {
          if (!batch) throw new Error('Could not find matching batch.');
          else {
            req.controllerData.data = batch.toJSON ? batch.toJSON() : batch;
            next();
          }
        })
        .catch(e => {
          logger.warn(e.message);
          return res.status(500).send({
            status: 500,
            data: {
              error: 'Failed to find matching batch data.',
            },
          });
        });
    } else {
      return res.status(500).send({
        status: 500,
        data: {
          error: 'Failed to find matching batch data.',
        },
      });
    }
  } catch (e) {
    logger.warn(e.message);
    return res.status(500).send({
      status: 500,
      data: {
        error: 'Failed to find matching batch data.',
      },
    });
  }
}

/** 
 * Deletes data source from mongo
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function deleteDataSource(req, res, next) {
  try {
    const Datasource = periodic.datas.get('standard_datasource');
    req.controllerData = req.controllerData || {};
    if (req.params && req.params.id) {
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      Datasource.delete({ deleteid: req.params.id, organization, })
        .then(() => next())
        .catch(next);
    } else {
      next();
    }
  } catch (e) {
    logger.warn('Error in deleteDataSource: ', e);
  }
}

/** 
 * Retreives page data
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function getPageData(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.data = req.controllerData.data || {};
    req.controllerData.data = {
      params: req.params,
    };
    next();
  } catch (e) {
    return res.status(500).send({
      status: 500,
      data: {
        error: 'Failed to get page link',
      },
    });
  }
}

/** 
 * Retreives mongo model data
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function getModel(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const MLModel = periodic.datas.get('standard_modelgroup');
    let modelId = (req.params.id)
      ? req.params.id
      : (req.body.selected_model)
        ? req.body.selected_model
        : '';
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let query = (organization !== 'organization') ? { _id: modelId, organization, } : { _id: modelId, };
    MLModel.load({ query, })
      .then(mlmodel => {
        if (!mlmodel) return res.status(500).send({
          status: 500,
          data: {
            error: 'Could not find the resource.',
          },
        });
        mlmodel = mlmodel.toJSON ? mlmodel.toJSON() : mlmodel;
        req.controllerData.data = mlmodel;
        return next();
      })
      .catch(next);
  } catch (e) {
    return next(e);
  }
}

/**
 * Retreives mongo model data by name
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function getModelByName(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const MLModel = periodic.datas.get('standard_modelgroup');
    let modelname = req.body.model_name;
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let query = (organization !== 'organization') ? { name: modelname, organization, } : { name: modelname, };
    MLModel.load({ query, })
      .then(mlmodel => {
        if (!mlmodel) return res.status(500).send({
          status: 500,
          data: {
            error: 'Could not find the resource.',
          },
        });
        mlmodel = mlmodel.toJSON ? mlmodel.toJSON() : mlmodel;
        req.controllerData.data = mlmodel;
        return next();
      })
      .catch(next);
  } catch (e) {
    return next(e);
  }
}

/** 
 * Updates model description (Only field that is allowed to be updated in UI)
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function updateModel(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const MLModel = periodic.datas.get('standard_modelgroup');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    MLModel.update({ isPatch: true, id: req.params.id, updatedoc: { updatedat: new Date(), description: req.body.description, }, })
      .then(mlmodel => {
        return next();
      })
      .catch(next);
  } catch (e) {
    logger.warn('Error in updateModel: ', e);
    return next(e);
  }
}

/** 
 * Updates data source based on user inputted data type schema
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function updateDataSource(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Datasource = periodic.datas.get('standard_datasource');
    if (req.body && req.body.data_source_variables && req.query.method === 'saveDataSchema') {
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      let updated_data_schema = {
        attributes: [],
        dataFileContainsHeader: true,
        dataFormat: 'CSV',
        targetAttributeName: 'historical_result',
        version: '1.0',
      };
      let data_source_variables = req.body.data_source_variables;
      let data_type_map = {
        'Boolean': 'BINARY',
        'Number': 'NUMERIC',
        'String': 'CATEGORICAL',
        'Date': 'CATEGORICAL',
      };
      data_source_variables.forEach(variable => {
        updated_data_schema.attributes.push({ attributeName: variable.uploaded_variable_name, attributeType: (variable.data_type === 'Number' && variable.distinct_category) ? 'CATEGORICAL' : data_type_map[ variable.data_type ], });
      });
      updated_data_schema = JSON.stringify(updated_data_schema);
      Datasource.update({ isPatch: true, id: req.params.id, updatedoc: { updatedat: new Date(), data_schema: updated_data_schema, }, })
        .then(datasource => {
          return next();
        })
        .catch(next);
    } else if (req.body && req.query.method === 'saveDataTransformations') {
      let transformations = {};
      let allVariables = Object.keys(req.body);
      let statistics = {};
      Datasource.load({ query: { _id: req.params.id, }, })
        .then(datasource => {
          datasource = datasource.toJSON ? datasource.toJSON() : datasource;
          return datasource;
        })
        .then(datasrc => {
          allVariables.forEach(variable => {
            statistics[ variable ] = datasrc.statistics[ variable ] || {};
            if (statistics[ variable ].transform_functions.length) {
              statistics[ variable ].transform_functions = datasrc.statistics[ variable ].transform_functions.map((config, i) => {
                if (config) {
                  config.selected = (req.body[ variable ] && req.body[ variable ][ i ] && req.body[ variable ][ i ].selected) ? true : false;
                }
                return config;
              });
              req.body[ variable ].forEach(var_config => {
                if (var_config && var_config.selected && var_config.type !== 'None' && var_config.type !== 'Linear') {
                  transformations[ variable ] = transformations[ variable ] || {};
                  transformations[ variable ].evaluator = var_config.evaluator;
                  transformations[ variable ].type = var_config.type;
                }
              });
            } else {
              return;
            }
          });
          datasrc.statistics = statistics;
          datasrc.transformations = transformations;
          datasrc.updatedat = new Date();
          Datasource.update({ isPatch: false, id: req.params.id, updatedoc: datasrc, })
            .then(datasource => {
              return next();
            })
            .catch(next);
        })
        .catch(next);
    }
  } catch (e) {
    logger.warn('Error in updateDataSource: ', e);
    return next(e);
  }
}

/** 
 * Deletes ML Model and all associated AWS ML evaluations, batch predictions, real time endpoints
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function deleteMLModel(req, res, next) {
  try {
    const MLModel = periodic.datas.get('standard_modelgroup');
    const Strategy = periodic.datas.get('standard_strategy');
    const BatchPrediction = periodic.datas.get('standard_modelgroupbatchprediction');
    let aws_configs = THEMESETTINGS.machinelearning;
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    AWS.config.update({ region: aws_configs.region, });
    AWS.config.credentials = new AWS.Credentials(aws_configs.key, aws_configs.secret, null);
    AWS.config.setPromisesDependency(require('promisie'));
    let machinelearning = new AWS.MachineLearning();
    let mlmodel = await MLModel.load({ query: { _id: req.params.id, }, });
    mlmodel = mlmodel.toJSON ? mlmodel.toJSON() : mlmodel;
    let strategies = mlmodel.strategies || [];
    strategies = strategies.reduce((aggregate, strategy) => {
      if (aggregate.indexOf(strategy.toString()) === -1) aggregate.push(strategy.toString());
      return aggregate;
    }, []);
    let retrievedStrategies = await Strategy.query({ query: { _id: strategies, }, limit: 1000000, });
    retrievedStrategies.filter(strategy => !!strategy);
    if (retrievedStrategies.length) {
      return res.status(500).send({
        status: 500,
        data: {
          error: 'There is a strategy using this model. Please remove the model from the strategy before deleting.',
        },
      });
    } else {
      if (mlmodel.batch_training_id) {
        await machinelearning.deleteBatchPrediction({
          BatchPredictionId: `${mlmodel.batch_training_id._id.toString()}_${mlmodel.batch_training_id.createdat.getTime()}`, /* required */
        }).promise();
        await BatchPrediction.delete({ deleteid: mlmodel.batch_training_id._id.toString(), });
      }
      if (mlmodel.batch_testing_id) {
        await machinelearning.deleteBatchPrediction({
          BatchPredictionId: `${mlmodel.batch_testing_id._id.toString()}_${mlmodel.batch_testing_id.createdat.getTime()}`,
        }).promise();
        await BatchPrediction.delete({ deleteid: mlmodel.batch_testing_id._id.toString(), });
      }
      if (mlmodel.evaluation_id) {
        await machinelearning.deleteEvaluation({
          EvaluationId: mlmodel.evaluation_id,
        }).promise();
      }
      if (mlmodel.real_time_prediction_id) {
        await machinelearning.deleteRealtimeEndpoint({
          MLModelId: mlmodel.real_time_prediction_id,
        }).promise();
        await machinelearning.deleteMLModel({
          MLModelId: mlmodel.real_time_prediction_id,
        }).promise();
      }
      await MLModel.delete({ deleteid: req.params.id, organization, });
      return next();
    }
  } catch (e) {
    next(e);
  }
}

// /**
//  * Gets all documents
//  * 
//  * @param {Object} req Express request object
//  * @param {Object} res Express response object
//  * @param {Function} next Express next function
//  * 
//  */
// async function getDocuments(req, res, next) {
//   req.controllerData = req.controllerData || {};
//   const Document = periodic.datas.get(`standard_${pluralize.singular(req.query.pagination)}`);
//   let user = req.user;
//   let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
//   let documents = await Document.query({ query: { organization, }, });
//   documents = documents.map(data => data.toJSON ? data.toJSON() : data);
//   if ([ 'ocrdocuments', 'templatedocuments', ].indexOf(req.query.pagination) !== -1) {
//     req.query.pagenum = req.query.pagenum || 1;
//     let startIndex = 10 * (req.query.pagenum - 1);
//     let endIndex = 10 * req.query.pagenum;
//     let rows = helpers.mergeSort(documents, 'name').reverse().slice(startIndex, endIndex);
//     req.controllerData = Object.assign({}, req.controllerData, {
//       documents,
//       rows,
//       numPages: Math.ceil(documents.length / 10),
//       numItems: documents.length,
//     });
//   } else {
//     req.controllerData.documents = documents;
//   }
//   return next();
// }

/**
 * Get single data integration
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function getDocument(req, res, next) {
  req.controllerData = req.controllerData || {};
  const OCRDocument = periodic.datas.get('standard_ocrdocument');
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  let query = (req.user) ? { _id: req.params.id || req.body.id, organization, } : { _id: req.params.id || req.body.id, };
  let doc = await OCRDocument.load({ query, });
  doc = doc.toJSON ? doc.toJSON() : doc;
  req.controllerData.doc = doc;
  if (req.query.download_document) req.controllerData.data = { name: doc.filename, fileurl: `templatedocuments/${doc.filename}.pdf`, };
  return next();
}

/**
 * Updates document.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function updateDocument(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const OCRDocument = periodic.datas.get('standard_ocrdocument');
    await OCRDocument.update({
      id: req.params.id || req.body.id,
      updatedoc: (req.query && req.query.update === 'description') ? { description: req.body.description || '', } : req.body,
      isPatch: req.controllerData.isPatch === undefined ? true : req.controllerData.isPatch,
    });
    return next();
  } catch (e) {
    logger.error('Unable to update document', e);
    return next(e);
  }
}

/**
 * Updates document variables.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function updateOCRDocumentVariables(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Document = periodic.datas.get(`standard_${req.query.type}`);
    let unflattenedReqBody = unflatten(req.body);
    req.controllerData.doc.outputs = req.controllerData.doc.outputs.map((output, idx) => {
      if (unflattenedReqBody.variables && unflattenedReqBody.variables[ idx ] && unflattenedReqBody.variables[ idx ].output_variable) {
        return Object.assign({}, output, unflattenedReqBody.variables[ idx ]);
      } else {
        return Object.assign({}, output, { output_variable: '', });
      }
    });
    await Document.update({
      id: req.params.id || req.body.id,
      updatedoc: req.controllerData.doc,
      isPatch: false,
    });
    return next();
  } catch (e) {
    logger.error('Unable to update document', e);
    return next(e);
  }
}

/**
 * Flips document status.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
function flipDocumentStatus(req, res, next) {
  req.controllerData = req.controllerData || {};
  req.body = req.controllerData.doc.status === 'active' ? { status: 'inactive', } : { status: 'active', };
  return next();
}

async function getInputVariables(req, res, next) {
  try {
    const Variable = periodic.datas.get('standard_variable');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let variables = await Variable.model.find({ organization, type: 'Input', });
    req.controllerData = req.controllerData || {};
    variables = variables.map(variable => variable.toJSON ? variable.toJSON() : variable);
    req.controllerData.input_variables = variables;
    next();
  } catch (e) {
    req.controllerData.input_variables = [];
    next();
  }
}

// async function uploadOCRTemplateToAWS(req, res, next) {
//   try {
//     const Variable = periodic.datas.get('standard_variable');
//     let user = req.user;
//     let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
//     req.controllerData.isPatch = false;
//     let original_filename = req.controllerData.original_filenames[ 0 ];
//     if (original_filename) original_filename = original_filename.replace('.pdf', '');
//     if (Array.isArray(req.controllerData.local_image_files) && req.controllerData.local_image_files.length) {
//       let template_filepaths = req.controllerData.local_image_files[ 0 ] || [];
//       let aws_file_keys = await Promise.all(template_filepaths.map(async (filepath, idx) => {
//         let file = await fs.readFile(filepath);
//         let filename = `${new Date().getTime()}_${idx}_${original_filename}.png`;
//         let options = {
//           Key: `ocr_templates/${filename}`,
//           Body: file,
//         };
//         await helpers.uploadAWS(options);
//         return filename;
//       }));
//       req.body = Object.assign({}, req.controllerData.doc, { files: aws_file_keys, });
//     }
//     next();
//   } catch (e) {

//     next();
//   }
// }

/**
 * This function uses the AWS machine learning instance to make an API call to the specified AWS Machine Learning Model and returns the prediction details
 * @param {*} configuration ML configuration object
 * @param {Object} state global state
 * @param {Object} machinelearning AWS machine learning instance
 */
async function predictSingleMLCase(req, res, next) {
  try {
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const Mlcase = periodic.datas.get('standard_mlcase');
    let aws_configs = THEMESETTINGS.machinelearning;
    AWS.config.update({ region: aws_configs.region, });
    AWS.config.credentials = new AWS.Credentials(aws_configs.key, aws_configs.secret, null);
    AWS.config.setPromisesDependency(require('promisie'));
    let machinelearning = new AWS.MachineLearning();
    let base_variables = Object.keys(req.controllerData.data.variables).reduce((aggregate, variable) => {
      aggregate[ variable ] = null;
      return aggregate;
    }, {});
    let ml_variables = Object.assign({}, base_variables, req.controllerData.ml_inputs);
    Object.keys(ml_variables).forEach(variable => {
      ml_variables[ variable ] = (typeof ml_variables[ variable ] === 'string') ? ml_variables[ variable ].replace(/,/gi, '') : ml_variables[ variable ];
    });
    let params = {
      MLModelId: req.controllerData.data.real_time_prediction_id,
      PredictEndpoint: req.controllerData.data.real_time_endpoint,
      Record: ml_variables,
    };
    let count = await getCollectionCounter('standard_mlcase');
    let result = await machinelearning.predict(params).promise();
    req.controllerData.single_ml_result = {
      inputs: ml_variables,
      prediction: result,
      decision_name: req.body.decision_name || `Case ${count}`,
      model_name: req.controllerData.data.display_name,
      processing_type: 'individual',
      model_type: req.controllerData.data.type,
      user: user._id.toString(),
      organization,
      case_number: '',
    };
    next();
  } catch (e) {
    let errResp = {};
    if (req.controllerData.transactionParams) {
      errResp = {
        status_code: 400,
        status_message: 'Error',
        errors: [{
          message: 'Error predicting ML Case.',
        }, ], 
      };
    } else {
      errResp = {
        message: 'Error predicting ML Case.',
      };
    }
      
    res.status(500).send(errResp);
  }
}

async function createIndividualMLCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const MLCase = periodic.datas.get('standard_mlcase');
    if (req.controllerData.single_ml_result) {
      let newDoc = req.controllerData.single_ml_result;
      let createdCase = await MLCase.create(newDoc);
      res.status(200).send({
        status: 200,
        timeout: 10000,
        type: 'success',
        text: 'Changes saved successfully!',
        successProps: {
          successCallback: 'func:this.props.reduxRouter.push',
        },
        responseCallback: 'func:this.props.reduxRouter.push',
        pathname: `/optimization/individual/results/${createdCase._id.toString()}`,
      });
    } else {
      res.status(500).send({ message: 'Error creating ML Case.', });
    }
  } catch (e) {
    res.status(500).send({ message: 'Error creating ML Case.', });
  }
}


/** 
 * Retrieves ml cases to be displayed on individual results index page
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function getIndividualMLCases(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const MLCase = periodic.datas.get('standard_mlcase');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let pagenum = 1;
    if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
    let skip = 10 * (pagenum - 1);
    let queryOptions = { query: { organization, processing_type: 'individual', }, paginate: true, limit: 10, pagelength: 10, skip, sort: '-createdat', };
    if (req.query.query) {
      queryOptions.query[ '$or' ] = [{
        model_name: new RegExp(req.query.query, 'gi'),
      }, {
        decision_name: new RegExp(req.query.query, 'gi'),
      }, ];
    }
    let result = await MLCase.query(queryOptions);
    let cases = (result && result[ '0' ] && result[ '0' ].documents) ? result[ '0' ].documents : [];
    cases = cases.map(cs => {
      cs = cs.toJSON ? cs.toJSON() : cs;
      let formattedCreatedAt = (cs.createdat) ? `${transformhelpers.formatDate(cs.createdat, user.time_zone)}` : '';
      let decision_name = (cs.decision_name) ? cs.decision_name : `Case ${cs.case_number}`;
      return {
        _id: cs._id,
        model_name: cs.model_name,
        formattedCreatedAt,
        decision_name,
      };
    });
    req.controllerData = Object.assign({}, req.controllerData, {
      rows: cases,
      numItems: result.collection_count,
      numPages: result.collection_pages,
    });
    return next();
  } catch (e) {
    logger.warn('Error finding ML Cases.');
  }
}

/** 
 * Retrieves ml cases to be displayed on individual results index page
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function getMLBatchSimulations(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const MLSimulation = periodic.datas.get('standard_mlsimulation');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let pagenum = 1;
    if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
    let skip = 10 * (pagenum - 1);
    let queryOptions = { query: { organization, }, paginate: true, limit: 10, pagelength: 10, skip, sort: '-createdat', };
    if (req.query.query) {
      queryOptions.query[ '$or' ] = [{
        model_name: new RegExp(req.query.query, 'gi'),
      }, {
        name: new RegExp(req.query.query, 'gi'),
      }, ];
    }
    let result = await MLSimulation.query(queryOptions);
    let simulations = (result && result[ '0' ] && result[ '0' ].documents) ? result[ '0' ].documents : [];
    simulations = simulations.map(simulation => {
      simulation = simulation.toJSON ? simulation.toJSON() : simulation;
      let formattedCreatedAt = (simulation.createdat) ? `${transformhelpers.formatDate(simulation.createdat, user.time_zone)}` : '';
      let progress = Math.round(simulation.progress);
      let progressBar = {
        progress: progress,
        state: (simulation.status === 'Error' || simulation.status === 'failed')
          ? 'error'
          : (simulation.status === 'complete' || simulation.status === 'Complete' || simulation.progress === 100)
            ? 'success'
            : null,
      };
      return {
        _id: simulation._id,
        name: simulation.name,
        model_name: simulation.model_name,
        progress: progress,
        formattedCreatedAt,
        organization,
        progressBar,
      };
    });

    if (req.query.pagination === 'mlbatches') {
      req.controllerData = Object.assign({}, req.controllerData, {
        rows: simulations,
        numItems: result.collection_count,
        numPages: result.collection_pages,
      });
    }

    return next();
  } catch (e) {
    logger.warn('Error finding ML Cases.');
  }
}

async function getMLCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const MLCase = periodic.datas.get('standard_mlcase');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let query = (organization === 'organization') ? { _id: req.params.id, } : { _id: req.params.id, organization, };
    let mlcase = await MLCase.load({ query, });
    req.controllerData.mlcase = (mlcase.toJSON) ? mlcase.toJSON() : mlcase;
    next();
  } catch (e) {
    logger.warn('Error finding ML Case.');
  }
}

async function getUploadedMLData(req, res, next) {
  try {
    if (!/multipart\/form-data/.test(req.headers[ 'content-type' ])) {
      res.status(500).send({ message: 'Please upload a file', });
    } else if (req.headers[ 'content-length' ] > MAX_BATCH_PROCESS_FILESIZE) {
      res.status(404).send({
        message: `Batch Processing is limited to ${MAX_BATCH_PROCESS_FILESIZE / 1048576}MB. Please delete machine learning cases from file before upload.`,
      });
    } else {
      let hasError = false;
      req.controllerData = req.controllerData || {};
      var busboy = new Busboy({ headers: req.headers, });
      busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
        if (fieldname === 'selected_model') req.params.id = val;
        if (fieldname === 'batch_name' && val !== 'undefined') req.controllerData.batch_name = val;
      });
      busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        let file_data = [];
        let fileTypeArr = filename.trim().split('.');
        let fileType = fileTypeArr[ fileTypeArr.length - 1 ];
        if ([ 'csv', 'xls', 'xlsx', ].indexOf(fileType) === -1) {
          hasError = true;
          req.unpipe(busboy);
          res.set('Connection', 'close');
          res.status(500).send({ message: 'File type must be in .csv, .xls or .xlsx format' });
        } else {
          if (fileType === 'xls' || fileType === 'xlsx') {
            file.on('data', function (chunk) {
              file_data.push(chunk);
            })
              .on('error', function (e) {
                hasError = true;
                req.unpipe(busboy);
                res.set('Connection', 'close');
                res.status(500).send({ message: `Invalid upload file format.` });
              })
              .on('end', function () {
                var file_buffer = Buffer.concat(file_data);
                var workbook = XLSX.read(file_buffer, { type: 'buffer', });
                let sheet_name = workbook.SheetNames[ 0 ];
                let convertedCSVData = XLSX.utils.sheet_to_csv(workbook.Sheets[ sheet_name ]);
                let converted_csv_rows = [];
                csv.fromString(convertedCSVData)
                  .on('data', function (chunk) {
                    if (!transformhelpers.objectOrArrayPropertiesAreEmpty(chunk)) {
                      converted_csv_rows.push(chunk);
                    }
                  })
                  .on('end', function () {
                    let csv_headers = converted_csv_rows.shift();
                    let formatted_ml_case;
                    let formatted_ml_cases = converted_csv_rows.reduce((aggregate, dataRow) => {
                      formatted_ml_case = csv_headers.reduce((caseObj, header, j) => {
                        caseObj[ header ] = dataRow[ j ];
                        return caseObj;
                      }, {});

                      aggregate.push(formatted_ml_case);
                      return aggregate;
                    }, []);

                    req.controllerData.formatted_ml_cases = formatted_ml_cases;
                    if (!hasError) return next();
                  });
              })
          } else {
            file.pipe(csv())
              .on('data', function (chunk) {
                if (!transformhelpers.objectOrArrayPropertiesAreEmpty(chunk)) {
                  file_data.push(chunk);
                }
              })
              .on('error', function (e) {
                req.error = `Invalid upload file format.`;
                return req;
              })
              .on('end', function () {
                let csv_headers = file_data.shift();
                let formatted_ml_case;
                let formatted_ml_cases = file_data.reduce((aggregate, dataRow) => {
                  formatted_ml_case = csv_headers.reduce((caseObj, header, j) => {
                    caseObj[ header ] = dataRow[ j ];
                    return caseObj;
                  }, {});

                  aggregate.push(formatted_ml_case);
                  return aggregate;
                }, []);
                req.controllerData.formatted_ml_cases = formatted_ml_cases;
                return next();
              });
          }
        }
      });
      busboy.on('finish', function () {
      });
      req.pipe(busboy);
    }
  } catch (e) {
    res.status(500).send({ message: 'Error uploading OCR documents', });
  }
}

async function predictMLCase({ req, model_data, count, case_data, user, organization, machinelearning, }) {
  // const Mlcase = periodic.datas.get('standard_mlcase');
  // let nextCountAsync = Promisie.promisify(Mlcase.model.schema.methods.nextCount, Mlcase.model);
  // let count = await nextCountAsync();
  try {
    let base_variables = Object.keys(model_data.variables).reduce((aggregate, variable) => {
      if (case_data[ variable ] !== undefined) {
        aggregate[ variable ] = case_data[ variable ];
      } else {
        aggregate[ variable ] = null;
      }
      return aggregate;
    }, {});
    // let ml_variables = Object.assign({}, base_variables, case_data);
    let params = {
      MLModelId: model_data.real_time_prediction_id,
      PredictEndpoint: model_data.real_time_endpoint,
      Record: base_variables,
    };
    let result = await machinelearning.predict(params).promise();
    return {
      inputs: base_variables,
      prediction: result,
      decision_name: req.controllerData.decision_name || `Case ${count}`,
      model_name: model_data.display_name,
      processing_type: 'batch',
      model_type: model_data.type,
      user: user._id.toString(),
      organization,
      case_number: '',
    };
  } catch (e) {
    logger.warn('Error predicting ml case');
    return {
      inputs: [],
      prediction: {},
      decision_name: req.controllerData.decision_name || `Case ${count}`,
      model_name: model_data.display_name,
      processing_type: 'batch',
      model_type: model_data.type,
      user: user._id.toString(),
      organization,
      error: [e.message, ],
      case_number: '',
    };
  }
}

async function runBatchMLProcess(req, res, next) {
  const Mlcase = periodic.datas.get('standard_mlcase');
  const Mlbatch = periodic.datas.get('standard_mlbatch');
  const Mlsimulation = periodic.datas.get('standard_mlsimulation');
  const io = periodic.servers.get('socket.io').server;
  req.controllerData = req.controllerData || {};
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  try {
    let aws_configs = THEMESETTINGS.machinelearning;
    AWS.config.update({ region: aws_configs.region, });
    AWS.config.credentials = new AWS.Credentials(aws_configs.key, aws_configs.secret, null);
    AWS.config.setPromisesDependency(require('promisie'));
    let machinelearning = new AWS.MachineLearning();
    let offset = 0;
    let limit = 500;
    let ml_case_length;
    res.status(200).send({
      status: 200,
      timeout: 10000,
      type: 'success',
    });
    ml_case_length = req.controllerData.formatted_ml_cases.length;
    let mlcases = req.controllerData.formatted_ml_cases;
    let currentBatchCases;
    let currentBatchCaseLength;
    let progress = req.controllerData.mlsimulation.progress;
    const Mlcase = periodic.datas.get('standard_mlcase');
    await Promisie.doWhilst(async () => {
      let count = await getCollectionCounter('standard_mlcase');
      currentBatchCases = mlcases.slice(offset, offset + limit);
      currentBatchCaseLength = currentBatchCases.length;
      let batch_results = await Promise.all(currentBatchCases.map(async (mlcase, i) => {
        let ml_case_result = await predictMLCase({ req, model_data: req.controllerData.data, count: count + i, case_data: mlcase, user, organization, machinelearning, });
        let created_case = await Mlcase.create(ml_case_result);
        created_case = (created_case.toJSON) ? created_case.toJSON() : created_case;
        return {
          mlcase: created_case._id.toString(),
          model_type: req.controllerData.data.type,
          prediction: created_case.prediction,
          decision_name: created_case.decision_name,
        };
      }));
      count += currentBatchCaseLength;

      let batch_create_options = {
        model_name: req.controllerData.data.display_name,
        results: batch_results,
        mlsimulation: req.controllerData.mlsimulation._id.toString(),
        user: user._id.toString(),
        organization,
      };
      await updateCollectionCounter('standard_mlcase', currentBatchCaseLength - 1);
      let new_batch = await Mlbatch.create(batch_create_options);
      new_batch = (new_batch.toJSON) ? new_batch.toJSON() : new_batch;
      progress = Math.round(((progress / 100) * ml_case_length + currentBatchCaseLength) / ml_case_length * 100);
      let status = progress < 100 ? 'In Progress' : 'Complete';
      io.sockets.emit('decisionProcessing', { progress, _id: req.controllerData.mlsimulation._id.toString(), status, organization, });
      await Mlsimulation.update({
        id: req.controllerData.mlsimulation._id.toString(),
        isPatch: true,
        updatedoc: { status, progress, results: [new_batch._id.toString(), ], },
      });
      offset += limit;
      return offset;
    }, () => offset < ml_case_length);
    return next();
  } catch (e) {
    io.sockets.emit('decisionProcessing', { _id: req.controllerData.mlsimulation._id.toString(), status: 'Error', organization, });
    await Mlsimulation.update({
      id: req.controllerData.mlsimulation._id.toString(),
      updatedoc: { 'status': 'Error', updatedat: new Date(), },
      isPatch: true,
    });
    logger.error('runBatchMLProcess error', e);
    return next(e);
  }
}

async function registerMLSimulation(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Mlsimulation = periodic.datas.get('standard_mlsimulation');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let count = await getCollectionCounter('standard_mlsimulation');
    let createOptions = {
      progress: 0,
      user: user._id.toString(),
      organization,
      status: 'In Progress',
      name: req.controllerData.batch_name || `ML Batch ${count}`,
      model_name: req.controllerData.data.display_name,
    };

    let mlsimulation = await Mlsimulation.create(createOptions);
    req.controllerData.mlsimulation = (mlsimulation.toJSON) ? mlsimulation.toJSON() : mlsimulation;
    next();
  } catch (e) {
    res.status(500).send({ message: 'Error registering ML Simulation', });
  }
}

async function getMLBatchSimulation(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Mlsimulation = periodic.datas.get('standard_mlsimulation');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let mlsimulation = await Mlsimulation.load({ query: { _id: req.params.id, organization, }, });
    req.controllerData.mlsimulation = (mlsimulation.toJSON) ? mlsimulation.toJSON() : mlsimulation;
    next();
  } catch (e) {
    logger.warn('Error finding ML Batch.');
  }
}

async function downloadMLCSV(req, res) {
  try {
    if (req.controllerData && req.controllerData.download_content) {
      let filename = (req.controllerData.mlcase) ? req.controllerData.mlcase.decision_name : req.controllerData.mlsimulation.name;
      res.set('Content-Type', 'text/csv');
      res.attachment(`${filename}_${new Date()}.csv`);
      res.status(200).send(req.controllerData.download_content).end();
    } else {
      res.status(500).send({ message: 'Could not download case results.', });
    }
  } catch (e) {
    res.status(500).send({ message: 'Could not download case results.', });
  }
}

async function getMLSimulation(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Mlsimulation = periodic.datas.get('standard_mlsimulation');
    let mlsimulation = await Mlsimulation.load({ query: { _id: req.params.id, }, });
    mlsimulation = (mlsimulation.toJSON) ? mlsimulation.toJSON() : mlsimulation;
    req.controllerData.mlsimulation = mlsimulation;
    next();
  } catch (e) {
    res.status(500).send({ message: 'Could not retrieve batch ML simulation results.', });
  }
}

async function getMLSimulationCases(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.mlsimulation) {
      const Mlcase = periodic.datas.get('standard_mlcase');
      let batches = req.controllerData.mlsimulation.results;
      let allBatchCaseIds = batches.reduce((aggregate, batch) => aggregate.concat(batch.results.map(result => result.mlcase)), []);
      let batchcases = await Mlcase.query({ query: { _id: { $in: allBatchCaseIds, }, }, limit: 1000000, });
      let input_keys = Object.keys(batchcases[ 0 ].inputs);
      let inputs = {};
      input_keys.forEach(key => inputs[ key ] = null);
      let JSON_batchcases = batchcases.map(batch_case => batch_case.toJSON ? batch_case.toJSON() : batch_case);
      JSON_batchcases = utilities.helpers.mergeSort(JSON_batchcases, 'decision_name').reverse();
      req.controllerData.batchcases = JSON_batchcases;
      req.controllerData.inputs = inputs;
      next();
    } else {
      res.status(500).send({ message: 'Could not retrieve batch ML simulation results.', });
    }
  } catch (e) {
    res.status(500).send({ message: 'Could not retrieve batch ML simulation results.', });
  }
}

async function downloadTutorialData(req, res) {
  let filepath = path.join(process.cwd(), `content/files/tutorial/${req.query.type}.${req.query.export_format || 'csv'}`);
  let file = await fs.readFile(filepath);
  let filename = (req.query.type === 'sample_data') ? 'Sample Data - DigiFi Machine Learning.csv' : 'Instructions - DigiFi Machine Learning.rtf';
  let contenttype = (req.query.type === 'sample_data') ? 'text/csv' : 'application/octet-stream';
  res.set('Content-Type', contenttype);
  res.attachment(filename);
  res.status(200).send(file).end();
}

async function checkPendingMlTraining(req, res, next) {
  try {
    const MLModel = periodic.datas.get('standard_modelgroup');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let pending_ml_training = await Promisie.promisify(MLModel.model.countDocuments, MLModel.model)({ organization, status: { $nin: ['complete', 'failed', ], }, });
    if (pending_ml_training === 0) return next();
    else {
      return res.status(500).send({ message: 'Only one model may be trained at a time, please wait for the current training process to finish.', });
    }
  } catch (e) {
    return res.status(500).send({ message: 'Only one model may be trained at a time, please wait for the current training process to finish.', });
  }
}

module.exports = {
  downloadMLCSV,
  downloadTutorialData,
  getPageData,
  getModel,
  getModelByName,
  getInputVariables,
  createAWSDataSource,
  createProviderDataSources,
  // uploadOCRTemplateToAWS,
  createMongoDataSource,
  deleteDataSource,
  getDataSourceForDownload,
  getModelEvaluationDropdown,
  createMongoMLModelandBatches,
  createMongoModelGroup,
  checkPendingMlTraining,
  // getOCRTemplateFromAWS,
  formatModelCreate,
  flipDocumentStatus,
  // getDocuments,
  getDocument,
  getDataSource,
  getBatchData,
  getMlModelsIndex,
  getBatchAnalysisData,
  getDataSources,
  getMLModels,
  getModels,
  getProcessingModels,
  getDataSourceTemplate,
  downloadBatchData,
  downloadDataSourceData,
  transformDataSource,
  handleControllerDataResponse,
  updateModel,
  updateDataSource,
  updateDocument,
  updateOCRDocumentVariables,
  deleteMLModel,
  predictSingleMLCase,
  createIndividualMLCase,
  runBatchMLProcess,
  getIndividualMLCases,
  getMLCase,
  getMLBatchSimulation,
  getMLBatchSimulations,
  getUploadedMLData,
  registerMLSimulation,
  getMLSimulation,
  getMLSimulationCases,
};

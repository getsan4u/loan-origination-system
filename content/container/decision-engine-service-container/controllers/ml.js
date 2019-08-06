'use strict';

const periodic = require('periodicjs');
const logger = periodic.logger;
const Busboy = require('busboy');
const moment = require('moment');
const XLSX = require('xlsx');
const numeral = require('numeral');
const csv = require('fast-csv');
const Papa = require('papaparse');
const capitalize = require('capitalize');
const utilities = require('../utilities');
const Promisie = require('promisie');
const helpers = utilities.helpers;
const getCollectionCounter = helpers.getCollectionCounter;
const updateCollectionCounter = helpers.updateCollectionCounter;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const api_utilities = utilities.controllers.api;
const transformhelpers = utilities.transformhelpers;
const mlresource = utilities.mlresource;
const MLCONSTANTS = utilities.constants.ML;
const MLClass = mlresource.mlclass;
const SINGLE_ML_FUNCTIONS = mlresource.processing.individual;
const BATCH_ML_FUNCTIONS = mlresource.processing.batch;
const MAX_DATA_SOURCE_FILESIZE = THEMESETTINGS.optimization.data_source_upload_filesize_limit;
const MIN_DATA_SOURCE_FILESIZE = THEMESETTINGS.optimization.data_source_upload_min_filesize;
const MAX_BATCH_PROCESS_FILESIZE = THEMESETTINGS.optimization.batch_process_upload_filesize_limit || 2097152;
const MAX_BATCH_CASE_COUNT = THEMESETTINGS.optimization.max_batch_case_count || 100;
const path = require('path');
const fs = Promisie.promisifyAll(require('fs-extra'));
const FETCH_PROVIDER_BATCH_DATA = mlresource.fetchProviderBatchData;
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectID;
const { openDownloadStreamAsync, mapPredictionToDigiFiScore } = mlresource.resourcehelpers;
const { handleScoreAnalysis, handleInputVariableInputAnalysis, handleSummaryInputAnalysis } = utilities.controllers.ml;
/**
 * Formats the uploaded csv into an array of data rows
 * @param {Object} req Express request object
 */
function readCSVDataSource(req, res, next) {
  try {
    let hasError = false;
    let errorMessage = '';
    req.controllerData = req.controllerData || {};
    const isPremium = THEMESETTINGS.premium_machinelearning || false;
    let fileType;
    if (req.query.bulk || req.query.upload) {
      if (!/multipart\/form-data/.test(req.headers[ 'content-type' ])) {
        hasError = true;
        req.unpipe(busboy);
        res.status(500).send({ message: 'Please upload historial data.', });
      }
      if (req.headers[ 'content-length' ] > MAX_DATA_SOURCE_FILESIZE) {
        hasError = true;
        req.unpipe(busboy);
        let error_message;
        if (isPremium) error_message = `Data sources are limited to ${MAX_DATA_SOURCE_FILESIZE / 1048576}MB. Please delete data source rows from file before upload.`;
        else error_message = `The maximum file size is ${MAX_DATA_SOURCE_FILESIZE / 1048576}MB. Larger models can be trained if you have a Corporate or Enterprise account. Please contact DigiFi at support@digifi.io for more information.`;
        res.status(500).send({ message: error_message, });
      } else if (req.headers[ 'content-length' ] < (MIN_DATA_SOURCE_FILESIZE || 10240)) {
        hasError = true;
        req.unpipe(busboy);
        res.status(500).send({ message: `Data sources must be at least ${(MIN_DATA_SOURCE_FILESIZE || 10240) / 1024}KB in size. Please provide a larger data set.`, });
      } else {
        let data_source_name, model_type, MLDatasource;
        var busboy = new Busboy({ headers: req.headers, });
        busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
          if (fieldname === 'model_type') model_type = val;
        });
        busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
          let file_data = [];
          let fileTypeArr = filename.trim().split('.');
          fileType = fileTypeArr[ fileTypeArr.length - 1 ];
          if ([ 'csv', 'xls', 'xlsx', ].indexOf(fileType) === -1) {
            hasError = true;
            req.unpipe(busboy);
            res.status(500).send({ message: 'File type must be in .csv, .xls or .xlsx format', });
          } else {
            MLDatasource = new MLClass.Datasource();
            MLDatasource.model_type = req.controllerData.mlmodel.type;
            MLDatasource.filename = filename;
            const mlmodel = req.controllerData.mlmodel || {};
            MLDatasource.industry = mlmodel.industry || null;
            let industryHeaders = [];
            let inputAnalysisHeaderIndex = {};
            let inputAnalysisOnly = {
              loan_issue_date: 2,
              loan_amount: 3,
              total_received_principal: 4,
              total_received_interest: 5,
              interest_rate: 6,
              charge_off_date: 7,
              charge_off_amount: 8,
              weighted_life_of_principal_years: 9,
              charge_off_month: 10,
              comparison_score: 11,
            };
            let rowCount = 0;
            if (fileType === 'xls' || fileType === 'xlsx') {
              file.on('data', function (chunk) {
                file_data.push(chunk);
              })
                .on('error', function (e) {
                  hasError = true;
                  req.unpipe(busboy);
                  res.set('Connection', 'close');
                  res.status(500).send({ message: 'Invalid upload file format.', });
                })
                .on('end', function () {
                  var buffer = Buffer.concat(file_data);
                  var workbook = XLSX.read(buffer, { type: 'buffer', });
                  let sheet_name = workbook.SheetNames[ 0 ];
                  let convertedCSVData = XLSX.utils.sheet_to_csv(workbook.Sheets[ sheet_name ]);
                  csv.fromString(convertedCSVData)
                    .on('data', function (row) {
                      if (hasError) return;
                      rowCount++;
                      if (rowCount === 1) {
                        let duplicates = row.filter((v, i, a) => a.indexOf(v) !== i);
                        let hasDuplicates = duplicates.length > 0;
                        let exceedsMaxLength = row.some(header => header.length > 60);
                        if (hasDuplicates) {
                          req.unpipe(busboy);
                          hasError = true;
                          return res.status(500).send({ message: 'Please ensure that the first row of your file contains column names. Each column name must be unique.', });
                        } else if (exceedsMaxLength) {
                          req.unpipe(busboy);
                          hasError = true;
                          return res.status(500).send({ message: 'Please ensure that all column names are less than 60 characters.', });
                        } else {
                          if (mlmodel.industry) {
                            row.forEach((header, i) => {
                              if (inputAnalysisOnly[ header ]) {
                                inputAnalysisHeaderIndex[ i ] = true;
                                industryHeaders.push(header);
                              }
                            });
                            if (industryHeaders.length !== Object.keys(inputAnalysisOnly).length) {
                              hasError = true;
                              errorMessage = `The following column headers are required: ${Object.keys(inputAnalysisOnly).join(', ')}`;
                              return false;
                            }
                            MLDatasource.setIndustryHeaders(industryHeaders);
                            row = row.filter(header => !inputAnalysisOnly[ header ]);
                          }
                          MLDatasource.setHeaders(row);
                          if (MLDatasource.historical_result_idx < 0) {
                            hasError = true;
                            errorMessage = 'The following column header: historical_result is required. Please ensure that historical_result is provided in the uploaded csv.';
                            return false;
                          }
                        }
                      } else if (!transformhelpers.objectOrArrayPropertiesAreEmpty(row)) {
                        let inputAnalysisRow = [];
                        let datasourceRow = [];
                        if (mlmodel.industry) {
                          row.forEach((col, colIdx) => {
                            if (inputAnalysisHeaderIndex[ colIdx ]) inputAnalysisRow.push(col);
                            else datasourceRow.push(col);
                          });
                          let insertedInputRow = MLDatasource.insertInputAnalysisRow(inputAnalysisRow, row[ MLDatasource.historical_result_idx ]); // modelRow
                          if (!errorMessage && insertedInputRow instanceof Error) {
                            hasError = true;
                            errorMessage = insertedInputRow.message;
                            return false;
                          }
                        } else {
                          datasourceRow = row;
                        }
                        let inserted = MLDatasource.insertRow(datasourceRow); // modelRow
                        if (inserted instanceof Error) {
                          hasError = true;
                          errorMessage = inserted.message;
                          return false;
                        }
                      }
                    })
                    .on('end', function () {
                      if (hasError || !MLDatasource) {
                        req.unpipe(busboy);
                        res.writeHead(500, { 'Connection': 'close', 'Content-Type': 'application/json', });
                        return res.end(JSON.stringify({ message: errorMessage || 'Error in uploading datasource file.', }));
                      } else {
                        MLDatasource.getDatasourceSchema();
                        req.controllerData.MLDatasource = MLDatasource;
                        return next();
                      }
                    });
                });
            } else {
              let rowCount = 0;
              Papa.parse(file, {
                step: function (row, parser) {
                  rowCount++;
                  row = row.data[ 0 ];
                  if (rowCount === 1) {
                    let lower_case_headers = row.map(elmt => elmt.toLowerCase().trim());
                    let duplicates = lower_case_headers.filter((v, i, a) => a.indexOf(v) !== i);
                    let exceedsMaxLength = row.some(header => header.length > 60);
                    let hasDuplicates = duplicates.length > 0;
                    if (hasDuplicates) {
                      hasError = true;
                      errorMessage = 'Please ensure that the first row of your file contains column names. Each column name must be unique.';
                      parser.abort();
                      return false;
                    } else if (exceedsMaxLength) {
                      hasError = true;
                      errorMessage = 'Please ensure that all column names are less than 60 characters.';
                      parser.abort();
                      return false;
                    } else {
                      if (mlmodel.industry) {
                        row.forEach((header, i) => {
                          if (inputAnalysisOnly[ header ]) {
                            inputAnalysisHeaderIndex[ i ] = true;
                            industryHeaders.push(header);
                          }
                        });
                        if (industryHeaders.length !== Object.keys(inputAnalysisOnly).length) {
                          hasError = true;
                          errorMessage = `The following column headers are required: ${Object.keys(inputAnalysisOnly).join(', ')}`;
                          parser.abort();
                          return false;
                        }
                        MLDatasource.setIndustryHeaders(industryHeaders);
                        row = row.filter(header => !inputAnalysisOnly[ header ]);
                      }
                      MLDatasource.setHeaders(row);
                      if (MLDatasource.historical_result_idx < 0) {
                        hasError = true;
                        errorMessage = 'The following column header: historical_result is required. Please ensure that historical_result is provided in the uploaded csv.';
                        parser.abort();
                        return false;
                      }
                    }
                  } else if (!transformhelpers.objectOrArrayPropertiesAreEmpty(row)) {
                    let inputAnalysisRow = [];
                    let datasourceRow = [];
                    if (mlmodel.industry) {
                      row.forEach((col, colIdx) => {
                        if (inputAnalysisHeaderIndex[ colIdx ]) inputAnalysisRow.push(col);
                        else datasourceRow.push(col);
                      });
                      let insertedInputRow = MLDatasource.insertInputAnalysisRow(inputAnalysisRow, row[ MLDatasource.historical_result_idx ]); // modelRow
                      if (!errorMessage && insertedInputRow instanceof Error) {
                        hasError = true;
                        errorMessage = insertedInputRow.message;
                        parser.abort();
                        return false;
                      }
                    } else {
                      datasourceRow = row;
                    }
                    let inserted = MLDatasource.insertRow(datasourceRow); // modelRow
                    if (!errorMessage && inserted instanceof Error) {
                      hasError = true;
                      errorMessage = inserted.message;
                      parser.abort();
                      return false;
                    }
                  }
                },
                error: function (err) {
                  if (!hasError) {
                    hasError = true;
                    errorMessage = err.message;
                  }
                },
                complete: function () { }
              });
            }
          }
        });
        busboy.on('finish', function () {
          if (!fileType || fileType !== 'xls' || fileType !== 'xlsx') {
            if (hasError || !MLDatasource) {
              req.unpipe(busboy);
              res.writeHead(500, { 'Connection': 'close', 'Content-Type': 'application/json', });
              return res.end(JSON.stringify({ message: errorMessage || 'Error in uploading datasource file.', }));
            } else {
              MLDatasource.getDatasourceSchema();
              req.controllerData.MLDatasource = MLDatasource;
              return next();
            }
          }
        });
        req.pipe(busboy);
      }
    } else {
      return next();
    }
  } catch (e) {
    periodic.logger.warn(e.message);
    req.unpipe(busboy);
    res.status(500).send({ message: e.message, });
  }
}

async function createInitialMongoModel(req, res) {
  try {
    const MLModel = periodic.datas.get('standard_mlmodel');
    req.user = (req.user && req.user.toJSON) ? req.user.toJSON() : req.user;
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : (user && user.association && user.association.organization) ? user.association.organization.toString() : 'organization';
    let newdoc = Object.assign({}, {
      user: { creator: `${user.first_name} ${user.last_name}`, updater: `${user.first_name} ${user.last_name}`, },
      organization,
      status: 'select_type',
      display_name: req.body.name,
      selected_provider: 'neural_network',
      name: req.body.name.toLowerCase().replace(/\s+/g, '_'),
    });
    let createdModel = await MLModel.create(newdoc);
    let model_id = createdModel.toJSON ? createdModel.toJSON()._id.toString() : createdModel._id.toString();
    res.status(200).send({
      status: 200,
      timeout: 10000,
      type: 'success',
      text: 'Changes saved successfully!',
      successProps: {
        successCallback: 'func:window.createNotification',
      },
      responseCallback: 'func:this.props.reduxRouter.push',
      pathname: `/ml/models/${model_id}/training/select_type`,
    });
  } catch (e) {
    periodic.logger.warn(e.message);
    res.status(500).send({ message: 'Error creating initial mongo model.', });
  }
}

async function selectModelType(req, res) {
  try {
    const MLModel = periodic.datas.get('standard_mlmodel');
    let user = req.user || {};
    let typesMap = {
      'binary': {
        type: req.body.type,
        industry: null,
      },
      'categorical': {
        type: req.body.type,
        industry: null,
      },
      'regression': {
        type: req.body.type,
        industry: null,
      },
      'loan_default_risk': {
        type: 'binary',
        industry: 'lending',
      },
    };
    let type = req.body.type;

    await MLModel.update({
      id: req.params.id,
      isPatch: true,
      updatedoc: Object.assign({}, { 'user.updater': `${user.first_name} ${user.last_name}`, status: 'provide_historical_data', updatedat: new Date(), datasource: null, }, typesMap[ req.body.type ]),
    });
    res.status(200).send({
      status: 200,
      timeout: 10000,
      type: 'success',
      text: 'Changes saved successfully!',
      successProps: {
        successCallback: 'func:window.createNotification',
      },
      responseCallback: 'func:this.props.reduxRouter.push',
      pathname: `/ml/models/${req.params.id}/training/historical_data_${typesMap[ req.body.type ].type}`,
    });
  } catch (e) {
    periodic.logger.warn(e.message);
    res.status(500).send({ message: 'Error updating model type.', });
  }
}

async function deleteDataSourceIfExists(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.mlmodel && req.controllerData.mlmodel.datasource) {
      const Datasource = periodic.datas.get('standard_datasource');
      let mlmodel = req.controllerData.mlmodel;
      const default_sagemaker_bucket = periodic.aws.sagemaker_bucket;
      let s3 = periodic.aws.s3;
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';

      if (mlmodel.datasource && mlmodel.datasource.providers && mlmodel.datasource.providers.sagemaker_ll) {
        let sagemaker_ll = mlmodel.datasource.providers.sagemaker_ll;
        // delete sagemaker_ll s3 training
        await s3.deleteObject({
          Bucket: sagemaker_ll.training.Bucket || default_sagemaker_bucket,
          Key: sagemaker_ll.training.Key,
        }).promise();
        // delete sagemaker_ll s3 testing
        await s3.deleteObject({
          Bucket: sagemaker_ll.testing.Bucket || default_sagemaker_bucket,
          Key: sagemaker_ll.testing.Key,
        }).promise();
        // delete sagemaker_ll s3 training batch
        if (sagemaker_ll.trainingbatch) {
          await s3.deleteObject({
            Bucket: sagemaker_ll.trainingbatch.Bucket || default_sagemaker_bucket,
            Key: sagemaker_ll.trainingbatch.Key,
          }).promise();
        }
      }

      if (mlmodel.datasource && mlmodel.datasource.providers && mlmodel.datasource.providers.sagemaker_xgb) {
        // delete sagemaker_xgb s3 training
        let sagemaker_xgb = mlmodel.datasource.providers.sagemaker_xgb;
        await s3.deleteObject({
          Bucket: sagemaker_xgb.training.Bucket || default_sagemaker_bucket,
          Key: sagemaker_xgb.training.Key,
        }).promise();
        // delete sagemaker_xgb s3 testing
        await s3.deleteObject({
          Bucket: sagemaker_xgb.testing.Bucket || default_sagemaker_bucket,
          Key: sagemaker_xgb.testing.Key,
        }).promise();
        // delete sagemaker_xgb s3 training batch
        if (sagemaker_xgb.trainingbatch) {
          await s3.deleteObject({
            Bucket: sagemaker_xgb.trainingbatch.Bucket || default_sagemaker_bucket,
            Key: sagemaker_xgb.trainingbatch.Key,
          }).promise();
        }
      }

      if (mlmodel.datasource) {
        if (mlmodel.datasource.original_file) {
          let original_file = mlmodel.datasource.original_file;
          await s3.deleteObject({
            Bucket: original_file.training.Bucket,
            Key: original_file.training.Key,
          }).promise();
          await s3.deleteObject({
            Bucket: original_file.testing.Bucket,
            Key: original_file.testing.Key,
          }).promise();
        }

        // delete mongo datasource
        await Datasource.delete({ deleteid: mlmodel.datasource._id.toString(), organization, });
      }

      return next();
    } else {
      return next();
    }
  } catch (e) {
    periodic.logger.warn(e.message);
    res.status(500).send({ message: 'Error removing old datasource.', });
  }
}

async function getModel(req, res, next) {
  try {
    const MLModel = periodic.datas.get('standard_mlmodel');
    let modelId = (req.params.id)
      ? req.params.id
      : (req.body.selected_model)
        ? req.body.selected_model
        : '';
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let query = (organization !== 'organization') ? { _id: modelId, organization, } : { _id: modelId, };
    let mlmodel = await MLModel.load({ query, });
    mlmodel = mlmodel.toJSON ? mlmodel.toJSON() : mlmodel;
    req.controllerData = Object.assign({}, req.controllerData, {
      mlmodel,
    });
    next();
  } catch (e) {
    periodic.logger.warn(e.message);
    res.status(500).send({ message: 'Error retrieving model.', });
  }
}

async function getScoreAnalysisDocument(req, res, next) {
  try {
    const MLModel = periodic.datas.get('standard_mlmodel');
    const mlmodel = req.controllerData.mlmodel;
    if (mlmodel && mlmodel.industry) {
      const ScoreAnalysis = periodic.datas.get('standard_scoreanalysis');
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      let query = (organization !== 'organization') ? { mlmodel: mlmodel._id.toString(), organization, type: 'training', provider: mlmodel.selected_provider } : { mlmodel: mlmodel._id.toString(), type: 'training', provider: mlmodel.selected_provider };
      let scoreanalysis = await ScoreAnalysis.model.findOne(query).lean();
      req.controllerData = Object.assign({}, req.controllerData, {
        scoreanalysis,
      });
    }
    next();
  } catch (e) {
    periodic.logger.warn(e.message);
    res.status(500).send({ message: 'Error retrieving model.', });
  }
}


async function getInputAnalysis(req, res, next) {
  try {
    const InputAnalysis = periodic.datas.get('standard_inputanalysis');
    req.controllerData = req.controllerData || {};
    if (req.query && req.query.page === 'input_analysis' && req.controllerData.mlmodel && req.controllerData.mlmodel.industry) {
      const input_analysis = await InputAnalysis.model.findOne({ mlmodel: req.controllerData.mlmodel._id.toString() }).lean();
      req.controllerData.input_analysis = input_analysis;
    }
    next();
  } catch (e) {
    res.status(500).send({ message: 'Error retrieving Input Analysis.', });
  }
}

async function getScoreAnalysis(req, res, next) {
  try {
    if (req.query && req.query.page === 'score_analysis' && req.controllerData.mlmodel && req.controllerData.mlmodel.industry) {
      const ScoreAnalysis = periodic.datas.get('standard_scoreanalysis');
      const type = req.query.batch_type ? req.query.batch_type : 'testing';
      const provider = req.query.provider ? req.query.provider : req.controllerData.mlmodel.selected_provider;
      const scoreAnalysisData = await ScoreAnalysis.model.findOne({ mlmodel: req.controllerData.mlmodel._id.toString(), provider, type }).lean();
      req.controllerData.score_analysis_data = scoreAnalysisData;
    }
    next();
  } catch (e) {
    periodic.logger.warn(e.message);
    res.status(500).send({ message: 'Error retrieving DigiFi score analysis data.', });
  }
}

async function checkIfModelExists(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.mlcase && req.controllerData.mlcase.mlmodel) {
      const MLModel = periodic.datas.get('standard_mlmodel');
      let modelId = req.controllerData.mlcase.mlmodel;
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      let query = (organization !== 'organization') ? { _id: modelId, organization, } : { _id: modelId, };
      let mlmodel = await MLModel.model.findOne(query).lean();
      req.controllerData.mlmodel_exists = (mlmodel) ? true : false;
    } else {
      req.controllerData.mlmodel_exists = false;
    }
    next();
  } catch (e) {
    periodic.logger.warn(e.message);
    req.controllerData.mlmodel_exists = false;
    next();
  }
}

async function checkIfLinearModelAndCategoricalAWS(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.body = req.body || {};
    if (req.controllerData.mlmodel && req.controllerData.mlmodel.type === 'regression' && req.body.data_source_variables) {
      let data_source_variables = req.body.data_source_variables;
      let historical_result_row = data_source_variables.filter(variable => variable.uploaded_variable_name === 'historical_result')[ 0 ];
      if (historical_result_row.distinct_category) return res.status(500).send({ message: 'You are training a Linear Model. Please ensure that the historical_result field is not set as Categorical (if it is checked, please uncheck it before continuing).', });
      else {
        next();
      }
    } else {
      return next();
    }
  } catch (e) {
    periodic.logger.warn(e.message);
    res.status(500).send({ message: 'Error while checking model validity', });
  }
}

async function checkModelStatusForDelete(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let model_status = req.controllerData.mlmodel.status;
    if (req.controllerData.mlmodel && (model_status === 'complete' || model_status === 'failed')) {
      return next();
    } else if (req.controllerData.mlmodel && model_status === 'training') {
      res.status(500).send({ message: 'Model training must finish before deleting', });
    } else {
      res.status(500).send({ message: 'Error retrieving model', });
    }
  } catch (e) {
    periodic.logger.warn(e.message);
    res.status(500).send({ message: 'Error retrieving model.', });
  }
}

async function checkModelStatusForDetailPage(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let model_status = req.controllerData.mlmodel.status;
    if (req.controllerData.mlmodel && (model_status === 'complete')) {
      return next();
    } else if (req.controllerData.mlmodel && model_status === 'training') {
      res.status(500).send({ message: 'Please wait for the model training to finish', });
    } else {
      res.status(500).send({ message: 'Error retrieving model', });
    }
  } catch (e) {
    periodic.logger.warn(e.message);
    res.status(500).send({ message: 'Error retrieving model.', });
  }
}

async function getModels(req, res, next) {
  try {
    const MLModel = periodic.datas.get('standard_mlmodel');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let pagenum = 1;
    if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
    let skip = 10 * (pagenum - 1);
    let queryOptions = { query: { organization, status: { $in: [ 'complete', 'training', 'failed', ], }, }, paginate: true, limit: 10, pagelength: 10, skip, sort: '-createdat', population: 'datasource' };
    if (req.query.query) {
      queryOptions.query[ '$or' ] = [ {
        name: new RegExp(req.query.query, 'gi'),
      }, {
        display_name: new RegExp(req.query.query, 'gi'),
      }, {
        type: new RegExp(req.query.query, 'gi'),
      }, ];
    }
    let result = await MLModel.query(queryOptions);
    const numItems = await MLModel.model.countDocuments(queryOptions.query);
    const numPages = Math.ceil(numItems / 10);
    let mlmodels = (result && result[ '0' ] && result[ '0' ].documents) ? result[ '0' ].documents : [];
    mlmodels = mlmodels.map(mlmodel => mlmodel = mlmodel.toJSON ? mlmodel.toJSON() : mlmodel);
    req.controllerData = Object.assign({}, req.controllerData, { mlmodels, skip, numItems, numPages, });
    next();
  } catch (e) {
    periodic.logger.warn(e.message);
    res.status(500).send({ message: 'Error retrieving models.', });
  }
}

async function populateDatasource(req, res, next) {
  try {
    const Datasource = periodic.datas.get('standard_datasource');
    req.controllerData = req.controllerData || {};
    let datasource_id = req.controllerData.mlmodels.filter(mlmodel => mlmodel._id.toString() === req.params.id.toString())[ 0 ].datasource;
    let datasource = await Datasource.load({ query: { _id: datasource_id } });
    datasource = (datasource && datasource.toJSON) ? datasource.toJSON() : datasource;
    req.controllerData = Object.assign({}, req.controllerData, { datasource });
    next();
  } catch (e) {
    periodic.logger.warn(e.message);
    res.status(500).send({ message: 'Error populating datasource.', });
  }
}

/** 
 * Retrieves ml models to be displayed on models index page
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function getMLModelsForProcessing(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const MLModel = periodic.datas.get('standard_mlmodel');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let skip = req.query.pagenum ? ((Number(req.query.pagenum) - 1) * 10) : 0;
    let queryOptions = ([ 'mlmodels', 'deleteTestCasesModal', ].indexOf(req.query.pagination) !== -1)
      ? { query: { organization, }, population: 'true', sort: { createdat: -1, }, fields: [ 'name', 'display_name', 'type', 'createdat', 'user', 'status', 'progress', ], }
      : req.body.query ? { query: Object.assign({}, req.body.query, organization), population: 'true', sort: { createdat: -1, }, } : { query: { organization, }, population: 'true', sort: { createdat: -1, }, };
    if (req.query.query) {
      queryOptions.query[ '$or' ] = [ {
        name: new RegExp(req.query.query, 'gi'),
      }, {
        type: new RegExp(req.query.query, 'gi'),
      }, {
        display_name: new RegExp(req.query.query, 'gi'),
      }, ];
    }
    let mlmodels = await MLModel.query(queryOptions);
    if (mlmodels && mlmodels.length) {
      mlmodels = mlmodels.map(mlmodel => {
        mlmodel = mlmodel.toJSON ? mlmodel.toJSON() : mlmodel;
        mlmodel.formattedCreatedAt = (mlmodel.createdat && mlmodel.user && mlmodel.user.creator) ? `${transformhelpers.formatDateNoTime(mlmodel.createdat, user.time_zone)} by ${mlmodel.user.creator}` : '';
        mlmodel.type = (mlmodel.type && mlmodel.type === 'regression') ? 'Linear'
          : (mlmodel.type)
            ? capitalize(mlmodel.type)
            : '';
        mlmodel.status = capitalize.words(mlmodel.status.replace('_', ' '));
        mlmodel.organization = mlmodel.organization._id.toString();
        // mlmodel.progressBar = { progress: mlmodel.progress, label: mlmodel.model_training_status || 'Complete', state: (mlmodel.progress === 100) ? 'success' : '', };
        mlmodel.progressBar = {
          progress: mlmodel.progress,
          state: (mlmodel.status === 'Error' || mlmodel.status === 'failed')
            ? 'error'
            : (mlmodel.status === 'complete' || mlmodel.status === 'Complete' || mlmodel.progress === 100)
              ? 'success'
              : null,
        };
        return mlmodel;
      });

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
  } catch (e) {
    logger.warn('Error in getMLModels: ', e);
  }
}

async function getCompleteModels(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const MLModel = periodic.datas.get('standard_mlmodel');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let mlmodels = await MLModel.query({ query: { organization, status: 'complete', }, population: 'true', limit: 100000 });
    req.controllerData = Object.assign({}, req.controllerData, { mlmodels, });
    return next();
  } catch (e) {
    logger.warn('Error in getCompleteModels: ', e);
    req.error = 'Error retrieving models';
    return req;
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
      queryOptions.query[ '$or' ] = [ {
        model_name: new RegExp(req.query.query, 'gi'),
      }, {
        decision_name: new RegExp(req.query.query, 'gi'),
      }, ];
    }
    let result = await MLCase.query(queryOptions);
    const numItems = await MLCase.model.countDocuments(queryOptions.query);
    const numPages = Math.ceil(numItems / 10);
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
      numItems,
      numPages,
    });
    return next();
  } catch (e) {
    logger.warn('Error finding ML Cases.');
  }
}

async function createDataSource(req, res, next) {
  try {
    req.body = req.body || {};
    req.controllerData = req.controllerData || {};
    if (req.controllerData.MLDatasource && req.body.data) {
      let Datasource = periodic.datas.get('standard_datasource');
      let MLDatasource = req.controllerData.MLDatasource;
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      let data_source_system_name = req.controllerData.mlmodel.name.toLowerCase().replace(/\s+/g, '_');
      let createOptions = {
        name: data_source_system_name,
        original_file: req.body.data.original_file || {},
        data_schema: JSON.stringify(MLDatasource.data_schema),
        strategy_data_schema: JSON.stringify(MLDatasource.strategy_data_schema),
        observation_count: MLDatasource.row_count,
        predictor_variable_count: MLDatasource.headers.length,
        user: req.user._id,
        organization,
      };
      let created = await Datasource.create(createOptions);
      created = created.toJSON ? created.toJSON() : created;
      req.controllerData.updatedoc = { datasource: created._id.toString(), };
      return next();
    } else {
      return next();
    }
  } catch (e) {
    logger.warn('Error in createDataSource: ', e);
    return next(e);
  }
}

async function updateModel(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const MLModel = periodic.datas.get('standard_mlmodel');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    if (req.controllerData.updatedoc && req.controllerData.updatedoc.user) req.controllerData.updatedoc.user.updater = `${user.first_name} ${user.last_name}`;
    let updateParams = (req.controllerData && req.controllerData.mlmodel && req.controllerData.updatedoc) ? { id: req.params.id, updatedoc: Object.assign({}, req.controllerData.mlmodel, { updatedat: new Date(), }, req.controllerData.updatedoc), } : { isPatch: true, id: req.params.id, updatedoc: Object.assign({ updatedat: new Date(), 'user.updater': `${user.first_name} ${user.last_name}`, }, req.body.data), };
    await MLModel.update(updateParams);
    return next();
  } catch (e) {
    logger.warn('Error in updateModel: ', e);
    return next(e);
  }
}

async function redirectToReviewAndTrain(req, res, next) {
  try {
    let redirect_path = `/ml/models/${req.params.id}/training/review_and_train`;
    res.status(200).send({
      status: 200,
      timeout: 10000,
      type: 'success',
      text: 'Changes saved successfully!',
      successProps: {
        successCallback: 'func:window.createNotification',
      },
      responseCallback: 'func:this.props.reduxRouter.push',
      pathname: redirect_path,
    });
  } catch (e) {
    logger.warn('Error in redirectToReviewAndTrain: ', e);
    return next(e);
  }
}

async function redirectToModelSelection(req, res, next) {
  try {
    let redirect_path = `/ml/models/${req.params.id}/model_selection`;
    res.status(200).send({
      timeout: 10000,
      pathname: redirect_path,
    });
  } catch (e) {
    logger.warn('Error in redirectToReviewAndTrain: ', e);
    return next(e);
  }
}

async function createDatasourceProgressModal(req, res, next) {
  try {
    let redirect_path = `/ml/models/${req.params.id}/training/review_and_train`;
    res.status(200).send({
      status: 200,
      timeout: 10000,
      type: 'success',
      text: 'Changes saved successfully!',
      // successProps: {
      //   successCallback: 'func:window.createNotification',
      // },
      // responseCallback: 'func:this.props.reduxRouter.push',
      // pathname: redirect_path,
    });
  } catch (e) {
    logger.warn('Error in redirectToReviewAndTrain: ', e);
    return next(e);
  }
}

function __createCSVString(aggregate, rowArray) {
  let row = rowArray.join(',');
  aggregate += row + '\r\n';
  return aggregate;
}

async function uploadOriginalFilesToS3(req, res, next) {
  try {
    req.body = req.body || {};
    if (req.controllerData.MLDatasource) {
      let MLDatasource = req.controllerData.MLDatasource;
      let csv_headers = MLDatasource.headers;
      let trainingDataRows = MLDatasource.training_data_rows;
      let testingDataRows = MLDatasource.testing_data_rows;
      if (csv_headers && trainingDataRows && testingDataRows) {
        let data_source_system_name = req.controllerData.mlmodel.name.toLowerCase().replace(/\s+/g, '_');
        let aws_container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
        let trainingName = `${moment().format('YYYY-MM-DD_HH-mm')}_${data_source_system_name}_training.csv`;
        let testingName = `${moment().format('YYYY-MM-DD_HH-mm')}_${data_source_system_name}_testing.csv`;
        let s3 = periodic.aws.s3;
        let transformedTrainingCSV = [ csv_headers, ].concat(trainingDataRows).reduce(__createCSVString, '');
        let transformedTestingCSV = [ csv_headers, ].concat(testingDataRows).reduce(__createCSVString, '');
        var trainingParams = {
          Bucket: `${aws_container_name}/mloriginal`,
          Key: trainingName,
          Body: transformedTrainingCSV,
        };
        var testingParams = {
          Bucket: `${aws_container_name}/mloriginal`,
          Key: testingName,
          Body: transformedTestingCSV,
        };
        var options = { partSize: 10 * 1024 * 1024, queueSize: 1, };
        let trainingUploadResult = await s3.upload(trainingParams, options).promise();
        let testingUploadResult = await s3.upload(testingParams, options).promise();
        req.body.data = Object.assign({}, req.body.data, {
          original_file: {
            name: MLDatasource.filename,
            training: {
              Key: trainingName,
              Bucket: `${aws_container_name}/mloriginal`,
              filename: trainingName,
              fileurl: trainingUploadResult.Location,
            },
            testing: {
              Key: testingName,
              Bucket: `${aws_container_name}/mloriginal`,
              filename: testingName,
              fileurl: testingUploadResult.Location,
            },
          },
        });
        return next();
      }
    } else {
      throw new Error('Error uploading datasource to s3');
    }
  } catch (err) {
    req.error = 'Error uploading datasource to s3';
    return next(err);
  }
}

async function uploadIndustryInputFile(req, res, next) {
  try {
    req.body = req.body || {};
    if (req.controllerData.mlmodel.industry && req.controllerData.MLDatasource) {
      let MLDatasource = req.controllerData.MLDatasource;
      const MlModel = periodic.datas.get('standard_mlmodel');
      const industryFileBuffer = Buffer.from(MLDatasource.industry_rows.reduce(mlresource.datasource.__createCSVString, ''));
      const industryFile = await mlresource.datasource.__createReadableStreamBufferAsync(periodic.gridfs.bucket, industryFileBuffer, 'industry_file');
      req.controllerData.updatedoc.industry_headers = MLDatasource.industry_headers;
      req.controllerData.updatedoc.industry_file = industryFile._id.toString();
    }
    next();
  } catch (err) {
    req.error = 'Error uploading industry file to fs.files';
    return next(err);
  }
}

async function splitAndFormatDataSource(req, res, next) {
  try {
    const model_type_map = {
      'binary': 'Boolean',
      'regression': 'Number',
    };
    if (req.controllerData.MLDatasource) {
      let MLDatasource = req.controllerData.MLDatasource;
      req.body.data = Object.assign({}, req.body.data, {
        csv_headers: MLDatasource.headers,
        trainingDataRows: MLDatasource.training_data_rows,
        testingDataRows: MLDatasource.testing_data_rows,
        data_schema: MLDatasource.data_schema,
        strategy_data_schema: MLDatasource.strategy_data_schema,
        csv_data_length: MLDatasource.row_count,
        csv_headers_length: MLDatasource.headers.length,
      });
      return next();
    } else {
      res.state(500).send({ message: 'Could not create datasource', });
    }
  } catch (e) {
    res.status(500).send({ message: e.message, });
  }
}

async function trainProviderModels(req, res, next) {
  try {
    if (req.controllerData.mlmodel) {
      const MLModel = periodic.datas.get('standard_mlmodel');
      const redisClient = periodic.app.locals.redisClient;
      const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
      let user = req.user;
      let mlmodel = req.controllerData.mlmodel;
      let datasource = mlmodel.datasource;
      const aws_models = THEMESETTINGS.machinelearning.providers || [];
      const digifi_models = THEMESETTINGS.machinelearning.digifi_models[ mlmodel.type ] || [];
      //PROVIDER LIST
      await hmsetAsync(`${periodic.environment}_ml_preprocessing:${mlmodel._id.toString()}`, {
        _id: mlmodel._id.toString(),
        type: mlmodel.type,
        numErrors: 0,
        datasource: datasource._id.toString(),
        organization: mlmodel.organization._id.toString(),
        user_id: user._id ? user._id.toString() : '',
      });
      await MLModel.update({
        id: mlmodel._id.toString(),
        updatedoc: {
          'user.updater': `${user.first_name} ${user.last_name}`,
          status: 'training',
          updatedat: new Date(),
          selected_provider: 'neural_network',
          aws_models,
          digifi_models
        },
        isPatch: true,
      });
      return next();
    } else {
      res.status(500).send({ message: 'Could not find machine learning model', });
    }
  } catch (e) {
    res.status(500).send({ message: 'Error training provider models', });
  }
}

async function updateDataSchema(req, res, next) {
  try {
    const Datasource = periodic.datas.get('standard_datasource');
    if (req.body && req.body.data_source_variables && req.controllerData.mlmodel) {
      let included_columns = {};
      let updated_attributes = req.body.data_source_variables.reduce((aggregate, config) => {
        let attributeType;
        if (config.include_column === true) included_columns[ config.uploaded_variable_name ] = { data_type: config.data_type || 'String', };
        switch (config.data_type) {
          case 'Boolean':
            attributeType = 'BINARY';
            break;
          case 'Number':
            if (config.distinct_category) attributeType = 'CATEGORICAL';
            else attributeType = 'NUMERIC';
            break;
          default:
            attributeType = 'CATEGORICAL';
            break;
        }
        aggregate[ config.uploaded_variable_name ] = attributeType;

        return aggregate;
      }, {});
      let data_schema = JSON.parse(req.controllerData.mlmodel.datasource.data_schema);
      data_schema.attributes = data_schema.attributes.map(config => {
        return {
          attributeName: config.attributeName,
          attributeType: updated_attributes[ config.attributeName ],
        };
      });
      data_schema = JSON.stringify(data_schema);
      req.controllerData.mlmodel.datasource.data_schema = data_schema;
      await Datasource.update({ id: req.controllerData.mlmodel.datasource._id.toString(), isPatch: true, updatedoc: { data_schema, included_columns: JSON.stringify(included_columns), }, });
      return next();
    } else {
      res.status(500).send({ message: 'Error updating data schema', });
    }
  } catch (e) {
    res.status(500).send({ message: 'Error updating data schema', });
  }
}

async function updateDatasource(req, res, next) {
  try {
    const Datasource = periodic.datas.get('standard_datasource');
    await Datasource.update({
      id: req.controllerData.updatedoc.datasource,
      updatedoc: {
        providers: {},
        column_unique_counts: req.body.column_unique_counts,
        statistics: req.body.data.statistics,
        transformations: req.body.data.transformations || {},
      },
      isPatch: true,
    });
    return next();
  } catch (e) {
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
 * This function uses the AWS machine learning instance to make an API call to the specified AWS Machine Learning Model and returns the prediction details
 * @param {*} configuration ML configuration object
 * @param {Object} state global state
 * @param {Object} machinelearning AWS machine learning instance
 */
async function predictSingleMLCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.mlmodel) {
      let selected_provider = req.controllerData.mlmodel.selected_provider;
      let single_ml_result = await SINGLE_ML_FUNCTIONS[ selected_provider || 'aws' ](req);
      req.controllerData = Object.assign({}, req.controllerData, {
        single_ml_result,
      });
      next();
    } else {
      throw new Error('Could not find model for prediction');
    }
  } catch (e) {
    let errResp = {};
    if (req.controllerData.transactionParams) {
      errResp = {
        status_code: 400,
        status_message: 'Error',
        errors: [ {
          message: 'Error predicting ML Case.',
        }, ],
      };
    } else {
      errResp = {
        message: 'Error predicting ML Case.',
      };
    }
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse(errResp);
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return res.status(401).send(errResp);
    }
  }
}

async function createIndividualMLCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const MLCase = periodic.datas.get('standard_mlcase');
    if (req.controllerData.single_ml_result) {
      let newDoc = req.controllerData.single_ml_result;
      if (req.query && req.query.application_id) {
        newDoc.application = req.query.application_id;
      }
      let createdCase = await MLCase.create({ newdoc: newDoc, skip_xss: true, });
      res.status(200).send({
        status: 200,
        timeout: 10000,
        type: 'success',
        text: 'Changes saved successfully!',
        successProps: {
          successCallback: 'func:this.props.reduxRouter.push',
        },
        responseCallback: 'func:this.props.reduxRouter.push',
        pathname: `/ml/individual/results/${createdCase._id.toString()}`,
      });
    } else {
      res.status(500).send({ message: 'Error creating ML Case.', });
    }
  } catch (e) {
    res.status(500).send({ message: 'Error creating ML Case.', });
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

async function getMLCaseByQuery(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.query && req.query.mlcase) {
      const MLCase = periodic.datas.get('standard_mlcase');
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      let query = (organization === 'organization') ? { _id: req.query.mlcase, } : { _id: req.query.mlcase, organization, };
      let mlcase = await MLCase.model.findOne(query).lean();
      req.controllerData.mlcase = (mlcase.toJSON) ? mlcase.toJSON() : mlcase;
    }
    next();
  } catch (e) {
    logger.warn('Error finding ML Case.');
    next();
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
      queryOptions.query[ '$or' ] = [ {
        model_name: new RegExp(req.query.query, 'gi'),
      }, {
        name: new RegExp(req.query.query, 'gi'),
      }, ];
    }
    let result = await MLSimulation.query(queryOptions);
    const numItems = await MLSimulation.model.countDocuments(queryOptions.query);
    const numPages = Math.ceil(numItems / 10);
    let simulations = (result && result[ '0' ] && result[ '0' ].documents) ? result[ '0' ].documents : [];
    simulations = simulations.map(simulation => {
      simulation = simulation.toJSON ? simulation.toJSON() : simulation;
      let formattedCreatedAt = (simulation.createdat) ? `${transformhelpers.formatDate(simulation.createdat, user.time_zone)}` : '';
      let progressBar = {
        progress: simulation.progress,
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
        progress: simulation.progress,
        formattedCreatedAt,
        progressBar,
        organization: (simulation.organization && simulation.organization._id) ? simulation.organization._id.toString() : simulation.organization.toString(),
      };
    });

    if (req.query.pagination === 'mlbatches') {
      req.controllerData = Object.assign({}, req.controllerData, {
        rows: simulations,
        numItems,
        numPages,
      });
    }

    return next();
  } catch (e) {
    logger.warn('Error finding ML Cases.');
  }
}

async function getUploadedMLData(req, res, next) {
  try {
    let hasError = false;
    const max_num_rows = MAX_BATCH_CASE_COUNT;
    if (!/multipart\/form-data/.test(req.headers[ 'content-type' ])) {
      res.status(500).send({ message: 'Please upload a file', });
    } else if (req.headers[ 'content-length' ] > MAX_BATCH_PROCESS_FILESIZE) {
      res.status(404).send({
        message: `Batch Processing is limited to ${MAX_BATCH_PROCESS_FILESIZE / 1048576}MB. Please delete machine learning cases from file before upload.`,
      });
    } else {
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
          res.status(500).send({ message: 'File type must be in .csv, .xls or .xlsx format', });
        } else {
          if (fileType === 'xls' || fileType === 'xlsx') {
            file.on('data', function (chunk) {
              file_data.push(chunk);
            })
              .on('error', function (e) {
                hasError = true;
                req.unpipe(busboy);
                res.set('Connection', 'close');
                res.status(500).send({ message: 'Invalid upload file format.', });
              })
              .on('end', function () {
                var file_buffer = Buffer.concat(file_data);
                var workbook = XLSX.read(file_buffer, { type: 'buffer', });
                let sheet_name = workbook.SheetNames[ 0 ];
                let convertedCSVData = XLSX.utils.sheet_to_csv(workbook.Sheets[ sheet_name ]);
                let converted_csv_rows = [];
                csv.fromString(convertedCSVData)
                  .on('data', function (chunk) {
                    if (converted_csv_rows.length < max_num_rows + 5 && !transformhelpers.objectOrArrayPropertiesAreEmpty(chunk)) {
                      chunk = chunk.map(cellVal => transformhelpers.filterCSVSpecialCharacters(cellVal, true));
                      converted_csv_rows.push(chunk);
                    }
                  })
                  .on('end', function () {
                    let csv_headers = converted_csv_rows.shift();
                    if (converted_csv_rows.length && converted_csv_rows.length > max_num_rows) {
                      hasError = true;
                      req.unpipe(busboy);
                      res.set('Connection', 'close');
                      res.status(500).send({ message: 'The maximum number of cases per batch process is 100.', });
                    }
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
              });
          } else {
            file.pipe(csv())
              .on('data', function (chunk) {
                if (file_data.length < max_num_rows + 5 && !transformhelpers.objectOrArrayPropertiesAreEmpty(chunk)) {
                  chunk = chunk.map(cellVal => transformhelpers.filterCSVSpecialCharacters(cellVal, true));
                  file_data.push(chunk);
                }
              })
              .on('error', function (e) {
                req.error = 'Invalid upload file format.';
                return req;
              })
              .on('end', function () {
                let csv_headers = file_data.shift();
                if (file_data.length && file_data.length > max_num_rows) {
                  hasError = true;
                  req.unpipe(busboy);
                  res.set('Connection', 'close');
                  res.status(500).send({ message: 'The maximum number of cases per batch process is 100.', });
                }
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
                if (!hasError) return next();
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
      industry: req.controllerData.mlmodel.industry || null,
      provider: req.controllerData.mlmodel.selected_provider,
      name: req.controllerData.batch_name || `ML Batch ${count}`,
      model_name: req.controllerData.mlmodel.display_name,
    };

    let mlsimulation = await Mlsimulation.create(createOptions);
    req.controllerData.mlsimulation = (mlsimulation.toJSON) ? mlsimulation.toJSON() : mlsimulation;
    next();
  } catch (e) {
    res.status(500).send({ message: 'Error registering ML Simulation', });
  }
}

async function predictMLCase(options) {
  let { req, model_data, user, organization, count, } = options;
  let selected_model = req.controllerData.mlmodel.selected_provider;
  try {
    return await BATCH_ML_FUNCTIONS[ selected_model ](options);
  } catch (e) {
    logger.warn('Error predicting ml case');
    return {
      inputs: [],
      prediction: {},
      provider: model_data.selected_provider,
      industry: req.controllerData.mlmodel.industry || null,
      decision_name: req.controllerData.decision_name || `Case ${count}`,
      model_name: model_data.display_name,
      processing_type: 'batch',
      mlmodel: model_data._id ? model_data._id.toString() : null,
      model_type: model_data.type,
      user: user._id.toString(),
      organization,
      error: [ e.message, ],
      case_number: '',
    };
  }
}

async function runBatchMLProcess(req, res, next) {
  const Mlbatch = periodic.datas.get('standard_mlbatch');
  const Mlsimulation = periodic.datas.get('standard_mlsimulation');
  const io = periodic.servers.get('socket.io').server;
  req.controllerData = req.controllerData || {};
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  let mlmodel = req.controllerData.mlmodel;
  try {
    let machinelearning = periodic.aws.machinelearning;
    let offset = 0;
    let limit = 20;
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
        let ml_case_result = await predictMLCase({ req, count: count + i, case_data: mlcase, user, organization, machinelearning, });
        let created_case = await Mlcase.create(ml_case_result);
        created_case = (created_case.toJSON) ? created_case.toJSON() : created_case;
        return {
          mlcase: created_case._id.toString(),
          model_type: mlmodel.type,
          industry: mlmodel.industry || null,
          prediction: created_case.prediction,
          decision_name: created_case.decision_name,
          provider: mlmodel.selected_provider,
          decoder: mlmodel.datasource.decoders,
        };
      }));
      count += currentBatchCaseLength;

      let batch_create_options = {
        model_name: mlmodel.display_name,
        results: batch_results,
        decoder: mlmodel.datasource.decoders,
        mlsimulation: req.controllerData.mlsimulation._id.toString(),
        user: user._id.toString(),
        organization,
      };

      let new_batch = await Mlbatch.create(batch_create_options);
      await updateCollectionCounter('standard_mlcase', currentBatchCaseLength -1);
      new_batch = (new_batch.toJSON) ? new_batch.toJSON() : new_batch;
      progress = ((progress / 100) * ml_case_length + currentBatchCaseLength) / ml_case_length * 100;
      let status = progress < 100 ? 'In Progress' : 'Complete';
      io.sockets.emit('decisionProcessing', { progress: Math.floor(progress), _id: req.controllerData.mlsimulation._id.toString(), status, organization, });
      await Mlsimulation.update({
        id: req.controllerData.mlsimulation._id.toString(),
        isPatch: true,
        updatedoc: { status, progress, results: [ new_batch._id.toString(), ], },
      });
      offset += limit;
      return offset;
    }, () => offset < ml_case_length);
    return next();
  } catch (e) {
    io.sockets.emit('decisionProcessing', { _id: req.controllerData.mlsimulation._id.toString(), status: 'Error', organization, });
    await Mlsimulation.update({
      id: req.controllerData.mlsimulation._id.toString(),
      updatedoc: { 'status': 'Error', message: e.message, updatedat: new Date(), },
      isPatch: true,
    });
    logger.error('runBatchMLProcess error', e);
    return next(e);
  }
}

async function deleteModel(req, res, next) {
  try {
    const Datasource = periodic.datas.get('standard_datasource');
    const MLDataset = periodic.datas.get('standard_mldataset');
    const MLModel = periodic.datas.get('standard_mlmodel');
    const Strategy = periodic.datas.get('standard_strategy');
    const BatchPrediction = periodic.datas.get('standard_batchprediction');
    const InputAnalysis = periodic.datas.get('standard_inputanalysis');
    const ScoreAnalysis = periodic.datas.get('standard_scoreanalysis');
    const { bucket, db } = periodic.gridfs;
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let s3 = periodic.aws.s3;
    const default_sagemaker_bucket = periodic.aws.sagemaker_bucket;
    let machinelearning = periodic.aws.machinelearning;
    let sagemaker = periodic.aws.sagemaker;
    let mlmodel = req.controllerData.mlmodel;
    let strategies = mlmodel.strategies || [];
    let dataset = await MLDataset.load({ query: { mlmodel: mlmodel._id.toString() } });
    dataset = (dataset && dataset.toJSON) ? dataset.toJSON() : dataset;
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
      // aws deletions
      if (mlmodel.aws) {
        if (mlmodel.aws.batch_training_id) {
          // delete AWS ML Training Batch Prediction
          await machinelearning.deleteBatchPrediction({
            BatchPredictionId: `${mlmodel.aws.batch_training_id._id.toString()}_${mlmodel.aws.batch_training_id.createdat.getTime()}`, /* required */
          }).promise();

          // await s3.deleteObject({
          //   Bucket: mlmodel.aws.batch_training_id.Bucket,
          //   Key: mlmodel.aws.batch_training_id.Key,
          // }).promise();
          // delete Mongo aws training batch prediction
          await BatchPrediction.delete({ deleteid: mlmodel.aws.batch_training_id._id.toString(), });
        }
        if (mlmodel.aws.batch_testing_id) {
          // delete AWS ML Testing Batch Prediction
          await machinelearning.deleteBatchPrediction({
            BatchPredictionId: `${mlmodel.aws.batch_testing_id._id.toString()}_${mlmodel.aws.batch_testing_id.createdat.getTime()}`,
          }).promise();

          // await s3.deleteObject({
          //   Bucket: mlmodel.aws.batch_testing_id.Bucket,
          //   Key: mlmodel.aws.batch_testing_id.Key,
          // }).promise();
          // delete Mongo aws testing batch prediction
          await BatchPrediction.delete({ deleteid: mlmodel.aws.batch_testing_id._id.toString(), });
        }
        if (mlmodel.aws.evaluation_id) {
          // delete AWS ML Evaluation
          await machinelearning.deleteEvaluation({
            EvaluationId: mlmodel.aws.evaluation_id,
          }).promise();
        }
        if (mlmodel.selected_provider === 'aws' && mlmodel.aws.real_time_prediction_id) {
          // delete AWS ML Real Time Endpoint
          await machinelearning.deleteRealtimeEndpoint({
            MLModelId: mlmodel.aws.real_time_prediction_id,
          }).promise();
          // delete AWS ML Model
          await machinelearning.deleteMLModel({
            MLModelId: mlmodel.aws.real_time_prediction_id,
          }).promise();
        }

        if (mlmodel.datasource && mlmodel.datasource.providers && mlmodel.datasource.providers.aws) {
          // delete AWS training datasource
          await machinelearning.deleteDataSource({
            DataSourceId: `${mlmodel.datasource._id.toString()}_training_${mlmodel.createdat.getTime()}`,
          }).promise();
          // delete AWS testing datasource
          await machinelearning.deleteDataSource({
            DataSourceId: `${mlmodel.datasource._id.toString()}_testing_${mlmodel.createdat.getTime()}`,
          }).promise();
        }
      }

      // sagemaker models delete
      await Promise.all([ 'sagemaker_ll', 'sagemaker_xgb' ].map(async provider => {
        if (mlmodel[ provider ]) {
          if (mlmodel[ provider ].batch_training_id) {
            // delete sagemaker AWS s3 batch training artifact
            await s3.deleteObject({
              Bucket: mlmodel[ provider ].batch_training_id.Bucket,
              Key: mlmodel[ provider ].batch_training_id.Key,
            }).promise();
            // delete sagemaker mongo Training Batch Prediction
            await BatchPrediction.delete({ deleteid: mlmodel[ provider ].batch_training_id._id.toString(), });
          }
          if (mlmodel[ provider ].batch_testing_id) {
            // delete sagemaker AWS s3 batch testing artifact
            await s3.deleteObject({
              Bucket: mlmodel[ provider ].batch_testing_id.Bucket,
              Key: mlmodel[ provider ].batch_testing_id.Key,
            }).promise();
            // delete sagemaker mongo Testing Batch Prediction
            await BatchPrediction.delete({ deleteid: mlmodel[ provider ].batch_testing_id._id.toString(), });
          }

          // sagemaker real time endpoint and endpointconfig
          if (mlmodel.selected_provider === provider && mlmodel[ provider ].real_time_prediction_id) {
            await sagemaker.deleteEndpointConfig({ EndpointConfigName: mlmodel[ provider ].real_time_prediction_id, }).promise();
            await sagemaker.deleteEndpoint({ EndpointName: mlmodel[ provider ].real_time_prediction_id, }).promise();
          }

          //sagemaker datasource
          if (mlmodel.datasource && mlmodel.datasource.providers && mlmodel.datasource.providers[ provider ]) {
            let provider_config = mlmodel.datasource.providers[ provider ];
            // delete sagemaker s3 training
            await s3.deleteObject({
              Bucket: provider_config.training.Bucket || default_sagemaker_bucket,
              Key: provider_config.training.Key,
            }).promise();
            // delete sagemaker s3 testing
            await s3.deleteObject({
              Bucket: provider_config.testing.Bucket || default_sagemaker_bucket,
              Key: provider_config.testing.Key,
            }).promise();
            // delete sagemaker s3 training batch
            if (provider_config.trainingbatch) {
              await s3.deleteObject({
                Bucket: provider_config.trainingbatch.Bucket || default_sagemaker_bucket,
                Key: provider_config.trainingbatch.Key,
              }).promise();
            }
          }
        }
      }))

      if (dataset) {
        if (dataset.training) {
          bucket.delete(ObjectId(dataset.training.rows), (err) => {
            if (err) logger.warn(err);
          });
          bucket.delete(ObjectId(dataset.training.historical_result), (err) => {
            if (err) logger.warn(err);
          });
        }
        if (dataset.testing) {
          bucket.delete(ObjectId(dataset.testing.rows), (err) => {
            if (err) logger.warn(err);
          });
          bucket.delete(ObjectId(dataset.testing.historical_result), (err) => {
            if (err) logger.warn(err);
          });
        }
      }

      InputAnalysis.model.deleteOne({ mlmodel: mlmodel._id.toString() }, (err) => {
        if (err) logger.warn(err);
      });
      ScoreAnalysis.model.deleteMany({ mlmodel: mlmodel._id.toString() }, (err) => {
        if (err) logger.warn(err);
      });

      // digifi models delete
      await Promise.all([ 'decision_tree', 'random_forest', 'neural_network' ].map(async provider => {
        if (mlmodel[ provider ]) {
          if (mlmodel[ provider ].batch_training_id) {
            // delete digifi model mongo Training Batch Prediction
            await BatchPrediction.delete({ deleteid: mlmodel[ provider ].batch_training_id._id.toString(), });
          }
          if (mlmodel[ provider ].batch_testing_id) {
            // delete digifi model mongo Testing Batch Prediction
            await BatchPrediction.delete({ deleteid: mlmodel[ provider ].batch_testing_id._id.toString(), });
          }
        }
      }))

      // overall datasource
      if (mlmodel.datasource) {
        if (mlmodel.datasource.original_file) {
          let original_file = mlmodel.datasource.original_file;
          await s3.deleteObject({
            Bucket: original_file.training.Bucket,
            Key: original_file.training.Key,
          }).promise();
          await s3.deleteObject({
            Bucket: original_file.testing.Bucket,
            Key: original_file.testing.Key,
          }).promise();
        }

        // delete mongo datasource
        await Datasource.delete({ deleteid: mlmodel.datasource._id.toString(), organization, });
      }

      // delete mongo model
      await MLModel.delete({ deleteid: req.params.id, organization, });
      // delete mldataset
      await MLDataset.model.deleteOne({ mlmodel: mlmodel._id.toString() });
      return next();
    }
  } catch (e) {
    next(e);
  }
}

async function updateModelStatusToDeleting(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.mlmodel) {
      const MlModel = periodic.datas.get('standard_mlmodel');
      MlModel.update({ isPatch: true, id: req.params.id, updatedoc: { updatedat: new Date(), status: 'deleting', }, });
      return next();
    } else {
      res.status(500).send({ message: 'Error retrieving model', });
    }
  } catch (e) {
    logger.error('updateModelStatusToDeleting error', e);
    return next(e);
  }
}

async function downloadSampleDataSourceData(req, res) {
  let filepath = path.join(process.cwd(), `content/files/sample/${req.query.type}.${req.query.export_format || 'csv'}`);
  let file = await fs.readFile(filepath);
  let filename = `Sample Data - ${capitalize(req.query.type)} - DigiFi Machine Learning.csv`;
  let contenttype = 'text/csv';
  res.set('Content-Type', contenttype);
  res.attachment(filename);
  res.status(200).send(file).end();
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

function downloadCSV(req, res) {
  try {
    if (req.controllerData && req.controllerData.download_content) {
      res.set('Content-Type', 'text/csv');
      res.attachment(`${req.controllerData.doc.name}_${new Date()}.csv`);
      res.status(200).send(req.controllerData.download_content).end();
    } else {
      res.status(500).send({ message: 'Could not download case results.', });
    }
  } catch (e) {
    res.status(500).send({ message: 'Could not download case results.', });
  }
}

async function getIndustryProviderBatchData(req, res, next) {
  try {
    req.controllerData.batchdata = [];
    if (req.controllerData.mlmodel && req.controllerData.mlmodel.industry) {
      // for industry specific: order of data download ==> Predictive Data /// Historical Result /// Loan Payment Data /// DigiFi Score /// ADR
      const mlmodel = req.controllerData.mlmodel;
      const industryHeaders = req.controllerData.mlmodel.industry_headers;
      let batch_type = req.params.batch_type;
      req.controllerData.batchdata = {};
      const aws_models = mlmodel.aws_models || [];
      const digifi_models = mlmodel.digifi_models || [];
      const all_training_models = [ ...aws_models, ...digifi_models ].length ? [ ...aws_models, ...digifi_models ] : [ 'aws', 'sagemaker_ll', 'sagemaker_xgb' ];
      let success_providers = all_training_models.filter(provider => mlmodel[ provider ] && (mlmodel[ provider ].status === 'complete' || mlmodel[ provider ].status === 'completed'));
      let batchdata = await Promise.all(success_providers.map(provider => FETCH_PROVIDER_BATCH_DATA[ provider ]({ mlmodel, batch_type, provider })));
      batchdata = success_providers.reduce((acc, provider, i) => {
        acc[ provider ] = batchdata[ i ];
        return acc;
      }, {});
      const original_file = await FETCH_PROVIDER_BATCH_DATA[ 'original' ]({ mlmodel, batch_type, });
      const predictorVariableHeaders = original_file.shift();
      const inputAnalysisData = await openDownloadStreamAsync(periodic.gridfs.bucket, ObjectId(mlmodel.industry_file));
      const analysisData = [];
      const [ minIdx, maxIdx ] = (batch_type === 'training') ? [0, 6] : [7, 10];
      inputAnalysisData.forEach((row, i) => {
        const mod10 = i % 10;
        if (mod10 >= minIdx && mod10 <= maxIdx) analysisData.push(row);
      });

      const ScoreAnalysis = periodic.datas.get('standard_scoreanalysis');
      const scoreAnalysisDatas = await ScoreAnalysis.model.find({ mlmodel: mlmodel._id.toString(), type: batch_type });
      const scoreAnalysisEvaluators = {};
      scoreAnalysisDatas.forEach(score_doc => {
        score_doc = score_doc.toJSON ? score_doc.toJSON() : score_doc;
        scoreAnalysisEvaluators[score_doc.provider] = (score_doc.results && score_doc.results.projection_evaluator) ? new Function('x', score_doc.results.projection_evaluator) : null;
      })
      const csv_content = original_file.map((row, rowidx) => {
        // push in analysis data (loan payment data)
        row.push(...analysisData[rowidx]);
        success_providers.forEach(provider => {
          row.push(mapPredictionToDigiFiScore(batchdata[ provider ][ rowidx ]));
        });
        success_providers.forEach(provider => {
          if (scoreAnalysisEvaluators[provider]) {
            const projectedScore = scoreAnalysisEvaluators[provider](mapPredictionToDigiFiScore(batchdata[ provider ][ rowidx ]));
            row.push(projectedScore < 0 ? 0 : projectedScore);
          } else row.push(null);
        });
        return row;
      });
      csv_content.unshift([ ...predictorVariableHeaders, ...industryHeaders, ...success_providers.map(pv => MLCONSTANTS.PROVIDER_LABEL[ pv ]), ...success_providers.map(pv => `Projected ADR - ${MLCONSTANTS.PROVIDER_LABEL[ pv ]}`)]);
      req.controllerData.download_content = csv_content.reduce(__createCSVString, '');
      req.controllerData.doc = {};
      req.controllerData.doc.name = `${mlmodel.display_name} ${mlmodel.type === 'regression' ? 'Linear' : capitalize(mlmodel.type)} ${capitalize(batch_type)}`;
    }
    next();
  } catch (e) {
    periodic.logger.warn(e.message);
    res.status(500).send({ message: 'Error retrieving model.', });
  }
}

async function getProviderBatchData(req, res, next) {
  try {
    req.controllerData.batchdata = [];
    if (req.controllerData.mlmodel && !req.controllerData.mlmodel.industry) {
      const mlmodel = req.controllerData.mlmodel;
      const batch_type = req.params.batch_type;
      req.controllerData.batchdata = {};
      const aws_models = mlmodel.aws_models || [];
      const digifi_models = mlmodel.digifi_models || [];
      const all_training_models = [ ...aws_models, ...digifi_models ].length ? [ ...aws_models, ...digifi_models ] : [ 'aws', 'sagemaker_ll', 'sagemaker_xgb' ];
      const success_providers = all_training_models.filter(provider => mlmodel[ provider ] && (mlmodel[ provider ].status === 'complete' || mlmodel[ provider ].status === 'completed'));
      let batchdata = await Promise.all(success_providers.map(provider => FETCH_PROVIDER_BATCH_DATA[ provider ]({ mlmodel, batch_type, provider })));
      batchdata = success_providers.reduce((acc, provider, i) => {
        acc[ provider ] = batchdata[ i ];
        return acc;
      }, {});
      const original_file = await FETCH_PROVIDER_BATCH_DATA[ 'original' ]({ mlmodel, batch_type, });
      const headers = original_file.shift();
      const csv_content = original_file.map((row, rowidx) => {
        success_providers.forEach(provider => {
          row.push(batchdata[ provider ][ rowidx ]);
        });
        return row;
      });
      csv_content.unshift([ ...headers, ...success_providers.map(pv => MLCONSTANTS.PROVIDER_LABEL[ pv ]), ]);
      req.controllerData.download_content = csv_content.reduce(__createCSVString, '');
      req.controllerData.doc = {};
      req.controllerData.doc.name = `${mlmodel.display_name} ${mlmodel.type === 'regression' ? 'Linear' : capitalize(mlmodel.type)} ${capitalize(batch_type)}`;
    }
    next();
  } catch (e) {
    periodic.logger.warn(e.message);
    res.status(500).send({ message: 'Error retrieving model.', });
  }
}

/**
* Retreives mongo model data by name
* @param {Object} req Express request object
* @param {Object} res Express response object
* @param {Function} next Express next function
*/
async function getModelByName(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let modelname = req.body.model_name;
    const MLModel = periodic.datas.get('standard_mlmodel');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let query = (organization !== 'organization') ? { name: modelname, organization, } : { name: modelname, };
    let mlmodel = await MLModel.load({ query, });
    if (!mlmodel) {
      if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
        let xmlError = api_utilities.formatXMLErrorResponse('Unable to find the the requested model.');
        res.set('Content-Type', 'application/xml');
        return res.status(500).send(xmlError);
      } else {
        return res.status(500).send({
          status: 500,
          data: {
            error: 'Unable to find the the requested model.',
          },
        });
      }
    }
    mlmodel = mlmodel.toJSON ? mlmodel.toJSON() : mlmodel;
    req.controllerData.mlmodel = mlmodel;
    next();
  } catch (e) {
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse(e);
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return res.status(401).send({
        error: e,
      });
    }
  }
}

async function downloadOriginalDatasource(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let mlmodel = req.controllerData.mlmodel;
    req.controllerData.trainingDataRows = await FETCH_PROVIDER_BATCH_DATA[ 'original' ]({ mlmodel, batch_type: 'training', });
    req.controllerData.testingDataRows = await FETCH_PROVIDER_BATCH_DATA[ 'original' ]({ mlmodel, batch_type: 'testing', });
    return next();
  } catch (e) {
    return next(e);
  }
}

async function batchGetModels(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let variables = req.body.variables;
    let models = variables.map(variable => {
      return variable.model_name;
    });
    if (req.body.global_variables && req.body.global_variables[ 'model_name' ]) models.push(req.body.global_variables[ 'model_name' ]);

    const MLModel = periodic.datas.get('standard_mlmodel');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let query = { organization, name: { $in: models, }, };
    let results = await MLModel.query({ query, });
    req.controllerData.modelMap = {};
    req.controllerData.modelIdMap = {};
    req.controllerData.models = results.map(model => {
      model = model.toJSON ? model.toJSON() : model;
      req.controllerData.modelMap[ model.name ] = model;
      req.controllerData.modelIdMap[ model._id.toString() ] = model;
      return model;
    });
    next();
  } catch (e) {
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse(e);
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return res.status(401).send({
        error: e,
      });
    }
  }
}

async function getBatchApiScoreAnalysisDocs(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const mlmodels = req.controllerData.models;
    const modelIdMap = req.controllerData.modelIdMap;
    if (mlmodels && mlmodels.length && modelIdMap) {
      const industryModelIds = mlmodels.reduce((aggregate, mlmodel) => {
        if (mlmodel.industry) aggregate.push(mlmodel._id.toString());
        return aggregate;
      }, []);
      const ScoreAnalysis = periodic.datas.get('standard_scoreanalysis');
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      let query = { organization, mlmodel: { $in: industryModelIds, }, type: 'training' };
      let scoreanalyses = await ScoreAnalysis.model.find(query);
      if (scoreanalyses && scoreanalyses.length) {
        const scoreAnalysisMap = {};
        scoreanalyses = scoreanalyses.map(scoreanalysis => {
          const modelId = scoreanalysis.mlmodel.toString();
          if (modelIdMap[modelId] && modelIdMap[modelId].selected_provider === scoreanalysis.provider) scoreAnalysisMap[modelId] = scoreanalysis;
        })
        req.controllerData.scoreAnalysisMap = scoreAnalysisMap;
      }
    }
    next();
  } catch (e) {
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse(e);
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return res.status(401).send({
        error: e,
      });
    }
  }
}

async function predictBatchMLCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    /*
    required information and nesting
    options: {
      user,
      body, //with variables required for running
      controllerData.mlmodel,
    }
    */
    if (req.body.stringified_variables) {
      let modelCalls = [];
      let { modelMap, scoreAnalysisMap } = req.controllerData;
      let { stringified_variables, stringified_global_variables, } = req.body;
      modelCalls = stringified_variables.map(request => {
        let bodyvariables = Object.assign({}, request);
        let inputs = Object.assign({}, stringified_global_variables, bodyvariables);
        let model_name = request.model_name || stringified_global_variables[ 'model_name' ];
        if (!model_name) throw new Error('Please provide a model name');
        if (!modelMap[ model_name ]) throw new Error('Requested model does not exist.');
        delete inputs.model_name;
        let options = {
          user: req.user,
          body: {
            inputs,
          },
          processing_type: 'batch',
          return_top_contributors: req.body.return_top_contributors || false,
          controllerData: {
            mlmodel: modelMap[ model_name ],
            scoreanalysis: (scoreAnalysisMap && modelMap[ model_name ] && modelMap[ model_name ]._id && scoreAnalysisMap[ modelMap[ model_name ]._id.toString() ]) ? scoreAnalysisMap[ modelMap[ model_name ]._id.toString() ] : null
          },
        };
        let selected_provider = modelMap[ model_name ].selected_provider;
        return SINGLE_ML_FUNCTIONS[ selected_provider || 'aws' ](options);
      });
      let batch_results = await Promise.all(modelCalls);

      req.controllerData = Object.assign({}, req.controllerData, {
        batch_results,
      });
      next();
    } else {
      if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
        let xmlError = api_utilities.formatXMLErrorResponse({ message: 'Could not find model for prediction', });
        res.set('Content-Type', 'application/xml');
        return res.status(401).send(xmlError);
      } else {
        return res.status(401).send({
          error: { messsage: 'Could not find model for prediction', },
        });
      }
    }
  } catch (e) {
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse(e);
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return res.status(401).send({
        error: e,
      });
    }
  }
}

async function checkOrgAccountLimit(req, res) {
  let max_active_model_per_org = THEMESETTINGS.machinelearning.org_max_active_model_count || 10;
  let max_concurrent_model_per_org = THEMESETTINGS.machinelearning.org_max_concurrent_model_count || 1;
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  const MLModel = periodic.datas.get('standard_mlmodel');
  let model_count = await MLModel.model.countDocuments({
    organization,
    status: { $in: [ 'complete', 'failed', 'training', ], },
  });
  let num_in_training = await MLModel.model.countDocuments({
    organization,
    status: 'training',
  });
  if (model_count >= max_active_model_per_org) {
    return res.status(404).send({ status: 'error', 'message': `Maximum number of models per organization is ${max_active_model_per_org}. Please delete models before training a new model.`, });
  } else if (num_in_training >= max_concurrent_model_per_org) {
    return res.status(404).send({ status: 'error', 'message': `There is a model in training. Please try again after training has been completed.`, });
  } else {
    return res.status(200).send({
      status: 200,
      responseCallback: 'func:this.props.reduxRouter.push',
      pathname: '/ml/models/training/basic_information',
    });
  }
}

async function getChartDownloadData(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const mlmodel = req.controllerData.mlmodel;
    const CHARTDATA_DOWNLOAD_MAP = MLCONSTANTS.CHARTDATA_DOWNLOAD_MAP;
    const query = req.query;
    const page = req.query.page;
    const strategy_data_schema = JSON.parse(mlmodel.datasource.strategy_data_schema);
    if (page === 'score_analysis') {
      Object.keys(strategy_data_schema).filter(key => key !== 'historical_result').forEach((key, idx) => {
        CHARTDATA_DOWNLOAD_MAP[ page ].push({ granularity: true, title: `Model Drivers - ${key}` });
      })

      const comparisonScoreConfigs = [{
        title: 'Comparison Score - Predictive Power',
        headers: ['DigiFi False Positive Rate', 'DigiFi True Positive Rate', 'Comparison Score False Positive Rate', 'Comparison Score True Positive Rate'],
        comparisonScoreInverse: mlmodel.comparison_score_inverse === true,
        outer_value: 'comparison_score_roc',
        predictivePowerTable: true,
      }, {
        title: 'Comparison Score - Average Score',
        headers: ['Average DigiFi Score', 'Average Comparison Score'],
        values: ['digifi_score', 'comparison_score'],
        outer_value: 'average_score_rows',
        nestedValues: true,
        granularity: false,
      }]

      const projectedAnnualDefaultRateConfigs = [{
        title: 'Projected Annual Default Rate',
        headers: ['DigiFi Score', 'Projected Annual Default Rate %'],
        values: ['adr_projected'],
        granularity: false,
      }]

      CHARTDATA_DOWNLOAD_MAP[ page ].push(...comparisonScoreConfigs, ...projectedAnnualDefaultRateConfigs);
    }

    let { title, headers, values, time_series, outer_value, granularity, nestedValues, inverseScores, predictivePowerTable, comparisonScoreInverse } = CHARTDATA_DOWNLOAD_MAP[ page ][ query.index ];
    const Model = periodic.datas.get(`standard_${req.query.page.replace('_', '')}`);
    let csvContent = [];
    if (page === 'input_analysis') {
      // for input analysis chart downloads
      const inputAnalysis = await Model.model.findOne({ mlmodel: mlmodel._id.toString() }).lean();
      const input_variable = query.input_variable || 'summary';
      const analysis_results = inputAnalysis.results;
      const num_bins = query.num_bins || 10;
      const bindata = inputAnalysis.bindata;
      let rows;
      if (input_variable === 'summary') {
        handleSummaryInputAnalysis({ time_series, csvContent, values, headers, title, rows, analysis_results });
        title = `${mlmodel.display_name} - ${title} - Summary`;
      } else {
        handleInputVariableInputAnalysis({ time_series, csvContent, values, headers, title, rows, analysis_results, num_bins, bindata, input_variable });
        title = `${mlmodel.display_name} - ${title} - ${input_variable}`;
      }
      csvContent.unshift(headers);
    } else if (page === 'score_analysis') {
      // for score analysis chart downloads
      const provider = query.provider || mlmodel.selected_provider;
      const type = query.batch_type || 'testing';
      const scoreAnalysis = await Model.model.findOne({ mlmodel: mlmodel._id.toString(), provider, type }).lean();
      const max_score = 850;
      const minimum_score = query.minimum_score || 300;
      granularity = (!granularity) 
        ? 10
        : (query.granularity && !isNaN(parseFloat(query.granularity)))
          ? parseFloat(query.granularity)
          : 50;
      
      const numBins = granularity === 50 ? Math.floor((max_score - minimum_score) / granularity) : Math.floor((max_score - minimum_score) / granularity) + 1;
      const bins = scoreAnalysis.results[ `bins_${granularity}` ].slice(0, numBins);
      const scoreData = (outer_value && scoreAnalysis.results[`${outer_value}_${granularity}`]) 
        ? scoreAnalysis.results[`${outer_value}_${granularity}`] 
        : (outer_value && scoreAnalysis.results[outer_value]) 
          ? scoreAnalysis.results[outer_value]
          : scoreAnalysis.results;
      if (predictivePowerTable) {
        const provider_result = mlmodel[ provider ][ `batch_${type}_id` ].results.roc_distribution;
        provider_result.reverse().forEach((roc_point, idx) => {
          let [comparisonScoreTP, comparisonScoreFP ] = [scoreData[idx].true_positive_rate, scoreData[idx].false_positive_rate];
          if (comparisonScoreInverse) {
            comparisonScoreTP = (!isNaN(parseFloat(comparisonScoreTP))) ? 1 - comparisonScoreTP : null;
            comparisonScoreFP = (!isNaN(parseFloat(comparisonScoreFP))) ? 1 - comparisonScoreFP : null;
          }
          csvContent.push([ roc_point.false_positive_rate, roc_point.true_positive_rate, comparisonScoreFP, comparisonScoreTP])
        })
        csvContent.unshift(headers);
      } else {
        handleScoreAnalysis({ scoreData, csvContent, values, headers, title, bins, nestedValues, granularity, time_series, index: Number(query.index), strategy_data_schema, });
      }
      title = `${title} - ${provider} - ${type} - DigiFi Score`;
    }
    req.controllerData.download_content = csvContent.reduce(__createCSVString, '');
    req.controllerData.doc = {};
    req.controllerData.doc.name = title;
    next();
  } catch (e) {
    res.status(500).send({ message: 'Could not download chart data results'});
  }
}

async function deleteMLCase(req, res, next) {
  try {
    const MlCase = periodic.datas.get('standard_mlcase');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let done = await MlCase.delete({ deleteid: req.params.id, organization });
    if (!done) {
      req.error = 'Error in deleting the requested case.';
    }
    next();
  } catch (e) {
    req.error = 'Error in deleting the requested case.';
    next();
  }
}

module.exports = {
  getChartDownloadData,
  getScoreAnalysisDocument,
  uploadIndustryInputFile,
  downloadOriginalDatasource,
  deleteDataSourceIfExists,
  deleteModel,
  checkOrgAccountLimit,
  getModelByName,
  getProviderBatchData,
  getIndustryProviderBatchData,
  downloadSampleDataSourceData,
  trainProviderModels,
  splitAndFormatDataSource,
  createInitialMongoModel,
  createDatasourceProgressModal,
  downloadTutorialData,
  createIndividualMLCase,
  checkModelStatusForDetailPage,
  checkModelStatusForDelete,
  checkIfLinearModelAndCategoricalAWS,
  getModel,
  getInputAnalysis,
  getScoreAnalysis,
  getModels,
  getMLCase,
  getMLBatchSimulations,
  getMLModelsForProcessing,
  getCompleteModels,
  getIndividualMLCases,
  getUploadedMLData,
  predictSingleMLCase,
  updateModel,
  createDataSource,
  uploadOriginalFilesToS3,
  handleControllerDataResponse,
  readCSVDataSource,
  redirectToReviewAndTrain,
  redirectToModelSelection,
  registerMLSimulation,
  runBatchMLProcess,
  updateDatasource,
  downloadCSV,
  checkIfModelExists,
  // uploadSplitFilesToS3,
  deleteMLCase,
  selectModelType,
  updateDataSchema,
  updateModelStatusToDeleting,
  batchGetModels,
  getBatchApiScoreAnalysisDocs,
  populateDatasource,
  predictBatchMLCase,
  getMLCaseByQuery,
};
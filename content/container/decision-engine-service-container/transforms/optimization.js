'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const logger = periodic.logger;
const utilities = require('../utilities');
const CONSTANTS = utilities.constants;
const analysisTable = utilities.views.optimization.components.analysisTable;
const moment = require('moment');
const transformhelpers = require('../utilities/transformhelpers');
const optimizationhelpers = require('../utilities/transforms/optimization');
const mlresource = require('../utilities/mlresource');
const Busboy = require('busboy');
const csv = require('fast-csv');
const unflatten = require('flat').unflatten;
const converter = require('json-2-csv');
const numeral = require('numeral');
const Promisie = require('promisie');
const fsextra = Promisie.promisifyAll(require('fs-extra'));
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const url = require('url');
let randomKey = Math.random;
const capitalize = require('capitalize');
const mathjs = require('mathjs');
const styles = utilities.views.constants.styles;
const cardprops = utilities.views.shared.props.cardprops;
const references = utilities.views.constants.references;
const generateOCRDetailPage = utilities.views.optimization.manifest.ocrDetailPage;
const generateOcrVariableEditModal = utilities.views.optimization.manifest.ocrVariableEditModal;
const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
const shared = utilities.views.shared;
const formElements = shared.props.formElements.formElements;
const Bluebird = require('bluebird');
const qs = require('qs');
const MAX_DATA_SOURCE_FILESIZE = THEMESETTINGS.optimization.data_source_upload_filesize_limit;
const MIN_DATA_SOURCE_FILESIZE = THEMESETTINGS.optimization.data_source_upload_min_filesize;
const XLSX = require('xlsx');

/**
 * Checks if variable name already exists before creation
 * 
 * @param {Object} req Express request object
 * @returns request object with updated error if test case name already exists
 */
function checkVariableExists(req) {
  return new Promise((resolve, reject) => {
    try {
      const Variable = periodic.datas.get('standard_variable');
      if (!req.query.bulk && req.body && req.body.display_name) {
        Variable.load({ query: { display_name: req.body.display_name, }, })
          .then(result => {
            if (result) req.error = `A variable with the name ${result.display_name} already exists. Please change the name of the variable to continue.`;
            return resolve(req);
          })
          .catch(err => {
            logger.error('Unable to load variables', err);
            reject(err);
          });
      } else if (req.body.data) {
        Variable.query({ query: { name: { $in: req.body.data.map(variable => variable.name), }, }, })
          .then(result => {
            let existingNames = result.map(variable => variable.name).join(', ');
            if (result.length) req.error = `The variable system name(s) ${existingNames} already exists. Please change the name of the variable(s) to continue.`;
            return resolve(req);
          })
          .catch(err => {
            logger.error('Unable to query variables', err);
            reject(err);
          });
      } else {
        resolve(req);
      }
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Checks the variables csv for same names.
 * @param {Object} req Express request object
 */
function checkVariables(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.query.bulk && req.body && req.body.data) {
        let duplicateVariables = [];
        req.body.data.reduce((uniqueVariables, curr) => {
          if (uniqueVariables[ curr.name ]) {
            duplicateVariables.push(curr.name);
          } else {
            uniqueVariables[ curr.name ] = true;
          }
          return uniqueVariables;
        }, {});
        if (duplicateVariables.length) req.error = `The following variables have duplicates names in the csv: ${duplicateVariables.join(', ')}. Please make sure names are unique.`;
      }
      resolve(req);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Formats the uploaded csv into an array of data rows
 * @param {Object} req Express request object
 */
function readCSVDataSource(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.query.bulk || req.query.upload) {
        if (!/multipart\/form-data/.test(req.headers[ 'content-type' ])) {
          req.error = 'Please upload a CSV.';
          return resolve(req);
        }
        if (req.headers[ 'content-length' ] > MAX_DATA_SOURCE_FILESIZE) {
          req.error = `Data sources are limited to ${MAX_DATA_SOURCE_FILESIZE / 1048576}MB. Please delete data source rows from file before upload.`;
          return resolve(req);
        } else if (req.headers[ 'content-length' ] < (MIN_DATA_SOURCE_FILESIZE || 10240)) {
          req.error = `Data sources must be at least ${(MIN_DATA_SOURCE_FILESIZE || 10240) / 1024}KB in size. Please provide a larger data set.`;
          return resolve(req);
        } else {
          let data_source_name;
          var busboy = new Busboy({ headers: req.headers, });
          busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
            if (fieldname === 'data_source_name') data_source_name = val;
          });
          busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
            let file_data = [];
            let fileTypeArr = filename.trim().split('.');
            let fileType = fileTypeArr[ fileTypeArr.length - 1 ];
            if (['csv', 'xls', 'xlsx', ].indexOf(fileType) === -1) {
              req.unpipe(busboy);
              req.error = 'File type must be in .csv, .xls or .xlsx format';
              return resolve(req);
            } else {
              if (fileType === 'xls' || fileType === 'xlsx') {
                file.on('data', function (chunk) {
                  file_data.push(chunk);
                })
                  .on('error', function (e) {
                    req.error = `Invalid csv format: ${e.message}`;
                    return resolve(req);
                  })
                  .on('end', function () {
                    var buffer = Buffer.concat(file_data);
                    var workbook = XLSX.read(buffer, { type: 'buffer', });
                    let sheet_name = workbook.SheetNames[ 0 ];
                    let convertedCSVData = XLSX.utils.sheet_to_csv(workbook.Sheets[ sheet_name ]);
                    let converted_csv_rows = [];
                    csv.fromString(convertedCSVData)
                      .on('data', function (chunk) {
                        converted_csv_rows.push(chunk);
                      })
                      .on('end', function () {
                        let { csv_headers, csv_data, trainingDataRows, testingDataRows, data_schema, strategy_data_schema, csv_data_length, csv_headers_length, historical_result_exists, error, } = transformhelpers.handleDataSourceUploadData(converted_csv_rows);
                        if (!historical_result_exists) {
                          req.error = 'The following column header: historical_result is required. Please ensure that historical_result is provided in the uploaded csv.';
                        } else if (error) {
                          req.error = error;
                        } else {
                          req.body.data = {
                            csv_headers,
                            csv_data,
                            trainingDataRows,
                            testingDataRows,
                            data_source_name,
                            data_source_system_name: data_source_name.toLowerCase().replace(/\s+/g, '_'),
                            data_schema,
                            strategy_data_schema,
                            csv_data_length,
                            csv_headers_length,
                          };
                        }
                        return resolve(req);
                      });
                  });
              } else {
                file.pipe(csv())
                  .on('data', function (chunk) {
                    file_data.push(chunk);
                  })
                  .on('error', function (e) {
                    req.error = `Invalid csv format: ${e.message}`;
                    return resolve(req);
                  })
                  .on('end', function () {
                    let { csv_headers, csv_data, trainingDataRows, testingDataRows, data_schema, strategy_data_schema, csv_data_length, csv_headers_length, historical_result_exists, } = transformhelpers.handleDataSourceUploadData(file_data);
                    if (!historical_result_exists) {
                      req.error = 'The following column header: historical_result is required. Please ensure that historical_result is provided in the uploaded csv.';
                    } else {
                      req.body.data = {
                        csv_headers,
                        csv_data,
                        trainingDataRows,
                        testingDataRows,
                        data_source_name,
                        data_source_system_name: data_source_name.toLowerCase().replace(/\s+/g, '_'),
                        data_schema,
                        strategy_data_schema,
                        csv_data_length,
                        csv_headers_length,
                      };
                    }
                    return resolve(req);
                  });
              }
            }
          });
          busboy.on('finish', function () {
          });
          req.pipe(busboy);
        }
      } else {
        return resolve(req);
      }
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Helper function that generates a temporary file in a local folder
 * @param {Object} options helper function that generates a temporary local file
 */
function __tempFileCreator(options) {
  let { exportData, tempdir, tempFilepath, csv_options, } = options;
  return new Promise((resolve, reject) => {
    try {
      converter.json2csv(exportData, (err, csv) => {
        if (err) {
          reject(err);
        } else {
          fsextra.ensureDir(tempdir, err => {
            if (err) {
              reject(err);
            } else {
              fsextra.outputFileAsync(tempFilepath, csv)
                .then(() => {
                  resolve(true);
                })
                .catch(e => {
                  reject(e);
                });
            }
          });
        }
      }, csv_options);
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Stages and creates temporary data source files locally
 * @param Express request object
 */
function createTempDataSourceFiles(req) {
  return new Promise((resolve, reject) => {
    try {
      req.body = req.body || {};
      if (req.body.data) {
        let { csv_headers, trainingDataRows, testingDataRows, data_source_system_name, } = req.body.data;
        if (csv_headers && trainingDataRows && testingDataRows) {
          const testingName = `${moment().format('YYYY-MM-DD_HH-mm')}_${data_source_system_name}_testing.${req.query.export_format || '.csv'}`;
          const trainingName = `${moment().format('YYYY-MM-DD_HH-mm')}_${data_source_system_name}_training.${req.query.export_format || '.csv'}`;
          const tempdir = path.join(process.cwd(), 'content/files/temp');
          const trainingFilepath = path.join(tempdir, trainingName);
          const testingFilepath = path.join(tempdir, testingName);
          const mimetype = (req.query.export_format === 'csv')
            ? 'text/csv'
            : 'application/json';
          const csv_options = {
            emptyFieldValue: '',
            keys: csv_headers,
            delimiter: {
              wrap: '"', // Double Quote (") character
              // field : ',', // Comma field delimiter
              array: ';', // Semicolon array value delimiter
              // eol   : '\n' // Newline delimiter
            },
            checkSchemaDifferences: false,
          };
          let trainingOptions = {
            exportData: trainingDataRows,
            tempdir,
            tempFilepath: trainingFilepath,
            csv_options,
          };
          let testingOptions = {
            exportData: testingDataRows,
            tempdir,
            tempFilepath: testingFilepath,
            csv_options,
          };

          if (req.query.export_format === 'csv') {
            return Promise.all([__tempFileCreator(trainingOptions), __tempFileCreator(testingOptions), ])
              .then(() => {
                req.body.data = Object.assign({}, req.body.data, {
                  training_file_path: trainingFilepath,
                  testing_file_path: testingFilepath,
                  testingName,
                  trainingName,
                });
                resolve(req);
              })
              .catch(reject);
          } else {
            return resolve(req);
          }
        }
      } else {
        return resolve(req);
      }
    } catch (err) {
      logger.warn('Error in __asyncS3Upload: ', err);
      return reject(err);
    }
  });
}

/**
 * Uploads files to s3
 * @param {Object} s3 AWS s3 instance
 * @param {Object} params s3 params
 * @param {Object} options s3 options
 */
function __asyncS3Upload(s3, params, options) {
  return new Promise((resolve, reject) => {
    try {
      if (s3 && params && options) {
        s3.upload(params, options, function (err, data) {
          if (err) logger.warn('Error uploading to s3: ', err);
          else resolve(data);
        });
      } else {
        resolve(true);
      }
    } catch (err) {
      logger.warn('Error in createTempDataSourceFiles: ', err);
      return reject(err);
    }
  });
}

function __createCSVString(aggregate, rowArray) {
  let row = rowArray.join(',');
  aggregate += row + '\r\n';
  return aggregate;
}

/**
 * Uploads training and testing data source files to s3
 * @param req Express request object
 */
async function uploadSplitFilesToS3(req) {
  try {
    req.body = req.body || {};
    if (req.body.data) {
      let { data_source_system_name, csv_headers, trainingDataRows, testingDataRows, } = req.body.data;
      if (AWS && csv_headers && trainingDataRows && testingDataRows) {
        let aws_container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
        let testingName = `${moment().format('YYYY-MM-DD_HH-mm')}_${data_source_system_name}_testing.${req.query.export_format || '.csv'}`;
        let trainingName = `${moment().format('YYYY-MM-DD_HH-mm')}_${data_source_system_name}_training.${req.query.export_format || '.csv'}`;
        let s3 = periodic.aws.s3;
        testingDataRows.unshift(csv_headers);
        trainingDataRows.unshift(csv_headers);
        let transformedTestingCSV = testingDataRows.reduce(__createCSVString, '');
        let transformedTrainingCSV = trainingDataRows.reduce(__createCSVString, '');
        var testingParams = {
          Bucket: `${aws_container_name}/mldata`,
          Key: testingName,
          Body: transformedTestingCSV,
        };
        var trainingParams = {
          Bucket: `${aws_container_name}/mldata`,
          Key: trainingName,
          Body: transformedTrainingCSV,
        };
        var options = { partSize: 10 * 1024 * 1024, queueSize: 1, };
        let testingUploadResult = await s3.upload(testingParams, options).promise();
        let trainingUploadResult = await s3.upload(trainingParams, options).promise();
        req.body.data = Object.assign({}, req.body.data, {
          testing_data_results: testingUploadResult,
          training_data_results: trainingUploadResult,
          testingName,
          trainingName,
        });
        return req;
      }
    } else {
      return req;
    }
  } catch (err) {
    console.log({ err, });
    req.error = 'Error uploading datasource to s3';
    return req;
  }
}

/**
 * Stages asset properties for ml asset document creation
 * @param {Object} options ml asset options
 */
function stageAssetProperties(options) {
  try {
    let { name, data_source, user, type, } = options;
    let aws_container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
    let assetOptions = {
      'attributes': {
        'delimiter': null,
        'lastModified': null,
        'etag': null,
        'original_filename': name,
        'periodicFilename': name,
        'encrypted_client_side': false,
        'fieldname': `${type}_data_source`,
        'location': data_source.Location,
        'cloudcontainername': aws_container_name,
        'cloudfilepath': data_source.key,
        'endpoint': {
          'href': 'https://s3.amazonaws.com/',
          'path': '/',
          'pathname': '/',
          'hostname': 's3.amazonaws.com',
          'port': 443,
          'host': 's3.amazonaws.com',
          'protocol': 'https:',
        },
        'cdnSslUri': `https://s3.amazonaws.com/${aws_container_name}`,
        'cdnUri': `http://s3.amazonaws.com/${aws_container_name}`,
      },
      'size': null,
      'assettype': 'application/octet-stream',
      'locationtype': 'amazon',
      'encrypted_client_side': 'false',
      'fileurl': data_source.Location,
      'name': name,
      'title': name,
      'author': user._id.toString(),
      'updatedat': new Date(),
      'createdat': new Date(),
      'entitytype': 'asset',
      'status': 'VALID',
      '__v': 0,
    };

    return assetOptions;
  } catch (e) {
    console.log({ e, });
    logger.warn('Error in stageAssetProperties: ', e);
    return;
  }
}

/**
 * Creates mongo ml asset documents for training and testing data
 * @param req Express request object
 */
function generateMLAssets(req) {
  return new Promise((resolve, reject) => {
    try {
      req.body = req.body || {};
      if (req.body.data) {
        let { testing_data_results, training_data_results, trainingName, testingName, } = req.body.data;
        let MLAsset = periodic.datas.get('standard_mlasset');
        let trainingAssetOptions = stageAssetProperties({ name: trainingName, data_source: training_data_results, user: req.user, type: 'training', });
        let testingAssetOptions = stageAssetProperties({ name: testingName, data_source: testing_data_results, user: req.user, type: 'testing', });
        return Promise.all([MLAsset.create(trainingAssetOptions), MLAsset.create(testingAssetOptions), ])
          .then(results => {
            let [training, testing, ] = results;
            req.body.data = Object.assign({}, req.body.data, {
              training_asset: training,
              testing_asset: testing,
            });
            resolve(req);
          })
          .catch(reject);
      } else {
        return resolve(req);
      }
    } catch (err) {
      logger.warn('Error in generateMLAssets: ', err);
      return reject(err);
    }
  });
}

/**
 * Deletes locally created data source files
 * @param req Express request object
 */
function clearTempDataSourceFiles(req) {
  return new Promise((resolve, reject) => {
    try {
      req.body = req.body || {};
      if (req.body.data) {
        let { training_file_path, testing_file_path, } = req.body.data;
        return Promise.all([fsextra.remove(training_file_path), fsextra.remove(testing_file_path), ])
          .then(() => {
            return resolve(req);
          })
          .catch(reject);
      } else {
        return resolve(req);
      }
    } catch (err) {
      logger.warn('Error in clearTempDataSourceFiles: ', err);
      return reject(err);
    }
  });
}

/**
 * Format ML analysis page
 * @param req Express request object
 */
function formatAnalysisPage(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      let idx = (req.body && req.body.navbar && !isNaN(req.body.navbar.optimization_index)) ? Number(req.body.navbar.optimization_index) : 0;
      let data = (req.controllerData.data.batch_training_id.results && req.controllerData.data.batch_testing_id.results) ? [req.controllerData.data.batch_testing_id.results, req.controllerData.data.batch_training_id.results, ] : [{}, {}, ];
      const modelTypeMap = {
        'binary': 'Binary Classification',
        'regression': 'Linear Regression',
        'categorical': 'Multiple Classification',
      };
      req.controllerData.data.display_type = modelTypeMap[ req.controllerData.data.type ] || 'Binary Classification';
      req.controllerData.data.data_source = (req.controllerData.data.datasource) ? req.controllerData.data.datasource.display_name : '';
      req.controllerData.data.creator = req.controllerData.data.user ? `${req.controllerData.data.user.first_name} ${req.controllerData.data.user.last_name}` : '';
      req.controllerData._children = {
        optimization_chart_card: optimizationhelpers.createOptimizationLayout({ idx, data, modeldata: req.controllerData.data, params: req.params, formdata: req.body, }),
        optimization_download_dropdown: optimizationhelpers.downloadButtonDropdown({ modeldata: req.controllerData.data, }),
      };
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Format table generated during analys page selection to be downloaded
 * @param req Express request object
 */
function formatTableForDownload(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      let formdata = (req.query.formdata) ? JSON.parse(req.query.formdata) : {};
      let configuration_index = req.query.configuration_index || 0;
      let configuration = CONSTANTS.OPTIMIZATION[ req.controllerData.data.type || 'binary' ][ configuration_index ];
      let data = (req.controllerData.data.batch_training_id.results && req.controllerData.data.batch_testing_id.results) ? [req.controllerData.data.batch_testing_id.results, req.controllerData.data.batch_training_id.results, ] : [{}, {}, ];
      let { rows, headers, } = analysisTable[ configuration.tableFunc ]({ configuration, data, formdata, });
      let headerMap = headers.reduce((reduced, header) => {
        reduced[ header.sortid ] = header.label;
        return reduced;
      }, {});
      let download_rows = rows.map(row => {
        return Object.keys(row).reduce((reduced, rowkey) => {
          reduced[ headerMap[ rowkey ] ] = row[ rowkey ];
          return reduced;
        }, {});
      });
      req.controllerData.flattenedOutput = download_rows;
      req.controllerData.flattenedOutputName = `${req.controllerData.data.name}_${configuration.subsection}_${new Date()}`;
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Format model detail page
 * @param req Express request object
 */
function formatModelPage(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      let model = req.controllerData.data;
      let dataMap = {
        'NUMERIC': 'Number',
        'BINARY': 'Boolean',
        'CATEGORICAL': 'String',
      };
      let model_variables = [];
      let data_schema_map = {};

      if (model && model.datasource && model.datasource.data_schema) {
        JSON.parse(model.datasource.data_schema).attributes.forEach(attribute => data_schema_map[ attribute.attributeName ] = dataMap[ attribute.attributeType ]);
      }

      if (model && model.variables) {
        let modelMap = model.variables;
        Object.keys(modelMap).forEach((key, idx) => {
          let { variable_id, data_type, } = modelMap[ key ];
          if (variable_id) {
            model_variables.push({
              uploaded_variable_name: key,
              data_type: data_type,
            });
          } else {
            model_variables.push({
              uploaded_variable_name: key,
              data_type: data_type || 'String',
            });
          }
        });
      } else if (model && model.datasource && model.datasource.data_schema) {
        model_variables = JSON.parse(model.datasource.data_schema).attributes.map(el => {
          return {
            uploaded_variable_name: el.attributeName,
            data_type: dataMap[ el.attributeType ],
          };
        });
      }
      req.controllerData.data = Object.assign({}, req.controllerData.data, {
        model_variables,
        model_type: capitalize(model.type),
        status: capitalize.words(model.status.replace('_', ' ')),
        formattedCreatedAt: `${transformhelpers.formatDateNoTime(model.createdat, req.user.time_zone)} by ${model.user.first_name} ${model.user.last_name}`,
        display_title: model.display_name,
      });
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Format data source detail page
 * @param req Express request object
 */
function formatDataSourcePage(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      if (req.controllerData.datasource && req.query.type === 'getDataSourceSchema') {
        let datasource = req.controllerData.datasource;
        let formoptions = [{ label: 'Number', value: 'Number', }, { label: 'Boolean', value: 'Boolean', }, { label: 'String', value: 'String', }, { label: 'Date', value: 'Date', }, ];
        let strategy_data_schema = JSON.parse(datasource.strategy_data_schema);
        let aws_data_schema = JSON.parse(req.controllerData.datasource.data_schema).attributes;
        let data_source_variables = Object.keys(strategy_data_schema).map((key, i) => {
          return {
            rowProps: {
              'distinct_category': {
                disabled: (strategy_data_schema[ key ].data_type && strategy_data_schema[ key ].data_type === 'Number') ? false : true,
              },
            },
            uploaded_variable_name: key,
            data_type: strategy_data_schema[ key ].data_type,
            distinct_category: aws_data_schema[ i ].attributeType === 'CATEGORICAL' || aws_data_schema[ i ].attributeType === 'BINARY',
          };
        });
        req.controllerData.data = Object.assign({}, datasource, {
          display_title: datasource.display_name,
          formattedCreatedAt: `${transformhelpers.formatDateNoTime(datasource.createdat, req.user.time_zone)} by ${datasource.user.first_name} ${datasource.user.last_name}`,
          data_source_variables,
          formoptions: { data_type: formoptions, },
        });
      } else if (req.controllerData.datasource && req.query.type === 'getDataSourceTransformations') {
        let degreeMap = {
          1: '1st',
          2: '2nd',
          3: '3rd',
          4: '4th',
          5: '5th',
        };
        let statistics = req.controllerData.datasource.statistics;
        let strategy_data_schema = JSON.parse(req.controllerData.datasource.strategy_data_schema);
        let allNumericalPredictors = Object.keys(strategy_data_schema).filter(el => strategy_data_schema[ el ].data_type === 'Number' && el !== 'historical_result');
        let allBooleanPredictors = Object.keys(strategy_data_schema).filter(el => strategy_data_schema[ el ].data_type === 'Boolean' && el !== 'historical_result');
        let allStringPredictors = Object.keys(strategy_data_schema).filter(el => (strategy_data_schema[ el ].data_type === 'String' || strategy_data_schema[ el ].data_type === 'Date') && el !== 'historical_result');
        let variableCards = [...allNumericalPredictors, ...allBooleanPredictors, ...allStringPredictors, ].map((variable_name, idx) => {
          if (statistics[ variable_name ].transform_functions.length) {
            req.controllerData.data[ variable_name ] = statistics[ variable_name ].transform_functions.map(config => {
              if (statistics[ variable_name ].transform_functions.length === 1 && !config) {
                return {
                  type: 'None',
                  score: {
                    r2: 'N/A',
                  },
                  display_func: 'f(x) = x',
                  selected: true,
                };
              } else if (config) {
                if (config.type === 'linear') {
                  config.display_func = 'f(x) = x';
                  config.type = 'none';
                }
                config.type = (config.degree)
                  ? `${capitalize(config.type)} (${degreeMap[ config.degree ]} Degree)` : capitalize(config.type);
                config.selected = (config.selected) ? true : false;
                config.score.r2 = (typeof config.score.r2 === 'number') ? numeral(config.score.r2).format('0.00%') : 'N/A';
                return config;
              }
            });
          } else {
            req.controllerData.data[ variable_name ] = [{
              type: 'None',
              score: {
                r2: 'N/A',
              },
              display_func: 'f(x) = x',
              selected: true,
            }, ];
          }
          return transformhelpers.generatePredictorVariableCard(variable_name, statistics[ variable_name ], idx);
        });
        req.controllerData.data.children = [{
          component: 'ResponsiveForm',
          props: {
            flattenFormData: true,
            footergroups: false,
            blockPageUI: true,
            // setInitialValues: false,
            // useFormOptions: true,
            onSubmit: {
              url: '/optimization/api/datasources/:id?method=saveDataTransformations',
              params: [{
                key: ':id',
                val: '_id',
              }, ],
              options: {
                headers: {
                  'Content-Type': 'application/json',
                },
                method: 'PUT',
              },
              successCallback: 'func:this.props.createNotification',
              successProps: {
                type: 'success',
                text: 'Changes saved successfully!',
                timeout: 10000,
              },
              // responseCallback: 'func:this.props.reduxRouter.push',
            },
            formgroups: [
              // {
              //   gridProps: {
              //     key: randomKey(),
              //     style: {
              //       marginBottom: 0,
              //     },
              //   },
              //   card: {
              //     twoColumns: false,
              //     props: cardprops({
              //       cardTitle: 'Data Transformations',
              //       cardStyle: {
              //         marginBottom: 0,
              //         boxShadow: null,
              //         borderRadius: 0,
              //       },
              //     }),
              //   },
              //   formElements: [ 
              //     {
              //     type: 'layout',
              //     value: {
              //       component: 'p',
              //       children: 'Select one transformation of each data field to include in the machine learning process.',
              //       props: {
              //         style: {
              //           fontStyle: 'italic',
              //           color: styles.colors.gray,
              //         },
              //       },
              //     },
              //   }, 
              //   ],
              // },
              ...variableCards,
            ],
          },
          asyncprops: {
            formdata: ['datasourcedata', 'data', ],
          },
        }, ];
      }
      req.controllerData.data._id = req.controllerData.datasource._id.toString();
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

async function generatePredictorVariableStatistics(req) {
  try {
    let statistics = {};
    let transformations = {};
    if (req.body && req.body.data && req.body.data.csv_data && req.body.data.strategy_data_schema) {
      let { strategy_data_schema, csv_data, csv_headers, } = req.body.data;
      let csv_headers_copy = csv_headers.slice();
      let csv_data_transposed = mathjs.transpose(csv_data);
      let historical_result_index = csv_headers_copy.indexOf('historical_result');
      let historical_result_row = csv_data_transposed.splice(historical_result_index, 1)[ 0 ].map(el => Number(el));
      let degreeMap = {
        1: '1st',
        2: '2nd',
        3: '3rd',
        4: '4th',
        5: '5th',
      };
      csv_headers_copy.splice(historical_result_index, 1);
      const predictionStatisticsHelper = function (header, i) {
        return new Promise((resolve) => {
          statistics[ header ] = statistics[ header ] || {};
          statistics[ header ].transform_functions = statistics[ header ].transform_functions || [];
          if (strategy_data_schema[ 'historical_result' ].data_type === 'Number' || strategy_data_schema[ 'historical_result' ].data_type === 'Boolean') {
            if (strategy_data_schema[ header ] && strategy_data_schema[ header ].data_type === 'Number') {
              let exclude_indices = {};
              let data_row = csv_data_transposed[ i ].reduce((returnData, el, index) => {
                if (isNaN(Number(el))) exclude_indices[ index ] = true;
                else returnData.push(Number(el));
                return returnData;
              }, []);
              let sortedArr = data_row.slice().sort((a, b) => Number(a) - Number(b));
              let mean = transformhelpers.getMean(sortedArr);
              let mode = transformhelpers.getMode(sortedArr);
              let min = transformhelpers.getMinimum(sortedArr);
              let max = transformhelpers.getMaximum(sortedArr);
              let median = transformhelpers.getMedian(sortedArr);
              statistics[ header ] = Object.assign({}, statistics[ header ], {
                mean,
                median,
                mode,
                min,
                max,
              });
              let filtered_historical_result_row = historical_result_row.filter((el, i) => !exclude_indices[ i ]);
              let linear_result = optimizationhelpers.generate_linear_function_evaluator(data_row, filtered_historical_result_row);
              let poly_result_2 = optimizationhelpers.generate_polynomial_function_evaluator(data_row, filtered_historical_result_row, 2);
              let poly_result_3 = optimizationhelpers.generate_polynomial_function_evaluator(data_row, filtered_historical_result_row, 3);
              let poly_result_4 = optimizationhelpers.generate_polynomial_function_evaluator(data_row, filtered_historical_result_row, 4);
              let poly_result_5 = optimizationhelpers.generate_polynomial_function_evaluator(data_row, filtered_historical_result_row, 5);
              let power_result = optimizationhelpers.generate_power_function_evaluator(data_row, filtered_historical_result_row, 3);
              let exp_result = optimizationhelpers.generate_exponential_function_evaluator(data_row, filtered_historical_result_row);
              if (linear_result) statistics[ header ].transform_functions.push(linear_result);
              if (poly_result_2) statistics[ header ].transform_functions.push(poly_result_2);
              if (poly_result_3) statistics[ header ].transform_functions.push(poly_result_3);
              if (poly_result_4) statistics[ header ].transform_functions.push(poly_result_4);
              if (poly_result_5) statistics[ header ].transform_functions.push(poly_result_5);
              if (power_result) statistics[ header ].transform_functions.push(power_result);
              if (exp_result) statistics[ header ].transform_functions.push(exp_result);
              let curr_highest_r2 = 0;
              let curr_highest_r2_index = 0;
              statistics[ header ].transform_functions.forEach((config, i) => {
                if (config.score.r2 > curr_highest_r2) {
                  curr_highest_r2_index = i;
                  curr_highest_r2 = config.score.r2;
                }
              });

              statistics[ header ].transform_functions = statistics[ header ].transform_functions.map((config, i) => {
                if (i === curr_highest_r2_index) config.selected = true;
                else config.selected = false;
                return config;
              });

              statistics[ header ].transform_functions.forEach((config, i) => {
                if (config.selected && config.type !== 'linear') {
                  transformations[ header ] = transformations[ header ] || {};
                  transformations[ header ].evaluator = config.evaluator;
                  transformations[ header ].type = (config.degree)
                    ? `${capitalize(config.type)} (${degreeMap[ config.degree ]} Degree)`
                    : capitalize(config.type);
                }
              });
            } else {
              statistics[ header ].transform_functions.push({});
            }
            resolve(true);
          } else if (strategy_data_schema[ 'historical_result' ].data_type === 'String') {
            if (strategy_data_schema[ header ] && strategy_data_schema[ header ].data_type === 'Number') {
              let exclude_indices = {};
              let data_row = csv_data_transposed[ i ].reduce((returnData, el, index) => {
                if (isNaN(Number(el))) exclude_indices[ index ] = true;
                else returnData.push(Number(el));
                return returnData;
              }, []);
              let sortedArr = data_row.slice().sort((a, b) => Number(a) - Number(b));
              let mean = transformhelpers.getMean(sortedArr);
              let mode = transformhelpers.getMode(sortedArr);
              let min = transformhelpers.getMinimum(sortedArr);
              let max = transformhelpers.getMaximum(sortedArr);
              let median = transformhelpers.getMedian(sortedArr);
              statistics[ header ] = Object.assign({}, statistics[ header ], {
                mean,
                median,
                mode,
                min,
                max,
              });
              let filtered_historical_result_row = historical_result_row.filter((el, i) => !exclude_indices[ i ]);
              let linear_result = optimizationhelpers.generate_linear_function_evaluator(data_row, filtered_historical_result_row);
              if (linear_result) statistics[ header ].transform_functions.push(linear_result);
            } else {
              statistics[ header ].transform_functions.push({});
            }
            resolve(true);
          }
        });
      };  
      // console.time('FUNCARR');
      // // let funcArr = csv_headers_copy.map(predictionStatisticsHelper);
      // console.timeEnd('FUNCARR');
      await Promise.all(csv_headers_copy.map(predictionStatisticsHelper));
      req.body.data = Object.assign({}, req.body.data, { statistics, transformations, });
    }
    return req;
  } catch (err) {
    req.err = err.message;
    return req;
  }
  // });
}

async function formatAddOCRVariableModal(req) {
  try {
    let _id = req.params.id;
    let page = req.params.page ? Number(req.params.page) : 0;
    let location;
    let input;
    let submit_url;
    if (req.query.edit && req.controllerData.selectedOutput) {
      input = req.controllerData.selectedOutput;
      submit_url = `/optimization/api/documents/${_id}/${page}/edit_variable/${req.params.input}?`;
    } else {
      if (!req.body.cropped) {
        req.error = 'Please select an area.';
      } else {
        location = req.body.cropped;
        let parsed_location = JSON.parse(location);
        let from_pt = `(${Math.round(parsed_location.left)}, ${Math.round(parsed_location.top)})`;
        let to_pt = `(${Math.round(parsed_location.left + parsed_location.width)}, ${Math.round(parsed_location.top + parsed_location.height)})`;
        let formatted_location = `${from_pt} to ${to_pt}`;
        input = {
          w: parsed_location.width,
          h: parsed_location.height,
          x: parsed_location.left,
          y: parsed_location.top,
          display_location: formatted_location,
        };
        submit_url = `/optimization/api/documents/${_id}/${page}/add_variable?`;
      }

    }
    let input_variable_dropdown = req.controllerData.input_variables.map(variable => ({ label: variable.display_title, value: variable._id, }));
    req.controllerData.pageLayout = generateOcrVariableEditModal({ _id, page, input_variable_dropdown, input, submit_url, });
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function getInputFromDocument(req) {
  try {
    if (req.controllerData.doc) {
      let { id, page, input, } = req.params;
      let input_arr = req.controllerData.doc.inputs || [];
      let current_input = input_arr[ input ];
      req.controllerData.selectedOutput = current_input;
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatOCRTemplateUploadRequest(req) {
  try {
    let pathname = url.parse(req.headers.referer).pathname.split('/');
    let ocr_route = pathname.slice(pathname.indexOf('ocr') + 1);
    let ocr_doc_id = (ocr_route && ocr_route.length) ? ocr_route[ 0 ] : '';
    req.params.id = ocr_doc_id;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

function generateInputField(ipt) {
  let input;
  switch (ipt.data_type) {
    case 'Number':
      input = {
        name: `inputs.${ipt.title}`,
        type: 'maskedinput',
        createNumberMask: true,
        passProps: {
          mask: 'func:window.numberMaskTwo',
          guid: false,
          placeholderChar: '\u2000',
        },
        customLabel: {
          component: 'span',
          children: [{
            component: 'span',
            children: `${ipt.title} `,
          }, {
            component: 'span',
            children: ipt.data_type,
            props: {
              style: {
                fontStyle: 'italic',
                marginLeft: '2px',
                fontWeight: 'normal',
                color: '#969696',
              },
            },
          }, ],
        },
      };
      break;
    case 'String':
      input = {
        name: `inputs.${ipt.title}`,
        customLabel: {
          component: 'span',
          children: [{
            component: 'span',
            children: `${ipt.title} `,
          }, {
            component: 'span',
            children: ipt.data_type,
            props: {
              style: {
                fontStyle: 'italic',
                marginLeft: '2px',
                fontWeight: 'normal',
                color: '#969696',
              },
            },
          }, ],
        },
      };
      break;
    case 'Boolean':
      input = {
        name: `inputs.${ipt.title}`,
        type: 'dropdown',
        passProps: {
          selection: true,
          fluid: true,
        },
        // value: initValue || 'true',
        options: [{
          label: 'True',
          value: 'true',
        }, {
          label: 'False',
          value: 'false',
        }, ],
        customLabel: {
          component: 'span',
          children: [{
            component: 'span',
            children: `${ipt.title} `,
          }, {
            component: 'span',
            children: ipt.data_type,
            props: {
              style: {
                fontStyle: 'italic',
                marginLeft: '2px',
                fontWeight: 'normal',
                color: '#969696',
              },
            },
          }, ],
        },
      };
      break;
    case 'Date':
      input = {
        name: `inputs.${ipt.title}`,
        type: 'singleDatePicker',
        leftIcon: 'fas fa-calendar-alt',
        passProps: {
          hideKeyboardShortcutsPanel: true,
        },
        customLabel: {
          component: 'span',
          children: [{
            component: 'span',
            children: `${ipt.title} `,
          }, {
            component: 'span',
            children: ipt.data_type,
            props: {
              style: {
                fontStyle: 'italic',
                marginLeft: '2px',
                fontWeight: 'normal',
                color: '#969696',
              },
            },
          }, ],
        },
      };
      break;
    default:
      input = {
        name: `inputs.${ipt.title}`,
        customLabel: {
          component: 'span',
          children: [{
            component: 'span',
            children: `${ipt.title} `,
          }, {
            component: 'span',
            children: ipt.data_type,
            props: {
              style: {
                fontStyle: 'italic',
                marginLeft: '2px',
                fontWeight: 'normal',
                color: '#969696',
              },
            },
          }, ],
        },
      };
  }
  return input;
}

function generateMLIndividualRunProcessPage(req) {
  return new Promise((resolve, reject) => {
    try {
      // let mlcases = req.controllerData.mlcases;
      let mlcaseheaders = [{
        label: 'Date',
        sortid: 'formattedCreatedAt',
      }, {
        label: 'Decision Name',
        sortid: 'decision_name',
      }, {
        label: 'Model Name',
        sortid: 'model_name',
      }, {
        label: ' ',
        headerColumnProps: {
          style: {
            width: '40px',
          },
        },
        columnProps: {
          style: {
            whiteSpace: 'nowrap',
          },
        },
        buttons: [{
          passProps: {
            buttonProps: {
              icon: 'fa fa-pencil',
              className: '__icon_button',
            },
            onClick: 'func:this.props.reduxRouter.push',
            onclickBaseUrl: '/optimization/individual/results/:id',
            onclickLinkParams: [{ 'key': ':id', 'val': '_id', }, ],
          },
        }, ],
      }, ];
      if (req.params.id) {
        req.controllerData = req.controllerData || {};
        let selected_model = req.controllerData.mlmodels.filter(mlmodel => mlmodel._id.toString() === req.params.id.toString())[ 0 ];
        let input_variables = Object.keys(selected_model.variables).map(key => ({ title: key, data_type: selected_model.variables[ key ].data_type, }));
        let inputFields = input_variables.map(generateInputField);
        req.controllerData.pageLayout = [
          {
            component: 'ResponsiveForm',
            props: {
              blockPageUI: true,
              'onSubmit': {
                url: `/optimization/api/individual/run/${req.params.id}?export=true`,
                'options': {
                  'method': 'POST',
                },
                successCallback: 'func:this.props.createNotification',
                successProps: {
                  type: 'success',
                  text: 'Changes saved successfully!',
                  timeout: 10000,
                },
                responseCallback: 'this.props.reduxRouter.push',
              },
              useFormOptions: true,
              flattenFormData: true,
              footergroups: false,
              formgroups: [formGlobalButtonBar({
                left: [{
                  type: 'submit',
                  value: 'RUN MODEL',
                  layoutProps: {
                    size: 'isNarrow',
                  },
                  passProps: {
                    color: 'isSuccess',
                  },
                },
                ],
                right: [{
                  guideButton: true,
                  location: references.guideLinks.models.individualProcessing,
                }, ],
              }),
              {
                gridProps: {
                  key: randomKey(),
                },
                card: {
                  doubleCard: true,
                  leftDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  rightDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  leftCardProps: cardprops({
                    cardTitle: 'Model Execution',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                  rightCardProps: cardprops({
                    cardTitle: 'Individual Results History',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                },
                formElements: [formElements({
                  twoColumns: true,
                  doubleCard: true,
                  left: [{
                    'label': 'Model Name',
                    type: 'dropdown',
                    name: 'selected_model',
                    value: req.params.id,
                    passProps: {
                      selection: true,
                      fluid: true,
                      search: true,
                    },
                    customOnChange: 'func:window.individualMLRunProcessingOnChange',
                    options: req.controllerData.mlmodels.map(mlmodel => ({
                      label: mlmodel.display_name,
                      value: mlmodel._id,
                    })),
                  }, ...inputFields, {
                    name: 'decision_name',
                    customLabel: {
                      component: 'span',
                      children: [{
                        component: 'span',
                        children: 'Decision Name ',
                      }, {
                        component: 'span',
                        children: 'Optional',
                        props: {
                          style: {
                            fontStyle: 'italic',
                            marginLeft: '2px',
                            fontWeight: 'normal',
                            color: '#969696',
                          },
                        },
                      }, ],
                    },
                  }, ],
                  right: [{
                    type: 'layout',
                    value: {
                      component: 'ResponsiveTable',
                      // ignoreReduxProps: true,
                      props: {
                        'flattenRowData': true,
                        'addNewRows': false,
                        'rowButtons': false,
                        'useInputRows': true,
                        simplePagination: true,
                        limit: 10,
                        hasPagination: true,
                        baseUrl: '/optimization/api/individual/cases?pagination=mlcases',
                        'tableSearch': true,
                        'simpleSearchFilter': true,
                        filterSearchProps: {
                          icon: 'fa fa-search',
                          hasIconRight: false,
                          className: 'global-table-search',
                          placeholder: 'SEARCH',
                        },
                        calculatePagination: true,
                        dataMap: [{
                          'key': 'rows',
                          value: 'rows',
                        }, {
                          'key': 'numItems',
                          value: 'numItems',
                        }, {
                          'key': 'numPages',
                          value: 'numPages',
                        },
                        ],
                        ignoreTableHeaders: ['_id', ],
                        headers: mlcaseheaders,

                      },
                      thisprops: {
                        rows: ['rows', ],
                        numItems: ['numItems', ],
                        numPages: ['numPages', ],
                      },
                    },
                  }, ],
                }),
                ],
              },
              ],
            },
            asyncprops: {
              rows: ['casedata', 'rows', ],
              numItems: ['casedata', 'numItems', ],
              numPages: ['casedata', 'numPages', ],
            },
          },
        ];
      } else {
        let model_id = (req.body && req.body.selected_model) ? `/${req.body.selected_model}` : '/undefined';
        req.controllerData = req.controllerData || {};
        req.controllerData.pageLayout = [
          {
            component: 'ResponsiveForm',
            props: {
              blockPageUI: true,
              'onSubmit': {
                url: `/optimization/api/individual/run${model_id}`,
                'options': {
                  'method': 'POST',
                },
                responseCallback: '',
              },
              useFormOptions: true,
              flattenFormData: true,
              footergroups: false,
              formgroups: [formGlobalButtonBar({
                left: [],
                right: [{
                  guideButton: true,
                  location: references.guideLinks.models.individualProcessing,
                }, ],
              }),
              {
                gridProps: {
                  key: randomKey(),
                },
                card: {
                  doubleCard: true,
                  leftDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  rightDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  leftCardProps: cardprops({
                    cardTitle: 'Model Execution',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                  rightCardProps: cardprops({
                    cardTitle: 'Individual Results History',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                },
                formElements: [formElements({
                  twoColumns: true,
                  doubleCard: true,
                  left: [{
                    'label': 'Model Name',
                    type: 'dropdown',
                    name: 'selected_model',
                    passProps: {
                      selection: true,
                      fluid: true,
                      search: true,
                    },
                    customOnChange: 'func:window.individualMLRunProcessingOnChange',
                    options: (req.controllerData.mlmodels) ? req.controllerData.mlmodels.map(mlmodel => ({
                      label: mlmodel.display_name,
                      value: mlmodel._id,
                    })) : [],
                  }, ],
                  right: [{
                    type: 'layout',
                    value: {
                      component: 'ResponsiveTable',
                      // ignoreReduxProps: true,
                      props: {
                        'flattenRowData': true,
                        'addNewRows': false,
                        'rowButtons': false,
                        'useInputRows': true,
                        simplePagination: true,
                        limit: 10,
                        hasPagination: true,
                        baseUrl: '/optimization/api/individual/cases?pagination=mlcases',
                        calculatePagination: true,
                        'tableSearch': true,
                        'simpleSearchFilter': true,
                        filterSearchProps: {
                          icon: 'fa fa-search',
                          hasIconRight: false,
                          className: 'global-table-search',
                          placeholder: 'SEARCH',
                        },
                        dataMap: [{
                          'key': 'rows',
                          value: 'rows',
                        }, {
                          'key': 'numItems',
                          value: 'numItems',
                        }, {
                          'key': 'numPages',
                          value: 'numPages',
                        },
                        ],
                        ignoreTableHeaders: ['_id', ],
                        headers: mlcaseheaders,

                      },
                      thisprops: {
                        rows: ['rows', ],
                        numItems: ['numItems', ],
                        numPages: ['numPages', ],
                      },
                    },
                  }, ],
                }),
                ],
              },
              ],
            },
            asyncprops: {
              rows: ['casedata', 'rows', ],
              numItems: ['casedata', 'numItems', ],
              numPages: ['casedata', 'numPages', ],
            },
          },

        ];
      }
      return resolve(req);
    } catch (err) {
      req.error = err.message;
      return reject(err);
    }
  });
}

function generateMLBatchRunProcessPage(req) {
  return new Promise((resolve, reject) => {
    try {
      // let mlsimulations = req.controllerData.mlsimulations;
      let mlbatchheaders = [{
        label: 'Date',
        sortid: 'formattedCreatedAt',
      }, {
        label: 'Batch Name',
        sortid: 'name',
      }, {
        label: 'Model Name',
        sortid: 'model_name',
      }, {
        label: 'Progress',
        progressBar: true,
        sortid: 'status',
        sortable: false,
        headerColumnProps: {
          style: {
            width: '170px',
          },
        },
      }, {
        label: ' ',
        headerColumnProps: {
          style: {
            width: '40px',
          },
        },
        columnProps: {
          style: {
            whiteSpace: 'nowrap',
          },
        },
        buttons: [{
          passProps: {
            buttonProps: {
              icon: 'fa fa-pencil',
              className: '__icon_button',
            },
            onClick: 'func:this.props.reduxRouter.push',
            onclickBaseUrl: '/optimization/batch/results/:id',
            onclickLinkParams: [{ 'key': ':id', 'val': '_id', }, ],
          },
        }, ],
      }, ];

      req.controllerData = req.controllerData || {};
      if (req.params.id) {
        req.controllerData.mlbatchPage = [
          {
            component: 'ResponsiveForm',
            props: {
              blockPageUI: true,
              'onSubmit': {
                url: '/optimization/api/batch/run',
                'options': {
                  'method': 'POST',
                },
                successCallback: ['func:this.props.refresh', 'func:this.props.createNotification', ],
                successProps: [null, {
                  type: 'success',
                  text: 'Changes saved successfully!',
                  timeout: 10000,
                }, ],
              },
              useFormOptions: true,
              flattenFormData: true,
              footergroups: false,
              formgroups: [formGlobalButtonBar({
                left: [{
                  type: 'submit',
                  value: 'RUN MODEL',
                  layoutProps: {
                    size: 'isNarrow',
                  },
                  passProps: {
                    color: 'isSuccess',
                  },
                }, ],
                right: [{
                  guideButton: true,
                  location: references.guideLinks.models.batchProcessing,
                }, ],
              }),
              {
                gridProps: {
                  key: randomKey(),
                },
                card: {
                  doubleCard: true,
                  leftDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  rightDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  leftCardProps: cardprops({
                    cardTitle: 'Model Execution',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                  rightCardProps: cardprops({
                    cardTitle: 'Batch Results History',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                },
                formElements: [formElements({
                  twoColumns: true,
                  doubleCard: true,
                  left: [{
                    'label': 'Model Name',
                    type: 'dropdown',
                    name: 'selected_model',
                    value: req.params.id,
                    passProps: {
                      selection: true,
                      fluid: true,
                      search: true,
                    },
                    customOnChange: 'func:window.batchMLRunProcessingOnChange',
                    options: req.controllerData.mlmodels.map(mlmodel => ({
                      label: mlmodel.display_name,
                      value: mlmodel._id,
                    })),
                  }, {
                    customLabel: {
                      component: 'div',
                      props: {
                        style: {
                          display: 'flex',
                        },
                      },
                      children: [{
                        component: 'span',
                        props: {
                          style: {
                            flex: '1 1 auto',
                          },
                        },
                        children: 'Source Data File',
                      }, {
                        component: 'ResponsiveButton',
                        children: 'Download Template',
                        thisprops: {
                          onclickPropObject: ['formdata', ],
                        },
                        props: {
                          'onclickBaseUrl': `/optimization/api/download_ml_template/${req.params.id}?export_format=csv`,
                          aProps: {
                            style: {
                              fontWeight: 'normal',
                              color: 'inherit',
                            },
                            token: true,
                            // className: '__ra_rb',
                            // className: '__re-bulma_button __re-bulma_is-success',
                          },
                        },
                      }, ],
                    },
                    name: 'upload_file',
                    type: 'file',
                    children: 'Source Data File',
                  }, {
                    name: 'batch_name',
                    customLabel: {
                      component: 'span',
                      children: [{
                        component: 'span',
                        children: 'Batch Name ',
                      }, {
                        component: 'span',
                        children: 'Optional',
                        props: {
                          style: {
                            fontStyle: 'italic',
                            marginLeft: '2px',
                            fontWeight: 'normal',
                            color: '#969696',
                          },
                        },
                      }, ],
                    },
                  }, ],
                  right: [{
                    type: 'layout',
                    value: {
                      component: 'ResponsiveTable',
                      // ignoreReduxProps: true,
                      hasWindowFunc: true,
                      props: {
                        ref: 'func:window.addRef',
                        'flattenRowData': true,
                        'addNewRows': false,
                        'rowButtons': false,
                        'useInputRows': true,
                        simplePagination: true,
                        limit: 10,
                        hasPagination: true,
                        baseUrl: '/optimization/api/batch/simulations?pagination=mlbatches',
                        calculatePagination: true,
                        'tableSearch': true,
                        'simpleSearchFilter': true,
                        filterSearchProps: {
                          icon: 'fa fa-search',
                          hasIconRight: false,
                          className: 'global-table-search',
                          placeholder: 'SEARCH',
                        },
                        dataMap: [{
                          'key': 'rows',
                          value: 'rows',
                        }, {
                          'key': 'numItems',
                          value: 'numItems',
                        }, {
                          'key': 'numPages',
                          value: 'numPages',
                        },
                        ],
                        ignoreTableHeaders: ['_id', ],
                        headers: mlbatchheaders,

                      },
                      thisprops: {
                        rows: ['rows', ],
                        numItems: ['numItems', ],
                        numPages: ['numPages', ],
                      },
                    },
                  }, ],
                }),
                ],
              },
              ],
            },
            asyncprops: {
              rows: ['simulationdata', 'rows', ],
              numItems: ['simulationdata', 'numItems', ],
              numPages: ['simulationdata', 'numPages', ],
            },
          }, ];
      } else {
        req.controllerData.mlbatchPage = [
          {
            component: 'ResponsiveForm',
            props: {
              blockPageUI: true,
              'onSubmit': {
                url: '/optimization/api/batch/run',
                'options': {
                  'method': 'POST',
                },
                successCallback: ['func:this.props.refresh', 'func:this.props.createNotification', ],
                successProps: [null, {
                  type: 'success',
                  text: 'Changes saved successfully!',
                  timeout: 10000,
                }, ],
              },
              useFormOptions: true,
              flattenFormData: true,
              footergroups: false,
              formgroups: [formGlobalButtonBar({
                left: [],
                right: [{
                  guideButton: true,
                  location: references.guideLinks.models.batchProcessing,
                }, ],
              }),
              {
                gridProps: {
                  key: randomKey(),
                },
                card: {
                  doubleCard: true,
                  leftDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  rightDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  leftCardProps: cardprops({
                    cardTitle: 'Model Execution',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                  rightCardProps: cardprops({
                    cardTitle: 'Batch Results History',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                },
                formElements: [formElements({
                  twoColumns: true,
                  doubleCard: true,
                  left: [{
                    'label': 'Model Name',
                    type: 'dropdown',
                    name: 'selected_model',
                    passProps: {
                      selection: true,
                      fluid: true,
                      search: true,
                    },
                    customOnChange: 'func:window.batchMLRunProcessingOnChange',
                    options: (req.controllerData.mlmodels) ? req.controllerData.mlmodels.map(mlmodel => ({
                      label: mlmodel.display_name,
                      value: mlmodel._id,
                    })) : [],
                  }, ],
                  right: [{
                    type: 'layout',
                    value: {
                      component: 'ResponsiveTable',
                      // ignoreReduxProps: true,
                      hasWindowFunc: true,

                      props: {
                        ref: 'func:window.addRef',
                        'flattenRowData': true,
                        'addNewRows': false,
                        'rowButtons': false,
                        'useInputRows': true,
                        simplePagination: true,
                        limit: 10,
                        hasPagination: true,
                        baseUrl: '/optimization/api/batch/simulations?pagination=mlbatches',
                        calculatePagination: true,
                        'tableSearch': true,
                        'simpleSearchFilter': true,
                        filterSearchProps: {
                          icon: 'fa fa-search',
                          hasIconRight: false,
                          className: 'global-table-search',
                          placeholder: 'SEARCH',
                        },
                        dataMap: [{
                          'key': 'rows',
                          value: 'rows',
                        }, {
                          'key': 'numItems',
                          value: 'numItems',
                        }, {
                          'key': 'numPages',
                          value: 'numPages',
                        },
                        ],
                        ignoreTableHeaders: ['_id', ],
                        headers: mlbatchheaders,

                      },
                      thisprops: {
                        rows: ['rows', ],
                        numItems: ['numItems', ],
                        numPages: ['numPages', ],
                      },
                    },
                  }, ],
                }),
                ],
              },
              ],
            },
            asyncprops: {
              rows: ['simulationdata', 'rows', ],
              numItems: ['simulationdata', 'numItems', ],
              numPages: ['simulationdata', 'numPages', ],
            },
          }, ];
      }
      return resolve(req);
    } catch (err) {
      req.error = err.message;
      return reject(err);
    }
  });
}

async function formatIndividualMLInputs(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req && req.body) {
      let unflattenedReqBody = require('flat').unflatten(req.body);
      req.controllerData.ml_inputs = unflattenedReqBody.inputs || {};
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

function __generateDisabledInputElements(input) {
  return {
    'label': input.name,
    value: input.value || '',
    passProps: {
      'state': 'isDisabled',
    },
  };
}

async function generateIndividualMLResultsDetailPage(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      if (req.controllerData.mlcase) {
        let mlcase = req.controllerData.mlcase;
        let allInputNames = Object.keys(mlcase.inputs);
        let input_data = (allInputNames.length) ? allInputNames.map(key => ({ name: key, value: mlcase.inputs[ key ], })).map(__generateDisabledInputElements) : [];
        let left_input_data = input_data.slice(0, Math.ceil(input_data.length / 2));
        let right_input_data = input_data.slice(Math.ceil(input_data.length / 2));
        let { ai_prediction_subtitle, ai_prediction_value, } = transformhelpers.returnAIDecisionResultData(mlcase);
        let mlcasename = mlcase.decision_name || `Case ${mlcase.case_number}`;
        req.controllerData.data.display_title = mlcasename;
        req.controllerData.data.display_subtitle = `Decision processed using the ${mlcase.model_name} model at ${transformhelpers.formatDate(mlcase.createdat, req.user.time_zone)} by ${req.user.first_name} ${req.user.last_name}`;
        req.controllerData.pageLayout = [
          {
            component: 'Columns',
            children: [
              {
                component: 'Column',
                props: {
                  size: 'isOneQuarter',
                  padding: 0,
                },
                children: [{
                  layoutProps: {
                    style: {
                      padding: 0,
                      paddingRight: '15px',
                    },
                  },
                  component: 'ResponsiveForm',
                  props: {
                    blockPageUI: true,
                    useFormOptions: true,
                    flattenFormData: true,
                    footergroups: false,
                    formgroups: [formGlobalButtonBar({
                      left: [{
                        type: 'layout',
                        layoutProps: {
                          size: 'isNarrow',
                          style: {},
                        },
                        value: {
                          component: 'ResponsiveButton',
                          children: 'DOWNLOAD RESULTS',
                          props: {
                            'onclickBaseUrl': `/optimization/api/download/case/${mlcase._id}`,
                            aProps: {
                              className: '__re-bulma_button __re-bulma_is-success',
                            },
                          },
                        },
                      }, ],
                      right: [],
                    }),
                    {
                      gridProps: {
                        key: randomKey(),
                      },
                      card: {
                        props: cardprops({
                          cardTitle: 'Decision',
                          cardProps: {
                            className: 'primary-card-gradient',
                          },
                        }),
                      },
                      formElements: [
                        {
                          type: 'layout',
                          value: {
                            component: 'Column',
                            children: [{
                              component: 'Title',
                              props: {
                                size: 'is3',
                                style: {
                                  fontWeight: 600,
                                  marginBottom: '30px',
                                },
                              },
                              children: [{
                                component: 'span',
                                children: ai_prediction_value,
                              }, ],
                            }, {
                              component: 'Subtitle',
                              props: {
                                size: 'is6',
                              },
                              children: [{
                                component: 'span',
                                children: ai_prediction_subtitle,
                              },
                              ],
                            }, ],
                          },
                        },
                      ],
                    },
                    ],
                  },
                }, ],
              }, {
                component: 'Column',
                props: {
                  size: 'isThreeQuarter',
                  padding: 0,
                },
                children: [{
                  layoutProps: {
                    style: {
                      padding: 0,
                      paddingRight: '15px',
                    },
                  },
                  component: 'ResponsiveForm',
                  props: {
                    blockPageUI: true,
                    useFormOptions: true,
                    flattenFormData: true,
                    footergroups: false,
                    formgroups: [formGlobalButtonBar({
                      left: [],
                      right: [{
                        guideButton: true,
                        location: references.guideLinks.models.individualProcessing,
                      }, ],
                    }), {
                      gridProps: {
                        key: randomKey(),
                      },
                      card: {
                        twoColumns: true,
                        props: cardprops({
                          cardTitle: 'Input Data',
                        }),
                      },
                      formElements: [formElements({
                        twoColumns: true,
                        doubleCard: false,
                        left: left_input_data,
                        right: right_input_data,
                      }),
                      ],
                    },
                    ],
                  },
                }, ],
              },
            ],
          },
        ];
      } else {
        req.error = 'Could not find the matching case.';
      }
      delete req.controllerData.variableTitleMap;
      return resolve(req);
    } catch (err) {
      return reject();
    }
  });
}

async function generateBatchMLResultsDetailPage(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      req.controllerData.data = req.controllerData.data || {};
      if (req.controllerData.mlsimulation) {
        let mlsimulation = req.controllerData.mlsimulation;
        req.controllerData.data.display_title = (mlsimulation.model_name) ? `${mlsimulation.name} - ${mlsimulation.model_name}` : mlsimulation.name;
        let decisions_processed_headers = [{
          label: 'Decision Name',
          sortid: 'decision_name',
        }, {
          label: 'AI Prediction',
          sortid: 'prediction',
        }, {
          label: ' ',
          headerColumnProps: {
            style: {
              width: '40px',
            },
          },
          columnProps: {
            style: {
              whiteSpace: 'nowrap',
            },
          },
          buttons: [{
            passProps: {
              buttonProps: {
                icon: 'fa fa-pencil',
                className: '__icon_button',
              },
              onClick: 'func:this.props.reduxRouter.push',
              onclickBaseUrl: '/optimization/individual/results/:id',
              onclickLinkParams: [{ 'key': ':id', 'val': 'mlcase', }, ],
            },
          }, ],
        }, ];
        req.controllerData.pageLayout = [{
          component: 'ResponsiveForm',
          asyncprops: {
            rows: ['casedata', 'rows', ],
            numItems: ['casedata', 'numItems', ],
            numPages: ['casedata', 'numPages', ],
          },
          props: {
            blockPageUI: true,
            useFormOptions: true,
            flattenFormData: true,
            footergroups: false,
            formgroups: [formGlobalButtonBar({
              left: [{
                type: 'layout',
                layoutProps: {
                  size: 'isNarrow',
                  style: {},
                },
                value: {
                  component: 'ResponsiveButton',
                  children: 'DOWNLOAD RESULTS',
                  props: {
                    'onclickBaseUrl': `/optimization/api/download/mlbatch/${mlsimulation._id.toString()}`,
                    aProps: {
                      className: '__re-bulma_button __re-bulma_is-success',
                    },
                  },
                },
              }, ],
              right: [{
                guideButton: true,
                location: references.guideLinks.models.batchProcessing,
              }, ],
            }), {
              gridProps: {
                key: randomKey(),
              },
              card: {
                doubleCard: true,
                leftDoubleCardColumn: {
                  style: {
                    display: 'flex',
                  },
                },
                rightDoubleCardColumn: {
                  style: {
                    display: 'flex',
                  },
                },
                leftCardProps: cardprops({
                  cardTitle: 'Overview',
                  cardStyle: {
                    marginBottom: 0,
                  },
                }),
                rightCardProps: cardprops({
                  cardTitle: 'Decisions Processed',
                  cardStyle: {
                    marginBottom: 0,
                  },
                }),
              },
              formElements: [formElements({
                twoColumns: true,
                doubleCard: true,
                left: [{
                  'label': 'Batch Name',
                  value: mlsimulation.name,
                  passProps: {
                    'state': 'isDisabled',
                  },
                }, {
                  'label': 'Model Name',
                  value: mlsimulation.model_name || '',
                  passProps: {
                    'state': 'isDisabled',
                  },
                }, {
                  'label': 'Created',
                  value: `${transformhelpers.formatDateNoTime(mlsimulation.createdat, req.user.time_zone)} by ${mlsimulation.user.first_name} ${mlsimulation.user.last_name}`,
                  passProps: {
                    'state': 'isDisabled',
                  },
                }, ],
                right: [{
                  type: 'layout',
                  value: {
                    component: 'ResponsiveTable',
                    // ignoreReduxProps: true,
                    props: {
                      'flattenRowData': true,
                      'addNewRows': false,
                      'rowButtons': false,
                      'useInputRows': true,
                      simplePagination: true,
                      'tableSearch': true,
                      'simpleSearchFilter': true,
                      filterSearchProps: {
                        icon: 'fa fa-search',
                        hasIconRight: false,
                        className: 'global-table-search',
                        placeholder: 'SEARCH',
                      },
                      limit: 10,
                      hasPagination: true,
                      baseUrl: `/optimization/api/batch/results/${mlsimulation._id}/cases?format=json`,
                      calculatePagination: true,
                      dataMap: [{
                        'key': 'rows',
                        value: 'rows',
                      }, {
                        'key': 'numItems',
                        value: 'numItems',
                      }, {
                        'key': 'numPages',
                        value: 'numPages',
                      },
                      ],
                      ignoreTableHeaders: ['_id', ],
                      headers: decisions_processed_headers,
                    },
                    thisprops: {
                      rows: ['rows', ],
                      numItems: ['numItems', ],
                      numPages: ['numPages', ],
                    },
                  },
                }, ],
              }),
              ],
            },
            ],
          },
        }, ];
      } else {
        req.error = 'Could not find the matching case.';
      }
      return resolve(req);
    } catch (err) {
      return reject();
    }
  });

}

async function stageMLModelTemplateDownload(req) {
  req.controllerData = req.controllerData || {};
  let variables = (req.controllerData.data.variables) ? Object.keys(req.controllerData.data.variables) : [];
  req.controllerData = Object.assign({}, req.controllerData, {
    uniqueVars: variables,
    flattenedOutput: [],
  });
  return req;
}

async function formatMLCaseCSV(req) {
  try {
    if (req.controllerData.mlcase) {
      let asyncJson2Csv = Bluebird.promisify(converter.json2csv, { context: converter, });
      let mlcase = req.controllerData.mlcase;
      let headers = Object.keys(mlcase.inputs);
      let formatted_ai_prediction = transformhelpers.determineAIOutput(mlcase);
      let exportData = Object.assign({}, mlcase.inputs, { ai_prediction: formatted_ai_prediction, });

      let { ai_prediction_subtitle, ai_prediction_value, ai_categorical_value, binary_value, } = transformhelpers.returnAIDecisionResultData(mlcase);
      let explainability_results = req.controllerData.mlcase.explainability_results;
      let explainability_comparisons;
      if (explainability_results) {
        let input_value = (mlcase.model_type === 'categorical') 
          ? ai_categorical_value 
          : (mlcase.model_type === 'binary') 
            ? binary_value
            : ai_prediction_value;
          
        explainability_comparisons = Object.keys(explainability_results).reduce((aggregate, variable, i) => {
          let reassigned_mlcase = Object.assign({}, mlcase, {
            prediction: explainability_results[ variable ],
          });
          let explainability_prediction = (mlcase.model_type === 'categorical') 
            ? transformhelpers.returnAIDecisionResultData(reassigned_mlcase).ai_categorical_value 
            : (mlcase.model_type === 'binary')
              ? transformhelpers.returnAIDecisionResultData(reassigned_mlcase).binary_value
              : transformhelpers.returnAIDecisionResultData(reassigned_mlcase).ai_prediction_value;
          return aggregate.concat({
            variable,
            decision_impact: (mlcase.model_type === 'regression') ? Number((Number(input_value) - Number(explainability_prediction)).toFixed(2)) : Number((Number(input_value) - Number(explainability_prediction)).toFixed(4)),
          });
        }, []).sort((a, b) => b.decision_impact - a.decision_impact);
        explainability_comparisons.filter(config => config.decision_impact > 0).slice(0, 5).forEach((config, i) => {
          exportData[`top_positive_contributor_${i + 1}`] = config.variable;
          headers.push(`top_positive_contributor_${i + 1}`);
        });
        explainability_comparisons.reverse().filter(config => config.decision_impact < 0).slice(0, 5).forEach((config, i) => {
          exportData[`top_negative_contributor_${i + 1}`] = config.variable;
          headers.push(`top_negative_contributor_${i + 1}`);
        });
      }
      headers.unshift('ai_prediction');
      const csv_options = {
        emptyFieldValue: '',
        keys: headers,
        delimiter: {
          wrap: '"', // Double Quote (") character
          // field : ',', // Comma field delimiter
          array: ';', // Semicolon array value delimiter
          // eol   : '\n' // Newline delimiter
        },
        checkSchemaDifferences: false,
      };
      let csv = await asyncJson2Csv(exportData, csv_options);
      req.controllerData.download_content = csv;
    } else {
      req.controllerData.download_content = '';
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatMLBatchSimulationCSV(req) {
  try {
    if (req.controllerData.batchcases) {
      let asyncJson2Csv = Bluebird.promisify(converter.json2csv, { context: converter, });
      let batchcases = req.controllerData.batchcases;
      let inputs = req.controllerData.inputs;
      let headers = Object.keys(inputs);
      headers.unshift('ai_prediction');
      headers.unshift('decision_name');
      const csv_options = {
        emptyFieldValue: '',
        keys: headers,
        delimiter: {
          wrap: '"', // Double Quote (") character
          // field : ',', // Comma field delimiter
          array: ';', // Semicolon array value delimiter
          // eol   : '\n' // Newline delimiter
        },
        checkSchemaDifferences: false,
      };
      let formatted_ai_prediction, ai_prediction_value;
      let exportData = batchcases.map(mlcase => {
        formatted_ai_prediction = transformhelpers.determineAIOutput(mlcase);
        mlcase.inputs[ 'decision_name' ] = mlcase.decision_name;
        return Object.assign({}, mlcase.inputs, { ai_prediction: formatted_ai_prediction, });
      });
      let csv = await asyncJson2Csv(exportData, csv_options);
      req.controllerData.download_content = csv;
    } else {
      req.controllerData.download_content = '';
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatBatchCasesTable(req) {
  try {
    if (req.controllerData.mlsimulation) {
      let formatted_ai_prediction;
      let cases = req.controllerData.mlsimulation.results.reduce((aggregate, batch) => {
        batch.results = batch.results.map(mlcase => {
          formatted_ai_prediction = transformhelpers.determineAIOutput(mlcase);
          mlcase.prediction = (formatted_ai_prediction) ? formatted_ai_prediction : '';
          return mlcase;
        });
        return aggregate.concat(batch.results);
      }, []);
      let regex_test = new RegExp(req.query.query, 'gi');
      if (req.query.query) {
        cases = cases.filter(cs => (regex_test.test(cs.decision_name) || regex_test.test(cs.case_number)));
      }
      req.query.pagenum = req.query.pagenum || 1;
      let startIndex = 10 * (req.query.pagenum - 1);
      let endIndex = 10 * req.query.pagenum;
      let rows = utilities.helpers.mergeSort(cases, 'name').reverse().slice(startIndex, endIndex);
      req.controllerData = Object.assign({}, req.controllerData, {
        rows,
        numPages: Math.ceil(cases.length / 10),
        numItems: cases.length,
      });
    } else {
      req.controllerData = Object.assign({}, req.controllerData, {
        rows: [],
        numPages: 0,
        numItems: 0,
      });
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function stageMLRequest(req) {
  req.controllerData = req.controllerData || {};
  req.controllerData.ml_inputs = Object.assign({}, req.body.inputs);
  for (var input in req.controllerData.ml_inputs) {
    if (typeof req.controllerData.ml_inputs[ input ] !== 'string') {
      req.controllerData.ml_inputs[ input ] = String(req.controllerData.ml_inputs[ input ]);
    }
  }
  return req;
}

/**
 * 
 * Formats ML response object.
 * @param {any} req Express request object
 * @param {any} res Express response object
 * @param {any} next Express next function
 * @returns {object} a response object that contains the status message and data
 */
async function formatMLResponse(req) {
  req.controllerData = req.controllerData || {};
  let response = utilities.controllers.api.formatMLResponse(req);
  if (response instanceof Error) {
    req.error = response;
  } else {
    req.controllerData.results = response;
  }
  return req;
}

async function transformDataSourceProviders(req) {
  try {
    if (req.body.data) {
      let {
        csv_headers,
        csv_data,
        trainingDataRows,
        testingDataRows,
        data_source_name,
        data_source_system_name,
        data_schema,
        strategy_data_schema,
        csv_data_length,
        csv_headers_length,
        columnTypes,
      } = req.body.data;
      let cleanTraining = mlresource.datasource.transformLinearLearner({ rows: trainingDataRows, headers: csv_headers, columnTypes, });
      return req;
    } else {
      return req;
    }
  } catch (e) {
    console.log({ e, });
    req.error = e;
    return req;
  }
}

module.exports = {
  getInputFromDocument,
  formatAddOCRVariableModal,
  formatOCRTemplateUploadRequest,
  formatBatchCasesTable,
  readCSVDataSource,
  formatTableForDownload,
  formatMLCaseCSV,
  formatMLBatchSimulationCSV,
  formatIndividualMLInputs,
  uploadSplitFilesToS3,
  generateMLAssets,
  formatDataSourcePage,
  clearTempDataSourceFiles,
  transformDataSourceProviders,
  generateMLIndividualRunProcessPage,
  generateIndividualMLResultsDetailPage,
  generateBatchMLResultsDetailPage,
  generateMLBatchRunProcessPage,
  stageMLModelTemplateDownload,
  formatAnalysisPage,
  formatModelPage,
  generatePredictorVariableStatistics,
  stageMLRequest,
  formatMLResponse,
};
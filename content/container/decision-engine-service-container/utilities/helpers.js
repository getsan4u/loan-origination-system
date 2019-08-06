'use strict';

/** Helper functions */

const mongoose = require('mongoose');
const PathRegExp = require('path-to-regexp');
const ROUTE_MAP = new Map();
const controllers = require('./controllers');
const transformhelpers = require('./transformhelpers');
const periodic = require('periodicjs');
const logger = periodic.logger;
const mathjs = require('mathjs');
const AWS = require('aws-sdk');
const { Duplex } = require('stream');
const path = require('path');
const Promisie = require('promisie');
const fs = Promisie.promisifyAll(require('fs-extra'));
const taxTable = require('./taxes');

function getParameterized(route) {
  if (ROUTE_MAP.has(route)) return ROUTE_MAP.get(route);
  else {
    let keys = [];
    let result = new PathRegExp(route, keys);
    ROUTE_MAP.set(route, {
      re: result,
      keys,
    });
    return { keys, re: result, };
  }
}

function findMatchingRoute(routes, location) {
  let matching;
  location = (/\?[^\s]+$/.test(location)) ? location.replace(/^([^\s\?]+)\?[^\s]+$/, '$1') : location;
  Object.keys(routes).forEach(key => {
    let result = getParameterized(key);
    if (result.re.test(location) && !matching) matching = key;
  });
  return matching;
}

const merge = (function () {
  let assign = function (parent, child) {
    for (let key in child) {
      if (child[ key ] && typeof child[ key ] === 'object') {
        if (!parent[ key ]) parent[ key ] = child[ key ];
        else parent[ key ] = assign(parent[ key ], child[ key ]);
      } else {
        parent[ key ] = child[ key ];
      }
    }
    return parent;
  };
  let _merge = function () {
    let argv = [ ...arguments, ];
    let [ parent, child, ] = argv.splice(0, 2);
    if (!child) return parent;
    parent = assign(parent, child);
    if (argv.length) return _merge(...[ parent, ...argv, ]);
    return parent;
  };
  return _merge;
})();

const load_products = (function () {
  let products;
  return function (resources = {}) {
    if (!products) {
      let PDS_Products = resources.app.controller.extension.dsa_request.products;
      return PDS_Products.returnLoadProductsAsync({
        user: 'admin',
        isAuthenticated: true,
        headers: {
          host: 'ptu.promisefinancial.net',
        },
        controllerData: {
          model_query: {},
        },
      })
        .then(result => {
          products = result.products.reduce((result, product) => {
            result.by.name = result.by.name || {};
            result.by.id = result.by.id || {};
            result.by.name[ product.identification.name ] = product;
            result.by.id[ product._id ] = product;
            return result;
          }, {
              by: {},
            });
          return products;
        }, e => Promise.reject(e));
    }
    return Promise.resolve(products);
  };
})();

function checkStatus(response) {
  return new Promise((resolve, reject) => {
    if (response.status >= 200 && response.status <= 403) {
      return resolve(response);
    } else {
      let error = new Error(response.statusText);
      error.response = response;
      try {
        // console.debug({response})
        response.json()
          .then(res => {
            if (res.data.error) {
              return reject(res.data.error);
            } else if (res.data) {
              return reject(JSON.stringify(res.data));
            } else {
              return reject(error);
            }
          })
          .catch(() => {
            return reject(error);
          });
      } catch (e) {
        return reject(error);
      }
    }
  });
}

/**
 * Return number from the string.
 * @param {String} str Input string
 * @return {Number} return number from the input string.
 */
function getNumberFromString(str) {
  let copyStr = str;
  let numberFromString = '';
  while (!Number.isNaN(Number(copyStr[ 0 ])) && copyStr.length) {
    numberFromString += copyStr[ 0 ];
    copyStr = copyStr.slice(1);
  }
  return Number(numberFromString);
}


/**
 * Sorter function. Used as default for compareSort.
 * @param {*} x First variable to compare.
 * @param {*} y Second variable to compare.
 * @return {Booelan} Returns whether first variable is greater than second variable;
 */
function sorter(x, y) {
  if (typeof x === 'string' && typeof y === 'string') {
    if (!Number.isNaN(Number(x[ 0 ])) && !Number.isNaN(Number(y[ 0 ])) && getNumberFromString(x) !== getNumberFromString(y)) return getNumberFromString(x) > getNumberFromString(y);
    else if (x[ 0 ] === y[ 0 ] && x.slice(1) && y.slice(1)) return sorter(x.slice(1), y.slice(1));
    else if (x[ 0 ] === y[ 0 ] && x.slice(1) && !y.slice(1)) return true;
    else if (x[ 0 ] === y[ 0 ] && !x.slice(1) && y.slice(1)) return false;
    else return x[ 0 ] > y[ 0 ];
  } else {
    return x > y;
  }
}

/**
 * This function uses compare sort to sort two arrays of objects based on a property provided.
 * @param {Object[]} arrX Array of objects.
 * @param {Object[]} arrY Array of objects.
 * @param {String} prop String to sort by.
 * @param {Function} func Sort function.
 * @return {Object[]} Returns the sorted array.
 */
function compareSort(arrX, arrY, prop, func) {
  let sortedArr = [];
  while (arrX.length && arrY.length) {
    let elemX = prop ? prop.split('.').reduce((acc, curr) => acc[ curr ], arrX[ 0 ]) : arrX[ 0 ];
    let elemY = prop ? prop.split('.').reduce((acc, curr) => acc[ curr ], arrY[ 0 ]) : arrY[ 0 ];
    let bool = func(elemX, elemY);
    if (bool) {
      sortedArr.push(arrX.shift());
    } else {
      sortedArr.push(arrY.shift());
    }
  }
  if (arrX.length === 0) sortedArr = sortedArr.concat(arrY);
  else {
    sortedArr = sortedArr.concat(arrX);
  }
  return sortedArr;
}

/**
 * This function sorts an array of objects by any of the properties.
 * @param {Object[]} arr Array of objects.
 * @param {String} prop Property to sort by.
 * @param {Function} func Sort function.
 * @return {Object[]} Returns the sorted array.
 */
function mergeSort(arr, prop = null, func = sorter) {
  let half = Math.floor(arr.length / 2);
  if (arr.length === 0 || arr.length === 1) return arr;
  else {
    let left = mergeSort(arr.slice(0, half), prop, func);
    let right = mergeSort(arr.slice(half), prop, func);
    return compareSort(left, right, prop, func);
  }
}

/**
 * Deep merges objects given in argument.
 * @param {Object} obj Objects to be deep merged.
 * @return {Object} obj Returns deep merged object.
 */
function deepmerge() {
  return [ ...arguments, ].reduce((acc, arg) => {
    if (typeof arg !== 'object') Object.assign(acc, arg);
    else {
      Object.keys(arg).forEach(key => {
        if (acc[ key ] !== undefined && typeof acc[ key ] === 'object') acc[ key ] = deepmerge(acc[ key ], arg[ key ]);
        else acc[ key ] = arg[ key ];
      });
    }
    return acc;
  }, {});
}

/**
 * Unflattens a given object.
 * @param {Object} obj Object to be unflattened.
 * @return {Object} obj Returns unflattened object.
 */
function unflatten(obj) {
  return Object.keys(obj).reduce((acc, key) => {
    if (key.indexOf('.') !== -1) {
      let keyArr = key.split('.');
      let base = keyArr[ 0 ];
      keyArr.shift();
      let unflattenedKey = keyArr.join('.');
      acc = deepmerge({}, acc, { [ base ]: unflatten({ [ unflattenedKey ]: obj[ key ], }), });
    } else {
      acc[ key ] = obj[ key ];
    }
    return acc;
  }, {});
}

/**
 * Flattens a given object.
 * @param {Object} obj Object to be flattened.
 * @return {Object} obj Returns flattened object.
 */
function flatten(obj) {
  return Object.keys(obj).reduce((acc, curr) => {
    if (typeof obj[ curr ] === 'object' && obj[ curr ] !== null && !Array.isArray(obj[ curr ])) {
      let flattenObj = Object.keys(obj[ curr ]).reduce((a, c) => {
        let key = `${curr}.${c}`;
        a = Object.assign({}, a, {
          [ key ]: obj[ curr ][ c ],
        });
        return a;
      }, {});
      acc = Object.assign({}, acc, flatten(flattenObj));
    } else {
      acc[ curr ] = obj[ curr ];
    }
    return acc;
  }, {});
}

/**
 * Depopulates a populated mongoose document
 * @param  {Object} data The mongoose document that should be depopulated
 * @return {Object}      Returns a fully depopulated mongoose document
 */
function depopulate(data) {
  let depopulated = (Array.isArray(data)) ? [] : {};
  for (let key in data) {
    if (data[ key ] && typeof data[ key ] === 'object') {
      if (data[ key ] instanceof Date) depopulated[ key ] = data[ key ];
      else if (data[ key ]._id && mongoose.Types.ObjectId.isValid(data[ key ]._id.toString())) depopulated[ key ] = data[ key ]._id.toString();
      else depopulated[ key ] = depopulate(data[ key ]);
    } else depopulated[ key ] = data[ key ];
  }
  return depopulated;
}

/**
 * Used to parse strings into numbers. Used for xmlparser in startup.js.
 * @param {string} str String
 * @returns {Number | string} str Returns number or string.
 */
function parseNumbers(str) {
  if (!isNaN(str)) {
    str = str % 1 === 0 ? parseInt(str, 10) : parseFloat(str);
  }
  return str;
}

/**
 * Used to parse strings into booleans. Used for xmlparser in startup.js.
 * @param {string} str String
 * @returns {Boolean | string} str Returns boolean or string.
 */
function parseBooleans(str) {
  if (/^(?:true|false)$/i.test(str)) {
    str = str.toLowerCase() === 'true';
  }
  return str;
}

/**
 * Compares to object and returns diff.
 * @param {Object} obj1 First object to be compared. This will be the older object.
 * @param {Object} obj2 Second object to be compared. This will be the newer object.
 * @return {Object} returns difference between the two objects
 */
function objDiff(obj1, obj2) {
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || Array.isArray(obj1) || Array.isArray(obj2)) {
    throw new Error('Function only compares two different objects');
  }
  let flattenFirst = flatten(obj1);
  let flattenSecond = flatten(obj2);
  Object.keys(flattenFirst).forEach(key => {
    if (flattenSecond[ key ] && flattenSecond[ key ] === flattenFirst[ key ]) {
      delete flattenFirst[ key ];
      delete flattenSecond[ key ];
    }
  });
  Object.keys(flattenSecond).forEach(key => {
    if (flattenFirst[ key ] && flattenFirst[ key ] === flattenSecond[ key ]) {
      delete flattenFirst[ key ];
    }
  });
  return {
    add: unflatten(flattenSecond),
    delete: unflatten(flattenFirst),
  };
}

function transformColumns(options) {
  let { data, transform_indices, } = options;
  let transposed_data = mathjs.transpose(data);
  let transformed_data = transposed_data.map((row, i) => {
    if (transform_indices[ i ]) return row.map(el => {
      if (!isNaN(Number(el))) return transform_indices[ i ](Number(el));
      else return el;
    });
    else return row;
  });
  return mathjs.transpose(transformed_data);
}

/**
 * Upload to AWS Bucket
 * @param {Object} options Contains file path and body
 */
function uploadAWS(options) {
  return new Promise((resolve, reject) => {
    let { Key, Body, } = options;
    let Bucket = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
    let s3 = periodic.aws.s3;
    let params = { Bucket, Key, Body, };
    s3.putObject(params, function (err, data) {
      if (err) {
        logger.error(err);
        return reject(err);
      } else {
        logger.silly(`Successfully uploaded data to ${Key}`);
        return resolve(data);
      }
    });
  });
}

function uploadToAWSFromStream(options) {
  return new Promise((resolve, reject) => {
    let { Key, Body, } = options;
    let Bucket = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
    let s3 = periodic.aws.s3;
    let params = { Bucket, Key, Body, };
    s3.upload(params, function (err, data) {
      if (err) {
        logger.error(err);
        return reject(err);
      } else {
        logger.silly(`Successfully uploaded data to ${Key}`);
        return resolve(data);
      }
    });
  });
}

function getFileSizeFromS3(options) {
  return new Promise((resolve, reject) => {
    let { Key, Body, } = options;
    let Bucket = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
    let s3 = periodic.aws.s3;
    let params = { Bucket, Key, };
    s3.headObject(params, function (err, data) {
      if (err) {
        logger.error(err);
        return reject(err);
      } else {
        logger.silly(`Successfully fetched size to ${Key}`);
        return resolve(data.ContentLength);
      }
    });
  });
}

/**
 * Upload to AWS Bucket
 * @param {Object} options Contains file path and body
 */
function deleteAWS(options) {
  return new Promise((resolve, reject) => {
    let { Key, } = options;
    let Bucket = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
    let aws_configs = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].client;
    AWS.config.update({ region: aws_configs.region, });
    AWS.config.credentials = new AWS.Credentials(aws_configs.accessKeyId, aws_configs.accessKey, null);
    let s3 = new AWS.S3();
    let params = { Bucket, Key, };
    s3.deleteObject(params, function (err, data) {
      if (err) {
        logger.error(err);
        return reject(err);
      } else {
        logger.silly(`Successfully deleted data to ${Key}`);
        return resolve(data);
      }
    });
  });
}

/**
 * Download from AWS Bucket
 * @param {Object} options Contains file path and file name
 * @return {Buffer} Returns buffer object containing file
 */
function downloadAWS(options) {
  return new Promise((resolve, reject) => {
    let { fileurl, } = options;
    let Bucket = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
    let aws_configs = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].client;
    AWS.config.update({ region: aws_configs.region, });
    AWS.config.credentials = new AWS.Credentials(aws_configs.accessKeyId, aws_configs.accessKey, null);
    let s3 = new AWS.S3();
    let params = { Bucket, Key: fileurl, };
    s3.getObject(params, (err, data) => {
      if (err) reject(err);
      (data && data.Body) ? resolve(data.Body) : resolve(data);
    });
  });
}

/**
 * Deletes temporary file folder.
 * @param {string} tempFilepath Temporary file path.
 */
function cleanupTempFile(tempFilepath) {
  let t = setTimeout(() => {
    fs.remove(tempFilepath, (err) => {
      if (err) logger.error(err);
    });
    clearTimeout(t);
  }, 10000);
}

/**
 * Create buffer stream
 * @param {Buffer} source Buffer to be passed in to convert to stream;
 * @return {Stream} Return stream.
 */
function bufferToStream(source) {
  if (source instanceof Buffer) {
    let stream = new Duplex();
    stream.push(source);
    stream.push(null);
    return stream;
  } else {
    return new Error('Input must be a buffer');
  }
}

function checkFileExists(filepath) {
  return new Promise((resolve, reject) => {
    fs.access(filepath, (err, result) => {
      if (err) return resolve(false);
      else return resolve(true);
    })
  });
}

async function checkDocumentTemplateFromLocalDirectory({ template, }) {
  try {
    let filepath = path.join(process.cwd(), 'content/files/document_templates');
    if (Array.isArray(template)) {
      let filesToFetchFromAWS = await Promise.all(template.map(async file => {
        let exists = await checkFileExists(`${filepath}/${file.filename}`);
        return (!exists) ? file : false;
      }));
      filesToFetchFromAWS = filesToFetchFromAWS.filter(file => Boolean(file));
      let createdLocalFiles = await Promise.all(filesToFetchFromAWS.map(async file => {
        let downloadedFile = await downloadAWS(file);
        let created = await fs.outputFileAsync(`${filepath}/${file.filename}`, downloadedFile);
        return (created instanceof Error) ? created : false;
      }));
      return;
    } else {
      let exists = await checkFileExists(`${filepath}/${template.filename}`);
      if (!exists) {
        let downloadedFile = await downloadAWS(template);
        let created = await fs.outputFileAsync(`${filepath}/${template.filename}`, downloadedFile);
      }
      return;
    }
  } catch (err) {
    return err;
  }
}

const lookupTaxes = function (state) {
  return taxTable[ state ];
}

async function createAWSDataSource(req) {
  let datasource = req.controllerData.datasource;
  let aws_configs = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].client;
  let aws_container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
  AWS.config.update({ region: aws_configs.region, });
  AWS.config.credentials = new AWS.Credentials(aws_configs.accessKeyId, aws_configs.accessKey, null);
  AWS.config.setPromisesDependency(require('promisie'));
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
  }

  let aws_training_response = await machinelearning.createDataSourceFromS3(trainingParams).promise();
  let aws_testing_response = await machinelearning.createDataSourceFromS3(testingParams).promise();
  return { aws_training_response, aws_testing_response, data_source_upload_date, };
}

async function createAWSMongoModelConfigs(req) {
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  let variableMap = req.controllerData.variableMap;
  let datasource = req.controllerData.datasource;
  let model_createdat = req.controllerData.aws.data_source_upload_date;
  let ml_input_schema = datasource.included_columns || datasource.strategy_data_schema;
  let strategy_data_schema = JSON.parse(ml_input_schema);
  let data_schema_attributes = (datasource && datasource.data_schema) ? JSON.parse(datasource.data_schema).attributes : [];
  let model_variables = {};
  data_schema_attributes.forEach(el => {
    // let transformation_function = (datasource.transformations && datasource.transformations[el.attributeName]) ? datasource.transformations[el.attributeName].evaluator : '';
    if (el.attributeName === 'historical_result') return;
    if (variableMap[ el.attributeName ]) model_variables[ el.attributeName ] = { variable_id: variableMap[ el.attributeName ], data_type: strategy_data_schema[ el.attributeName ].data_type, };
    else model_variables[ el.attributeName ] = { variable_id: '', data_type: strategy_data_schema[ el.attributeName ].data_type, };
  });
  let awsModelConfigs = {
    // name,
    // datasource: datasource._id.toString(),
    // display_name: req.body.name,
    // description: req.body.description,
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
  return awsModelConfigs;
}

async function stageRedisForMLCrons(redisOptions, redisClient) {
  let { aws_options, } = redisOptions;
  let { mlmodel, organization, trainingBatch, testBatch, } = aws_options;
  redisClient.hmset(`newmachinelearning:${mlmodel._id.toString()}`, {
    data_source_training_status: false,
    data_source_testing_status: false,
    ml_model_status: false,
    datasource: mlmodel.datasource.toString(),
    'training_data_source_id': mlmodel.training_data_source_id,
    'testing_data_source_id': mlmodel.testing_data_source_id,
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
  return;
}

// when do we clear interval??
// 1.) overall model is failed || current provider model status is failed
// 2.) 

async function mlAutoProgress(options) {
  let { provider, model_id, interval, organization, max_progress, progress_value } = options;
  let MlModel = periodic.datas.get('standard_mlmodel');
  let io = periodic.servers.get('socket.io').server;
  let myInterval = setInterval(async () => {
    let currentMlModel = await MlModel.load({ query: { _id: model_id, organization } });
    currentMlModel = currentMlModel.toJSON ? currentMlModel.toJSON() : currentMlModel;
    currentMlModel[ provider ] = currentMlModel[ provider ] || {};
    let current_progress = currentMlModel[ provider ].progress;
    let current_model_status = currentMlModel.status;
    let current_provider_status = currentMlModel[ provider ].status;
    if (current_provider_status === 'failed' || current_model_status === 'failed' || (current_progress && current_progress >= max_progress)) {
      clearInterval(myInterval);
    } else {
      current_progress += progress_value || 2;
      const aws_models = currentMlModel.aws_models || [];
      const digifi_models = currentMlModel.digifi_models || [];
      const all_training_models = [ ...aws_models, ...digifi_models ].length ? [ ...aws_models, ...digifi_models ] : [ 'aws', 'sagemaker_ll', 'sagemaker_xgb' ];
      const progressBarMap = all_training_models.reduce((aggregate, model, i) => {
        aggregate[ model ] = i;
        return aggregate;
      }, {});
      await MlModel.update({ isPatch: true, id: model_id, updatedoc: { [ `${provider}` ]: { progress: current_progress } } });
      io.sockets.emit('provider_ml', { progressBarMap, provider, progress: current_progress, _id: model_id.toString(), organization, });
      if (current_progress === max_progress) clearInterval(myInterval);
    }
  }, interval)

  return myInterval;
}

async function getCollectionCounter(collection_name) {
  try {
    const Counter = periodic.datas.get('standard_counter');
    let currCount = await Counter.model.findOneAndUpdate(
      { collection_name, },
      { $inc: { count: 1 } },
      {
        new: true,
        upsert: true,
        select: {
          count: 1,
        }
      });
    return currCount.count;
  } catch (e) {
    return e;
  }
}

async function updateCollectionCounter(collection_name, count) {
  try {
    const Counter = periodic.datas.get('standard_counter');
    let currCount = await Counter.model.updateOne(
      { collection_name, },
      { $inc: { count, } });
    return currCount;
  } catch (e) {
    return e;
  }
}


const fileSizeUnits = [
  'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'
];

/**
Pretty print a size from bytes
@method pretty
@param {Number} size The number to pretty print
@param {Boolean} [nospace=false] Don't print a space
@param {Boolean} [one=false] Only print one character
@param {Number} [places=1] Number of decimal places to return
@param {Boolen} [numOnly] Return only the converted number and not size string
*/

function formatFileSize(size, nospace, one, places, numOnly) {
  if (typeof nospace === 'object') {
    var opts = nospace;
    nospace = opts.nospace;
    one = opts.one;
    places = (opts.places !== undefined) ? opts.places : 1;
    numOnly = opts.numOnly;
  } else {
    places = places !== undefined? places : 1;
  }

  let mysize;

  for (var id = 0; id < fileSizeUnits.length; ++id) {
    let unit = fileSizeUnits[ id ];

    if (one) {
      unit = unit.slice(0, 1);
    }

    let s = Math.pow(1024, id);
    let fixed;
    if (size >= s) {
      fixed = String((size / s).toFixed(places));
      if (fixed.includes('.0') && fixed.indexOf('.0') === fixed.length - 2) {
        fixed = fixed.slice(0, -2);
      }
      mysize = fixed + (nospace ? '' : ' ') + unit;
    }
  }

  // zero handling
  // always prints in Bytes
  if (!mysize) {
    let _unit = (one ? fileSizeUnits[ 0 ].slice(0, 1) : fileSizeUnits[ 0 ]);
    mysize = '0' + (nospace ? '' : ' ') + _unit;
  }

  if (numOnly) {
    mysize = Number.parseFloat(mysize);
  }

  return mysize;
}

module.exports = {
  getCollectionCounter,
  updateCollectionCounter,
  createAWSDataSource,
  createAWSMongoModelConfigs,
  stageRedisForMLCrons,
  checkDocumentTemplateFromLocalDirectory,
  controllers,
  transformhelpers,
  getParameterized,
  findMatchingRoute,
  merge,
  load_products,
  mergeSort,
  unflatten,
  flatten,
  depopulate,
  parseNumbers,
  parseBooleans,
  objDiff,
  transformColumns,
  uploadAWS,
  downloadAWS,
  deleteAWS,
  cleanupTempFile,
  bufferToStream,
  lookupTaxes,
  mlAutoProgress,
  uploadToAWSFromStream,
  getFileSizeFromS3,
  formatFileSize,
};
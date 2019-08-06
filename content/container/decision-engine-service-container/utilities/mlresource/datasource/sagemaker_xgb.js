'use strict';

const math = require('mathjs');
const periodic = require('periodicjs');
const Promisie = require('promisie');
const rescale = require('ml-array-rescale');
const FETCH_PROVIDER_BATCH_DATA = require('../fetchProviderBatchData');
const registerTrainingProcess = require('../model/sagemaker_xgb');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];

function createCSVString(aggregate, rowArray) {
  let row = rowArray.join(',');
  aggregate += row + '\r\n';
  return aggregate;
}

async function uploadDatasource({ rows, data_source_name, }) {
  try {
    let csv = rows.reduce(createCSVString, '');
    let s3 = periodic.aws.s3;
    let original_filename = data_source_name;
    let Key = `datasources/sagemaker_xgb/${original_filename}`;
    let sagemaker_bucket = periodic.aws.sagemaker_bucket;
    let params = {
      Bucket: sagemaker_bucket,
      Key,
      Body: csv,
    };
    let options = { partSize: 10 * 1024 * 1024, queueSize: 1, };
    let uploaded = await s3.upload(params, options).promise();
    return {
      Key,
      Bucket: sagemaker_bucket,
      filename: original_filename,
      fileurl: uploaded.Location,
    };
  } catch (e) {
    return e;
  }
}

async function handleTrainingData(options) {
  try {
    let {
      trainingName,
      headers,
      columnTypes,
      statistics,
      transformations,
      training_historical_result,
      training_data_hot_encoded,
    } = options;
    if (training_data_hot_encoded.length) {
      let hot_encoded = training_data_hot_encoded;
      headers = headers.filter(header => header !== 'historical_result');
      let cleaned = hot_encoded.map((column, idx) => {
        let header = headers[ idx ];
        let mean = statistics[ header ].mean;
        return column.map(elmt => isNaN(parseFloat(elmt)) ? mean : parseFloat(elmt));
      });
      if (columnTypes[ 'historical_result' ] === 'Boolean' || columnTypes[ 'historical_result' ] === 'Number') {
        cleaned = cleaned.map((column, idx) => {
          let header = headers[ idx ];
          if ((columnTypes[ header ] === 'Number' || columnTypes[ header ] === 'Date') && transformations[ header ] && transformations[ header ].evaluator) {
            let applyTransformFunc = new Function('x', transformations[ header ].evaluator);
            return column.map(applyTransformFunc);
          } else {
            return column;
          }
        });
      }
      let combined = [ training_historical_result, ].concat(cleaned);
      let lastDotIdx = trainingName.lastIndexOf('.');
      let trainingBatchName = trainingName.substring(0, lastDotIdx) + 'batch' + trainingName.substring(lastDotIdx);
      let uploaded_training = await uploadDatasource({ rows: math.transpose(combined), data_source_name: trainingName, });
      let uploaded_trainingbatch = await uploadDatasource({ rows: math.transpose(cleaned), data_source_name: trainingBatchName, });
      return Object.assign({}, options, { headers, training: uploaded_training, trainingbatch: uploaded_trainingbatch, });
    } else {
      return {};
    }
  } catch (e) {
    console.log({e})
    return e;
  }
}

async function handleTestingData(options) {
  try {
    let {
      testingName,
      headers,
      columnTypes,
      statistics,
      transformations,
      testing_data_hot_encoded,
      decoders,
    } = options;
    if (testing_data_hot_encoded.length) {
      let hot_encoded = testing_data_hot_encoded;
      let cleaned = hot_encoded.map((column, idx) => {
        let header = headers[ idx ];
        let mean = statistics[ header ].mean;
        return column.map(elmt => isNaN(parseFloat(elmt)) ? mean : parseFloat(elmt));
      });
      if (columnTypes[ 'historical_result' ] === 'Boolean' || columnTypes[ 'historical_result' ] === 'Number') {
        cleaned = cleaned.map((column, idx) => {
          let header = headers[ idx ];
          if ((columnTypes[ header ] === 'Number' || columnTypes[ header ] === 'Date') && transformations[ header ] && transformations[ header ].evaluator) {
            let applyTransformFunc = new Function('x', transformations[ header ].evaluator);
            return column.map(applyTransformFunc);
          } else {
            return column;
          }
        });
      }
      let combined = cleaned;
      let uploaded = await uploadDatasource({ rows: math.transpose(combined), data_source_name: testingName, });
      return Object.assign({}, options, { decoders, testing: uploaded, });
    } else {
      return {};
    }
  } catch (e) {
    console.log({e});
    return e;
  }
}

function formatDataTypeColumns(options) {
  try {
    let { headers, training_data_transposed, testing_data_transposed, columnTypes,   } = options;
    headers.forEach((header, idx) => {
      if (columnTypes[ header ] === 'Date') {
        training_data_transposed[ idx ] = training_data_transposed[ idx ].map(celldata => new Date(celldata).getTime());
        testing_data_transposed[ idx ] = testing_data_transposed[ idx ].map(celldata => new Date(celldata).getTime());
      }
    });
    return {
      training_data_transposed,
      testing_data_transposed,
    };
  } catch (e) {
    console.log({ e, });
    return e;
  }
}

function oneHotEncodeValues(options) {
  try {
    if (options.e) return options.e;
    if (options && options.training_data_transposed && options.testing_data_transposed) {
      let { headers, training_data_transposed, testing_data_transposed, columnTypes, datasource, } = options;
      let { decoders, encoders, encoder_counts,  } = datasource;
      let training_data_hot_encoded = training_data_transposed.map((column, idx) => {
        let header = headers[ idx ];
        if (columnTypes[ header ] === 'String' || columnTypes[ header ] === 'Boolean') {
          return column.map(data => {
            if (encoders[ header ] && !isNaN(encoders[ header ][ data ])) return encoders[ header ][ data ];
            else return encoder_counts[ header ];
          });
        } else {
          return column;
        }
      });
      let testing_data_hot_encoded = testing_data_transposed.map((column, idx) => {
        let header = headers[ idx ];
        if (columnTypes[ header ] === 'String' || columnTypes[ header ] === 'Boolean') {
          return column.map(data => {
            if (encoders[ header ] && !isNaN(encoders[ header ][ data ])) return encoders[ header ][ data ];
            else return encoder_counts[ header ];
          });
        } else {
          return column;
        }
      });
      return {
        training_data_hot_encoded,
        testing_data_hot_encoded,
      };
    }
  } catch (e) {
    console.log({ e, });
    return e;
  }
}

async function transformXGBoost({ mlmodel, headers, training_data_transposed, testing_data_transposed, columnTypes, }) {
  try{
    const MLModel = periodic.datas.get('standard_mlmodel');
    const Datasource = periodic.datas.get('standard_datasource');
    const redisClient = periodic.app.locals.redisClient;
    const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
    let mongo_mlmodel = await MLModel.load({ query: { _id: mlmodel._id,  }, });
    mongo_mlmodel = mongo_mlmodel.toJSON? mongo_mlmodel.toJSON(): mongo_mlmodel;
    let datasource = mongo_mlmodel.datasource;
    let historical_result_idx = headers.indexOf('historical_result');
    let trainingName = datasource.original_file.training.Key;
    let testingName = datasource.original_file.testing.Key;
    let formatted = formatDataTypeColumns({ headers, training_data_transposed, testing_data_transposed, columnTypes,  });
    training_data_transposed = formatted.training_data_transposed;
    testing_data_transposed = formatted.testing_data_transposed;
    let { training_data_hot_encoded,
      testing_data_hot_encoded, } = oneHotEncodeValues({ headers, training_data_transposed, testing_data_transposed, columnTypes, datasource,  });
    let training_historical_result = training_data_hot_encoded.splice(historical_result_idx, 1)[0];
    let testing_historical_result = testing_data_hot_encoded.splice(historical_result_idx, 1)[0];
    let options = {
      trainingName,
      testingName,
      headers,
      columnTypes,
      statistics: datasource.statistics,
      transformations: datasource.transformations,
      training_historical_result,
      training_data_hot_encoded,
      testing_data_hot_encoded,
    };
    options = await handleTrainingData(options);
    options = await handleTestingData(options);
    options.headers = ['historical_result',].concat(options.headers);
    await Datasource.update({
      id: datasource._id.toString(),
      isPatch: true,
      updatedoc: {
        'providers.sagemaker_xgb.headers': options.headers,
        'providers.sagemaker_xgb.training': options.training,
        'providers.sagemaker_xgb.testing': options.testing,
        'providers.sagemaker_xgb.trainingbatch': options.trainingbatch,
      },
      updatedat: new Date(),
    });
    mongo_mlmodel = await MLModel.load({ query: { _id: mlmodel._id,  }, });
    mongo_mlmodel = mongo_mlmodel.toJSON? mongo_mlmodel.toJSON(): mongo_mlmodel;
    await registerTrainingProcess({ mlmodel_mongo: mongo_mlmodel, mlmodel, });
    return true;
  } catch(e){
    return e;
  }
}

module.exports = transformXGBoost;
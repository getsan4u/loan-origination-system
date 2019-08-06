'use strict';

const math = require('mathjs');
const periodic = require('periodicjs');
const Promisie = require('promisie');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const mongodb = require('mongodb');
const streamBuffers = require('stream-buffers');
const ObjectId = mongodb.ObjectID;

async function uploadDatasource({ training, testing, headers, training_historical_result, testing_historical_result, mlmodel, }) {
  try {
    let historical_result_encoder = mlmodel.datasource.encoders ? mlmodel.datasource.encoders.historical_result : {};
    let historical_result_decoder = mlmodel.datasource.decoders ? mlmodel.datasource.decoders.historical_result : {};
    let newdoc = {
      // filename: data_source_name,
      mlmodel: mlmodel._id.toString(),
      organization: (mlmodel.organization && mlmodel.organization._id) ? mlmodel.organization._id.toString() : null,
      headers,
      historical_result_encoder,
      historical_result_decoder,
      training: {
        rows: training,
        historical_result: training_historical_result,
      },
      testing: {
        rows: testing,
        historical_result: testing_historical_result,
      },
    };
    const MlDataset = periodic.datas.get('standard_mldataset');
    let created = await MlDataset.create({ newdoc, });
    return (created && created._id) ? created._id.toString() : new Error('Failed to create dataset for digifi');
  } catch (e) {
    return e;
  }
}

async function handleTrainingData(options) {
  try {
    let {
      headers,
      columnTypes,
      statistics,
      transformations,
      training_data_hot_encoded,
    } = options;
    if (training_data_hot_encoded.length) {
      let hot_encoded = training_data_hot_encoded;
      let cleaned = hot_encoded.map((column, idx) => {
        let header = headers[ idx ];
        let mean = statistics[ header ].mean;
        return column.map(elmt => isNaN(parseFloat(elmt)) ? mean : elmt);
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
      return { rows: math.transpose(cleaned), };
    } else {
      return {};
    }
  } catch (e) {
    return e;
  }
}

async function handleTestingData(options) {
  try {
    let {
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
        // return column.map(elmt => (isNaN(elmt) || !String(elmt).trim().length) ? mean : elmt);
        return column.map(elmt => isNaN(parseFloat(elmt)) ? mean : elmt);
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
      return { rows: math.transpose(cleaned), };
    } else {
      return {};
    }
  } catch (e) {
    return e;
  }
}


function formatDataTypeColumns(options) {
  try {
    let { headers, training_data_transposed, testing_data_transposed, columnTypes, } = options;
    headers.forEach((header, idx) => {
      if (columnTypes[ header ] === 'Date') {
        training_data_transposed[ idx ] = training_data_transposed[ idx ].map(celldata => new Date(celldata).getTime());
        testing_data_transposed[ idx ] = testing_data_transposed[ idx ].map(celldata => new Date(celldata).getTime());
      } else if (columnTypes[ header ] === 'Number') {
        training_data_transposed[ idx ] = training_data_transposed[ idx ].map(celldata => (celldata === null || (typeof celldata === 'string' && isNaN(parseFloat(celldata)))) ? null : Number(celldata));
        testing_data_transposed[ idx ] = testing_data_transposed[ idx ].map(celldata => (celldata === null || (typeof celldata === 'string' && isNaN(parseFloat(celldata)))) ? null : Number(celldata));
      }
    });
    return {
      training_data_transposed,
      testing_data_transposed,
    };
  } catch (e) {
    return e;
  }
}

function oneHotEncodeValues(options) {
  try {
    if (options.e) return options.e;
    if (options && options.training_data_transposed && options.testing_data_transposed) {
      let { headers, training_data_transposed, testing_data_transposed, columnTypes, datasource, } = options;
      let { decoders, encoders, encoder_counts, } = datasource;
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
    return e;
  }
}

function __createReadableStreamBufferAsync(bucket, bufferData, filename) {
  return new Promise((resolve, reject) => {
    try {
      const myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
        frequency: 1,   // in milliseconds.
        chunkSize: 2048  // in bytes.
      });
      myReadableStreamBuffer.put(bufferData);
      myReadableStreamBuffer.stop();
      myReadableStreamBuffer.
        pipe(bucket.openUploadStream(filename)).
        on('error', function(error) {
          if (error) periodic.logger.warn({error});
        }).
        on('finish', function(file) {
          return resolve(file);
        });
    } catch (err) {
      return reject()
    }
  });
}

function __createCSVString(aggregate, rowArray) {
  let row = rowArray.join(',');
  aggregate += row + '\r\n';
  return aggregate;
}

async function transformDigifi({ mlmodel, headers, training_data_transposed, testing_data_transposed, columnTypes, }) {
  try {
    const MLModel = periodic.datas.get('standard_mlmodel');
    const Datasource = periodic.datas.get('standard_datasource');
    let mongo_mlmodel = await MLModel.load({ query: { _id: mlmodel._id, }, });
    mongo_mlmodel = mongo_mlmodel.toJSON ? mongo_mlmodel.toJSON() : mongo_mlmodel;
    let datasource = mongo_mlmodel.datasource;
    let historical_result_idx = headers.indexOf('historical_result');
    let formatted = formatDataTypeColumns({ headers, training_data_transposed, testing_data_transposed, columnTypes, });
    training_data_transposed = formatted.training_data_transposed;
    testing_data_transposed = formatted.testing_data_transposed;
    let { training_data_hot_encoded,
      testing_data_hot_encoded, } = oneHotEncodeValues({ headers, training_data_transposed, testing_data_transposed, columnTypes, datasource, });
    let training_historical_result = training_data_hot_encoded.splice(historical_result_idx, 1)[ 0 ];
    let testing_historical_result = testing_data_hot_encoded.splice(historical_result_idx, 1)[ 0 ];
    headers = headers.filter(header => header !== 'historical_result');
    const options = {
      headers,
      columnTypes,
      statistics: datasource.statistics,
      transformations: datasource.transformations,
      training_data_hot_encoded,
      testing_data_hot_encoded,
    };
    let training = await handleTrainingData(options);
    let testing = await handleTestingData(options);
    const trainingBuffer = Buffer.from(training.rows.reduce(__createCSVString, ''));
    const testingBuffer = Buffer.from(testing.rows.reduce(__createCSVString, ''));
    const trainingHistoricalResultBuffer = Buffer.from([training_historical_result].reduce(__createCSVString, ''));
    const testingHistoricalResultBuffer = Buffer.from([testing_historical_result].reduce(__createCSVString, ''));
    const training_filename = datasource.original_file.training.filename;
    const testing_filename = datasource.original_file.testing.filename;
    const trainingFile = await __createReadableStreamBufferAsync(periodic.gridfs.bucket, trainingBuffer, training_filename);
    const testingFile = await __createReadableStreamBufferAsync(periodic.gridfs.bucket, testingBuffer, testing_filename);
    const trainingHistoricalResultFile = await __createReadableStreamBufferAsync(periodic.gridfs.bucket, trainingHistoricalResultBuffer, `historical_result_${training_filename}`);
    const testingHistoricalResultFile = await __createReadableStreamBufferAsync(periodic.gridfs.bucket, testingHistoricalResultBuffer, `historical_result_${testing_filename}`);
    let dataset_id = await uploadDatasource({ training: trainingFile._id.toString(), testing: testingFile._id.toString(), headers, training_historical_result: trainingHistoricalResultFile._id.toString(), testing_historical_result: testingHistoricalResultFile._id.toString(), mlmodel: mongo_mlmodel, });
    await Datasource.update({
      id: datasource._id.toString(),
      isPatch: true,
      updatedoc: {
        'providers.digifi.headers': options.headers,
        'providers.digifi.dataset_id': dataset_id,
      },
      updatedat: new Date(),
    });
    await MLModel.update({
      id: mlmodel._id.toString(),
      isPatch: true,
      updatedoc: {
        'digifi_model_status': (mongo_mlmodel.digifi_models && mongo_mlmodel.digifi_models.length) ? 'pending' : 'complete',
      },
      updatedat: new Date(),
    });
    return true;
  } catch (e) {
    return e;
  }
}

module.exports = transformDigifi;
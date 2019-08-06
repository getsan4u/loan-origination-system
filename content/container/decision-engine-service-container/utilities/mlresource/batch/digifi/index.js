'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const logger = periodic.logger;
const BATCH_PREDICTION_FUNCTIONS = {
  regression: require('./regression'),
  binary: require('./binary'),
  categorical: require('./categorical'),
};
const csv = require('fast-csv');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectID;

/**
 * Promisified downloadstream function for mongodb gridfs
 */
function openDownloadStreamAsync(bucket, file_id) {
  return new Promise((resolve, reject) => {
    try {
      const file_data = [];
      bucket.openDownloadStream(ObjectId(file_id))
        .pipe(csv())
        .on('data', function (chunk) {
          file_data.push(chunk);
        })
        .on('error', function (e) {
          return reject(e);
        })
        .on('end', function () {
          return resolve(file_data); 
        });
    } catch (err) {
      return reject(err)
    }
  });
}

async function runDigifiBatchPredictions(mlmodel) {
  try {
    const MlDataset = periodic.datas.get('standard_mldataset');
    const BatchPrediction = periodic.datas.get('standard_batchprediction');
    const model_type = mlmodel.type;
    const providers = THEMESETTINGS.machinelearning.digifi_models[model_type];
    const dataset = await MlDataset.model.findOne({ mlmodel: mlmodel._id.toString(), }).lean();
    let [trainingHistoricalRows, testingHistoricalRows] = await Promise.all([openDownloadStreamAsync(periodic.gridfs.bucket, dataset.training.historical_result), openDownloadStreamAsync(periodic.gridfs.bucket, dataset.testing.historical_result)]);
    trainingHistoricalRows = trainingHistoricalRows.map((row) => row.map(el => Number(el)))[0];
    testingHistoricalRows = testingHistoricalRows.map((row) => row.map(el => Number(el)))[0];
    await Promise.all(providers.map(async provider => {
      if (mlmodel[provider] && mlmodel[provider].batch_training_id && mlmodel[provider].batch_testing_id) {
        const trainingBatch = await BatchPrediction.model.findOne({ _id: mlmodel[provider].batch_training_id, }).lean();
        const testingBatch = await BatchPrediction.model.findOne({  _id: mlmodel[ provider ].batch_testing_id, }).lean();
        return await BATCH_PREDICTION_FUNCTIONS[model_type](mlmodel, dataset, trainingHistoricalRows, testingHistoricalRows, trainingBatch, testingBatch);
      }
    }));
  } catch(e) {
    console.log({ e });
  }
}


module.exports = runDigifiBatchPredictions;
'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
const path = require('path');
const fetch = require('node-fetch');
const mlResource = require('../../mlresource');
const workerUtil = require('./worker');
const { Worker } = require('worker_threads');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
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

/**
 * Cron that updates model status to complete when all associated digifi ml evalutions and batch predictions are set to complete.
 */
async function digifi() {
  try {
    const MLModel = periodic.datas.get('standard_mlmodel');
    const MLDataset = periodic.datas.get('standard_mldataset');
    const BatchPrediction = periodic.datas.get('standard_batchprediction');
    const io = periodic.servers.get('socket.io').server;
    const { bucket, db } = periodic.gridfs;    
    let running = false;
    setInterval(async (options) => {
      if (!running) {
        running = true;
        let mlmodel = await MLModel.model.find({ digifi_model_status: 'pending' }).sort('updatedat').limit(1).lean();
        if (!Array.isArray(mlmodel) || !mlmodel.length) {
          running = false;
          return;
        }
        mlmodel = mlmodel[ 0 ];
        let digifi_models = mlmodel.digifi_models || [];
        if (!digifi_models.length) {
          await MLModel.update({ updatedoc: { digifi_model_status: 'complete' }, isPatch: true, id: mlmodel._id.toString() });
          running = false;
        } else {
          let dataset = await MLDataset.model.findOne({ mlmodel: mlmodel._id.toString() }).lean();
          // download row and historical result data through grid fs
          const [trainingFeatureRows, trainingHistoricalRows, testingFeatureRows, testingHistoricalRows] = await Promise.all([openDownloadStreamAsync(bucket, dataset.training.rows), openDownloadStreamAsync(bucket, dataset.training.historical_result), openDownloadStreamAsync(bucket, dataset.testing.rows), openDownloadStreamAsync(bucket, dataset.testing.historical_result)]);
          dataset.training.rows = trainingFeatureRows.map((row) => row.map(el => Number(el)));
          dataset.training.historical_result = trainingHistoricalRows.map((row) => row.map(el => Number(el)))[0];
          dataset.testing.rows = testingFeatureRows.map((row) => row.map(el => Number(el)));
          dataset.testing.historical_result = testingHistoricalRows.map((row) => row.map(el => Number(el)))[0];
          // dataset shaped
          let model_directory = path.resolve(process.cwd(), `./content/files/digifi_model_scripts/${mlmodel.type}`);
          let finished_training = new Set(digifi_models);
          for (let i = 0; i < digifi_models.length; i++) {
            let model_type = digifi_models[ i ];
            if (mlmodel[ model_type ] && mlmodel[ model_type ].model) {
              finished_training.delete(model_type);
              if (!finished_training.size) {
                await MLModel.update({
                  id: mlmodel._id.toString(),
                  isPatch: true,
                  updatedoc: {
                    digifi_model_status: (mlmodel.industry)? 'input_analysis' : 'batch_analysis',
                    // digifi_model_status: 'batch_analysis',
                  },
                });
                running = false;
              }
              continue;
            }
            let filepath = path.join(model_directory, `/${model_type}.js`);
            let cb = async (err, result) => {
              if (err) { 
                await MLModel.update({
                  id: mlmodel._id.toString(),
                  isPatch: true,
                  updatedoc: {
                    [ `${model_type}.progress` ]: 100,
                    [ `${model_type}.status` ]: 'failed',
                    [ `${model_type}.error_message` ]: String(err.message), updatedat: new Date(),
                  },
                });
                io.sockets.emit('provider_ml', { provider: model_type, progress: 100, _id: mlmodel._id.toString(), organization: mlmodel.organization._id || mlmodel.organization, status: 'Error' });
              } else {
                if (result.isInProgress) {
                  logger.info('Running worker');
                } else {
                  let current_date = new Date();
                  const { exportedModel, trainingBatchPredictions, testingBatchPredictions, model, columnMinMax } = result.val;
                  let trainingBatchOptions = {
                    name: `${mlmodel.name}_training_batch_prediction`,
                    type: 'training',
                    mlmodel: mlmodel._id.toString(),
                    predictions: trainingBatchPredictions,
                    display_name: `${mlmodel.display_name} Training Batch Prediction`,
                    provider: model_type,
                    organization: mlmodel.organization.toString(),
                    status: 'not_initialized',
                    createdat: current_date,
                  };
                  let testingBatchOptions = {
                    name: `${mlmodel.name}_testing_batch_prediction`,
                    type: 'testing',
                    provider: model_type,
                    mlmodel: mlmodel._id.toString(),
                    display_name: `${mlmodel.display_name} Testing Batch Prediction`,
                    predictions: testingBatchPredictions,
                    organization: mlmodel.organization.toString(),
                    status: 'not_initialized',
                    createdat: current_date,
                  };
                  let [createdTrainingBatch, createdTestingBatch] = await Promise.all([ BatchPrediction.create(trainingBatchOptions), BatchPrediction.create(testingBatchOptions), ]);
                  await MLModel.update({
                    id: mlmodel._id.toString(),
                    isPatch: true,
                    updatedoc: {
                      [ `${model_type}.progress` ]: 70,
                      [ `${model_type}.model` ]: exportedModel,
                      [ `${model_type}.column_scale` ]: columnMinMax || {},
                      [ `${model_type}.batch_training_id` ]: createdTrainingBatch._id.toString(),
                      [ `${model_type}.batch_testing_id` ]: createdTestingBatch._id.toString(),
                    },
                  });
                  const aws_models = mlmodel.aws_models || [];
                  const digifi_models = mlmodel.digifi_models || [];
                  const all_training_models = [...aws_models, ...digifi_models].length ? [...aws_models, ...digifi_models] : ['aws', 'sagemaker_ll', 'sagemaker_xgb'];
                  const progressBarMap = all_training_models.reduce((aggregate, model, i) => {
                    aggregate[model] = i;
                    return aggregate;
                  }, {});
                  io.sockets.emit('provider_ml', { progressBarMap, provider: model_type, progress: 70, _id: mlmodel._id.toString(), organization: mlmodel.organization._id || mlmodel.organization, });
                  finished_training.delete(model_type);
                  if (!finished_training.size) {
                    await MLModel.update({
                      id: mlmodel._id.toString(),
                      isPatch: true,
                      updatedoc: {
                        digifi_model_status: (mlmodel.industry)? 'input_analysis' : 'batch_analysis',
                      },
                    });
                    running = false;
                  }
                }
              }
            }
            let options = { filepath, workerData: { dataset, model_id: mlmodel._id.toString(),}, customData: {} };
            workerUtil.initiateWorker(options, cb);
          }
        }
      }
    }, 30000);

    let input_running = false;
    setInterval(async (options) => {
      if (!input_running) {
        let inputMlModels = await MLModel.model.find({ digifi_model_status: 'input_analysis' }).lean();
        if (inputMlModels) {
          input_running = true;
          await Promise.all(inputMlModels.map(async mlmodel => {
            await mlResource.input_analysis(mlmodel);
            await MLModel.update({ isPatch: true, id: mlmodel._id.toString(), updatedoc: { digifi_model_status: 'score_analysis' } });
          }));
        }
        input_running = false;
      }
    }, 30000)

    let score_running = false;
    setInterval(async (options) => {
      if (!score_running) {
        let scoreMlModels = await MLModel.model.find({ digifi_model_status: 'score_analysis' }).lean();
        if (scoreMlModels) {
          score_running = true;
          await Promise.all(scoreMlModels.map(async mlmodel => {
            await mlResource.score_analysis(mlmodel);
            await MLModel.update({ isPatch: true, id: mlmodel._id.toString(), updatedoc: { digifi_model_status: 'batch_analysis' } });
          }));
        }
        score_running = false;
      }
    }, 30000)
    
    // batch prediction creation interval cron
    let batch_running = false;
    setInterval(async (options) => {
      if (!batch_running) {
        let batchMlModels = await MLModel.model.find({ digifi_model_status: 'batch_analysis' }).lean();
        if (batchMlModels) {
          batch_running = true;
          await Promise.all(batchMlModels.map(async mlmodel => {
            await mlResource.batch.digifi(mlmodel);
            await MLModel.update({ isPatch: true, id: mlmodel._id.toString(), updatedoc: { digifi_model_status: 'completed' }});
          }))
        }
        batch_running = false;
      }
    }, 30000)
  } catch (e) {
    console.log({ e });
  }
}

module.exports = digifi;
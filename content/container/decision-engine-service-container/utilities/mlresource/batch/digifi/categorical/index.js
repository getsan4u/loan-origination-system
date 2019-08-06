'use strict';
const periodic = require('periodicjs');
const { formatCategoricalBatchResult } = require('../helper');
const logger = periodic.logger;

async function formatBatchResult(mlmodel, dataset, trainingHistoricalRows, testingHistoricalRows, trainingBatch, testingBatch) {
  const MlModel = periodic.datas.get('standard_mlmodel');
  const io = periodic.servers.get('socket.io').server;
  try {
    const modelCategories = Object.keys(dataset.historical_result_encoder).sort((a, b) => Number(dataset.historical_result_encoder[a]) - Number(dataset.historical_result_encoder[b]));
    await formatCategoricalBatchResult({ mlmodel, batch_prediction_rows: trainingBatch.predictions, historical_result_rows: trainingHistoricalRows, modelCategories, dataset, batch: trainingBatch })
    await formatCategoricalBatchResult({ mlmodel, batch_prediction_rows: testingBatch.predictions, historical_result_rows: testingHistoricalRows, modelCategories, dataset, batch: testingBatch })
    await MlModel.update({ isPatch: true, id: mlmodel._id.toString(), updatedoc: { 
      [`${trainingBatch.provider}.progress`]: 100, 
      [`${trainingBatch.provider}.status`]: 'completed',
    }
    })
    const aws_models = mlmodel.aws_models || [];
    const digifi_models = mlmodel.digifi_models || [];
    const all_training_models = [...aws_models, ...digifi_models].length ? [...aws_models, ...digifi_models] : ['aws', 'sagemaker_ll', 'sagemaker_xgb'];
    const progressBarMap = all_training_models.reduce((aggregate, model, i) => {
      aggregate[model] = i;
      return aggregate;
    },{});
    io.sockets.emit('provider_ml', { progressBarMap, provider: trainingBatch.provider, progress: 100, _id: mlmodel._id.toString(), organization: mlmodel.organization._id || mlmodel.organization, status: 'Complete' });
  } catch(e) {
    await MlModel.update({ isPatch: true, id: mlmodel._id.toString(), updatedoc: { [`${trainingBatch.provider}.progress`]: 100, status: 'failed' } })
    io.sockets.emit('provider_ml', { provider: trainingBatch.provider, progress: 100, _id: mlmodel._id.toString(), organization: mlmodel.organization._id || mlmodel.organization, status: 'Error' });
  }
}

module.exports = formatBatchResult;
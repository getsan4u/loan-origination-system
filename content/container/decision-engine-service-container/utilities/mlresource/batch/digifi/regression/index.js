'use strict';
const periodic = require('periodicjs');
const { formatRegressionBatchResult } = require('../helper');
const logger = periodic.logger;

async function formatBatchResult(mlmodel, dataset, trainingHistoricalRows, testingHistoricalRows, trainingBatch, testingBatch) {
  const MlModel = periodic.datas.get('standard_mlmodel');
  const io = periodic.servers.get('socket.io').server;
  try {
    const sortedTrainingRows = trainingBatch.predictions.map((predictionVal, i) => [ trainingHistoricalRows[ i ], predictionVal ]).sort((a, b) => Number(a[ 0 ]) - Number(b[ 0 ]));
    const sortedTrainingPredictionRows = sortedTrainingRows.slice().sort((a, b) => Number(a[ 1 ]) - Number(b[ 1 ]));
    const sortedTestingRows = testingBatch.predictions.map((predictionVal, i) => [ testingHistoricalRows[ i ], predictionVal ]).sort((a, b) => Number(a[ 0 ]) - Number(b[ 0 ]));
    const sortedTestingPredictionRows = sortedTestingRows.slice().sort((a, b) => Number(a[ 1 ]) - Number(b[ 1 ]));
    await formatRegressionBatchResult({ sortedRows: sortedTrainingRows, sortedPredictionRows: sortedTrainingPredictionRows, batch: trainingBatch });
    await formatRegressionBatchResult({ sortedRows: sortedTestingRows, sortedPredictionRows: sortedTestingPredictionRows, batch: testingBatch });
    await MlModel.update({ isPatch: true, id: mlmodel._id.toString(), updatedoc: { 
      [`${trainingBatch.provider}.progress`]: 100, 
      [`${trainingBatch.provider}.status`]: 'completed',
    } })
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
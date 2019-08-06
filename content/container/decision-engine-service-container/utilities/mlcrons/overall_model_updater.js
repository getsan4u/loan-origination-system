'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;

/**
 * Cron that updates model status to complete when all associated AWS evaluations and batch predictions are set to complete.
 */
function overallModelUpdater() {
  const MLModel = periodic.datas.get('standard_mlmodel');
  const io = periodic.servers.get('socket.io').server;
  MLModel.model.find({ 'status': 'training', })
    .then(models => {
      if (models && models.length) {
        return Promise.all(models.map(model => {
          model = model.toJSON ? model.toJSON() : model;
          const aws_models = model.aws_models || [];
          const digifi_models = model.digifi_models || [];
          const all_training_models = [...aws_models, ...digifi_models].length ? [...aws_models, ...digifi_models] : ['aws', 'sagemaker_ll', 'sagemaker_xgb'];
          let allComplete = all_training_models.every(provider => model[provider] && (model[provider].status === 'complete' || model[provider].status === 'completed'));
          if (allComplete) {
            MLModel.update({ id: model._id.toString(), isPatch: true, updatedoc: { 
              updatedat: new Date(), 
              status: 'complete',
            }, });
            // io.sockets.emit('provider_ml', { model_complete: true });
          } 
          else {
            return null;
          }
        }))
          .then((results) => {
            if (results && results[ 0 ]) logger.warn('Updated models to complete');
          });
      }
    })
    .catch(e => logger.warn('Error in overallModelUpdater', e));
}

module.exports = overallModelUpdater;
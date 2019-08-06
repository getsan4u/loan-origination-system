'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;

/**
 * Cron that updates model status to complete when all associated AWS evaluations and batch predictions are set to complete.
 */
function modelUpdater() { // ONLY AWS MACHINE LEARNING MODEL UPDATER
  const MLModel = periodic.datas.get('standard_mlmodel');
  const io = periodic.servers.get('socket.io').server;
  MLModel.query({ query: { ['aws.status']: 'pending', }, })
    .then(models => {
      if (models && models.length) {
        return Promise.all(models.map(model => {
          model = model.toJSON ? model.toJSON() : model;
          let { aws } = model;
          if (aws && aws.batch_training_status === 'complete' && aws.batch_testing_status === 'complete' && aws.real_time_endpoint_status === 'READY') {
            io.sockets.emit('provider_ml', { provider: 'aws', progress: 100, _id: model._id.toString(), organization: model.organization._id || model.organization, status: 'Complete', label: 'Complete' });
            return MLModel.update({ id: model._id.toString(), isPatch: true, updatedoc: { 
              updatedat: new Date(), 
              aws: {
                progress: 100,
                status: 'complete', 
              },
            }, });
          } else {
            return null;
          }
        }))
          .then((results) => {
            if (results && results[ 0 ]) logger.warn('Updated AWS models to complete');
          });
      }
    })
    .catch(e => logger.warn('Error in modelUpdater', e));
}

module.exports = modelUpdater;
'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;

/**
 * Cron function that checks if any AWS evaluations are complete. Updates associated model evaluation_status when evaluation is complete
 * @param {Object} options.machinelearning AWS Machine Learning instance
 */
function evaluationUpdater(options) {
  const MLModel = periodic.datas.get('standard_mlmodel');
  let { machinelearning, } = options;
  const io = periodic.servers.get('socket.io').server;
  MLModel.query({ query: { 'aws.evaluation_status': 'pending', }, })
    .then(models => {
      if (models && models.length) {
        models.forEach(model => {
          model = model.toJSON ? model.toJSON() : model;
          machinelearning.getEvaluation({ 'EvaluationId': model.aws.evaluation_id.toString(), }, function (err, data) {
            if (err) {
              io.sockets.emit('provider_ml', { provider: 'aws', progress: 100, _id: model._id.toString(), organization: model.organization, model_error: true });
              logger.warn('Error retrieving evaluation: ', err);
            } else if (data && data.Status === 'COMPLETED') {
              if (data.PerformanceMetrics && data.PerformanceMetrics.Properties) {
                io.sockets.emit('provider_ml', { provider: 'aws', progress: 80, _id: model._id.toString(), organization: model.organization, label: 'Preparing Model' });
                MLModel.update({ id: model._id.toString(), isPatch: true, updatedoc: { 
                  updatedat: new Date(),
                  aws: {
                    progress: 90,
                    evaluation_status: 'complete', 
                    performance_metrics: data.PerformanceMetrics.Properties, 
                  },
                }, })
                  .then(() => logger.warn('Updated model evaluation status and performance metrics'))
                  .catch(e => logger.warn(`Error updating model evaluation status and performance metrics: ${model._id.toString()}`));
              }
            }
          });
        });
      }
    })
    .catch(e => logger.warn('Error in evaluationUpdater'));
}

module.exports = evaluationUpdater;
'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
async function updateAWSMLModel(awsmodel){
  try {
    const MLModel = periodic.datas.get('standard_mlmodel');
    let {id, updatedoc, isPatch,} = awsmodel;
    let modelUpdateOptions = {
      id,
      updatedat: new Date(),
      updatedoc: {aws: updatedoc,},
      isPatch,
    };
    let updated_model = await MLModel.update(modelUpdateOptions);
    return;
  } catch(e) {
    logger.warn('Error updating AWS ML MODEL: ', e);
  }
}
/**
 * Cron function that checks if any AWS models are ready so that they can be used to generate AWS evaluators and batch predictions
 * @param {Object} options.machinelearning AWS Machine Learning instance
 * @param {Object} modeldata Mongo model with specifications for creating AWS model
 */
function checkMLModels(machinelearning, modeldata) {
  try {
    let ml_model_array = Object.values(modeldata);
    let MLModel = periodic.datas.get('standard_mlmodel');
    let BatchPrediction = periodic.datas.get('standard_batchprediction');
    let aws_container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
    const io = periodic.servers.get('socket.io').server;
    ml_model_array.forEach((current_model, i) => {
      if (current_model) {
        let { training_data_source_id, testing_data_source_id, batch_training_aws_id, batch_testing_aws_id, model_id, model_name, aws_model_id, batch_training_mongo_id, batch_testing_mongo_id, organization, progress, } = current_model;
        machinelearning.getMLModel({ 'MLModelId': aws_model_id, 'Verbose': false, }, function (err, data) {
          if (err) logger.warn('error in getMLModel');
          else if (data && data.Status === 'COMPLETED') {
            if (current_model.batch_training_id && current_model.batch_testing_id && current_model.real_time_endpoint_status === 'READY') {
              let modelUpdateParams = {
                id: model_id,
                isPatch: true,
                updatedoc: {
                  updatedat: new Date(),
                  batch_training_id: current_model.batch_training_mongo_id,
                  batch_testing_id: current_model.batch_testing_mongo_id,
                  batch_training_status: 'pending',
                  batch_testing_status: 'pending',
                  // evaluation_status: 'pending',
                  // evaluation_id: current_model.evaluation_id,
                  real_time_endpoint: current_model.real_time_endpoint,
                  real_time_endpoint_status: current_model.real_time_endpoint_status,
                  real_time_prediction_id: aws_model_id,
                },
              };

              let trainingBatchParams = {
                id: current_model.batch_training_mongo_id,
                isPatch: true,
                updatedoc: {
                  updatedat: new Date(),
                  status: 'pending',
                },
              };

              let testingBatchParams = {
                id: current_model.batch_testing_mongo_id,
                isPatch: true,
                updatedoc: {
                  updatedat: new Date(),
                  status: 'pending',
                },
              };
              return Promise.all([updateAWSMLModel(modelUpdateParams), BatchPrediction.update(trainingBatchParams), BatchPrediction.update(testingBatchParams), ])
                .then(() => {
                  let progress = 50;
                  io.sockets.emit('provider_ml', { provider: 'aws', progress, _id: model_id.toString(), organization, label: 'Generating Batch Predictions' });
                  updateAWSMLModel({ id: model_id, isPatch: true, updatedoc: { updatedat: new Date(), progress, model_training_status: 'Generating Batch Predictions' }, })
                  periodic.app.locals.redisClient.del(`${periodic.environment}_ml_aws:${model_id}`);
                })
                .catch(e => logger.warn('Error in ml model update', e));
            } else {
              // if (current_model && !current_model.evaluation_id) {
              //   machinelearning.createEvaluation({
              //     'EvaluationDataSourceId': testing_data_source_id,
              //     'EvaluationId': `${aws_model_id}_evaluation`,
              //     'EvaluationName': (model_name) ? `${model_name}_evaluation` : `${aws_model_id}_evaluation`,
              //     'MLModelId': aws_model_id,
              //   }, function (err, result) {
              //     if (err) logger.warn(`error in createEvaluation for model: ${model_id}`);
              //     else {
              //       if (result) {
              //         periodic.app.locals.redisClient.hmset(`${periodic.environment}_ml_aws:${model_id}`, {
              //           evaluation_id: result[ 'EvaluationId' ],
              //         });
              //       }
              //     }
              //   });
              // }
              if (current_model && !current_model.real_time_endpoint && !current_model.real_time_endpoint) {
                machinelearning.createRealtimeEndpoint({ MLModelId: aws_model_id, }, function (err, result) {
                  if (err) logger.warn('error in createRealtimeEndpoint');
                  else {
                    periodic.app.locals.redisClient.hmset(`${periodic.environment}_ml_aws:${model_id}`, {
                      real_time_endpoint_status: (result && result[ 'RealtimeEndpointInfo' ] && result[ 'RealtimeEndpointInfo' ][ 'EndpointStatus' ]) ? result[ 'RealtimeEndpointInfo' ][ 'EndpointStatus' ] : '',
                    });
                    if (result && result[ 'RealtimeEndpointInfo' ] && result[ 'RealtimeEndpointInfo' ][ 'EndpointStatus' ] === 'READY') {
                      let progress = 30;
                      periodic.app.locals.redisClient.hmset(`${periodic.environment}_ml_aws:${model_id}`, {
                        real_time_endpoint: result[ 'RealtimeEndpointInfo' ][ 'EndpointUrl' ],
                        progress,
                      });
                      io.sockets.emit('provider_ml', { provider: 'aws', progress, _id: model_id.toString(), organization, label: 'Generating Real Time Endpoint' });
                      updateAWSMLModel({ id: model_id, isPatch: true, updatedoc: { updatedat: new Date(), progress, model_training_status: 'Generating Real Time Endpoint' }, })
                    }
                  }
                });
              }
              if (current_model && !current_model.batch_training_id) {
                machinelearning.createBatchPrediction(
                  {
                    'BatchPredictionDataSourceId': training_data_source_id,
                    'BatchPredictionId': `${batch_training_aws_id}`,
                    'BatchPredictionName': `${model_name}_training_batch_prediction`,
                    'MLModelId': aws_model_id,
                    'OutputUri': `s3://${aws_container_name}/mldata/batch_predictions/${aws_model_id}_${model_name}_training_batch_prediction`,
                  }, function (err, result) {
                    if (result) {
                      periodic.app.locals.redisClient.hmset(`${periodic.environment}_ml_aws:${model_id}`, {
                        batch_training_id: result[ 'BatchPredictionId' ],
                      });
                    }
                  });
              }
              if (current_model && !current_model.batch_testing_id) {
                machinelearning.createBatchPrediction({
                  'BatchPredictionDataSourceId': testing_data_source_id,
                  'BatchPredictionId': `${batch_testing_aws_id}`,
                  'BatchPredictionName': `${model_name}_testing_batch_prediction`,
                  'MLModelId': aws_model_id,
                  'OutputUri': `s3://${aws_container_name}/mldata/batch_predictions/${aws_model_id}_${model_name}_testing_batch_prediction`,
                }, function (err, result) {
                  if (result) {
                    periodic.app.locals.redisClient.hmset(`${periodic.environment}_ml_aws:${model_id}`, {
                      batch_testing_id: result[ 'BatchPredictionId' ],
                    });
                  }
                });
              }
            }
          } else if (data && data.Status === 'FAILED') {
            let modelUpdateParams = {
              id: model_id,
              isPatch: true,
              updatedoc: {
                updatedat: new Date(),
                status: 'Error',
                fail_message: 'Failed to create model',
              },
            };

            updateAWSMLModel(modelUpdateParams)
              .then(() => {
                periodic.app.locals.redisClient.del(`${periodic.environment}_ml_aws:${model_id}`);
                io.sockets.emit('provider_ml', { provider: 'aws', _id: model_id, organization, status: 'Error', model_error: true });
              })
              .catch(e => {
                logger.warn('Error assigning ml model to failed', e);
                periodic.app.locals.redisClient.del(`${periodic.environment}_ml_aws:${model_id}`);
              });
          } else if (data && data.Status) {
            logger.warn(`Current status of model ${model_id}: ${data.Status}`);
          }
        });
      }
    }); 
  } catch(e) {
    logger.warn('Error in check ml models: ', e);
  }
}

module.exports = checkMLModels;
'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
const helpers = require('../helpers');
const SKIP_STATUSES  = ['INPROGRESS', 'PENDING',];
/**
 * Makes an API call to AWS Machine Learning to generate a machine learning model
 * @param {Object} options.machinelearning AWS Machine Learning instance
 * @param {Object} model Mongo model with specifications for creating AWS model
 */
function __generateAWSMLModel(machinelearning, model) {
  let MLModel = periodic.datas.get('standard_mlmodel');
  let Datasource = periodic.datas.get('standard_datasource');
  const io = periodic.servers.get('socket.io').server;
  return function __generate(err, data) {
    try{
      let { datasource, training_data_source_id, model_type, model_id, aws_model_id, model_name, organization, progress, } = model;
      if (err) logger.warn('error in generateAWSMLModel training data');
      else if( data && !SKIP_STATUSES.includes(data.Status)){
        if (data && data.Status === 'COMPLETED') {
          model.data_source_training_status = true;
          let typeMap = { 'binary': 'BINARY', 'regression': 'REGRESSION', 'categorical': 'MULTICLASS', };
          machinelearning.createMLModel({ MLModelName: model_name, TrainingDataSourceId: training_data_source_id, MLModelType: typeMap[ model_type ], MLModelId: aws_model_id, }, function (err, data) {
            if (err) logger.warn('error in model', err);
            else {
              periodic.app.locals.redisClient.hmset(`${periodic.environment}_ml_aws:${model_id}`, { data_source_training_status: true, });
              io.sockets.emit('provider_ml', { provider: 'aws', progress: 20, _id: model_id.toString(), organization, label: 'Training Model'});
              periodic.app.locals.redisClient.hmset(`${periodic.environment}_ml_aws:${model_id}`, {
                progress: 20,
              })
              MLModel.update({ id: model_id, isPatch: true, updatedoc: { updatedat: new Date(), aws: { status: 'pending', progress: 20, } }, })
                .then(() => {
                  logger.warn('Model creation is pending');
                })
                .catch(e => {
                  logger.warn(`Error updating mongo model: ${model_id}`)
                  periodic.app.locals.redisClient.del(`${periodic.environment}_ml_aws:${model.model_id}`);
                });
            }
          });
        } else if (data && data.Status === 'FAILED') {
          return Promise.all([MLModel.update({ id: model.model_id, isPatch: true, updatedoc: { updatedat: new Date(), status: 'failed', aws: { status: 'failed', progress: 20 }, }, }), Datasource.update({ id: model.datasource, isPatch: true, updatedoc: { updatedat: new Date(), status: 'failed', }, }),])
            .then(() => {
              io.sockets.emit('provider_ml', { provider: 'aws', _id: model_id.toString(), organization, label: 'Training Model', model_error: true });
              logger.warn('Training Data source creation failed');
              periodic.app.locals.redisClient.del(`${periodic.environment}_ml_aws:${model.model_id}`);
            })
            .catch(e => {
              logger.warn('Error updating ml model and training datasource to failure: ', e)
              periodic.app.locals.redisClient.del(`${periodic.environment}_ml_aws:${model.model_id}`);
            });
        } else {
          console.log('should not get in here');
          logger.warn(`Deleting model: ${model.model_id}`);
          periodic.app.locals.redisClient.del(`${periodic.environment}_ml_aws:${model.model_id}`);
          MLModel.update({ id: model.model_id, isPatch: true, updatedoc: { updatedat: new Date(), status: 'failed', }, })
        }
      }
    } catch(e){
      console.log({e});
    }
  };
}

/**
 * Cron function that checks if any AWS data sources are ready to be used for model generation
 * @param {Object} options.machinelearning AWS Machine Learning instance
 * @param {Object} modeldata Mongo model with specifications for creating AWS model
 */
function checkDataSources(machinelearning, modeldata) {
  let MLModel = periodic.datas.get('standard_mlmodel');
  let Datasource = periodic.datas.get('standard_datasource');
  let models = Object.values(modeldata);
  try{

    models.forEach((current_model, i) => {
      let { training_data_source_id, testing_data_source_id, model_id, data_source_training_status, data_source_testing_status, } = current_model;
      if (data_source_training_status === 'true' && data_source_testing_status === 'true') {
        //NOTE: SHOULD TECHNICALLY NEVER GET IN HERE
      } else {
        machinelearning.getDataSource({ DataSourceId: training_data_source_id, Verbose: false, }, __generateAWSMLModel(machinelearning, current_model));
        machinelearning.getDataSource({ DataSourceId: testing_data_source_id, Verbose: false, }, function (err, data) {
          if (err) logger.warn('error in ml getDataSource testingdata');
          else if( data && !SKIP_STATUSES.includes(data.Status)){
            if (data && data.Status === 'COMPLETED') {
              current_model.data_source_testing_status = true;
              periodic.app.locals.redisClient.hmset(`${periodic.environment}_ml_aws:${model_id}`, { data_source_testing_status: true, });
            } else if (data && data.Status === 'FAILED') {
              return MLModel.update({ id: model_id, isPatch: true, updatedoc: { updatedat: new Date(), status: 'failed', aws: { status: 'failed', progress: 20 }, }, })
                .then(() => {
                  logger.warn('Testing Data source creation failed');
                  periodic.app.locals.redisClient.del(`${periodic.environment}_ml_aws:${model_id}`);
                })
                .catch(e => {
                  logger.warn('Error updating ml model and testing datasource to failure: ', e)
                  periodic.app.locals.redisClient.del(`${periodic.environment}_ml_aws:${model_id}`);
                });
            } else {
              logger.warn(`Deleting model: ${model_id}`)
              periodic.app.locals.redisClient.del(`${periodic.environment}_ml_aws:${model_id}`);
              MLModel.update({ id: model_id, isPatch: true, updatedoc: { updatedat: new Date(), status: 'failed', aws: { status: 'failed', progress: 20 }, }, })
            }
          }
        });
      }
    });
  } catch(e){
    console.log({e});
  }
}

module.exports = checkDataSources;
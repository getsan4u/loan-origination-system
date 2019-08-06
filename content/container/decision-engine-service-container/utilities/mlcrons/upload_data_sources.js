'use strict';
const periodic = require('periodicjs');
const Promisie = require('promisie');
const math = require('mathjs');
const logger = periodic.logger;
const FETCH_PROVIDER_BATCH_DATA = require('../mlresource/fetchProviderBatchData');
const uploadAWSDatasource = require('../mlresource/datasource/aws');
const helpers = require('../helpers');

/**
 * Cron function that checks if any AWS data sources are ready to be used for model generation
 * @param {Object} options.machinelearning AWS Machine Learning instance
 * @param {Object} modeldata Mongo model with specifications for creating AWS model
 */
function uploadDatasources(machinelearning, modeldata) {
  try{
    let MLModel = periodic.datas.get('standard_mlmodel');
    let Datasource = periodic.datas.get('standard_datasource');
    let models = Object.values(modeldata);
    const redisClient = periodic.app.locals.redisClient;
    const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
    const io = periodic.servers.get('socket.io').server;
    const hincrbyAsync = Promisie.promisify(redisClient.hincrby).bind(redisClient);
    models.forEach(async (current_model, i) => {
      try{
        if(!current_model.numTry) {
          await hmsetAsync(`${periodic.environment}_ml_aws:${current_model._id.toString()}`, {
            numTry: 1,
          });
          await uploadAWSDatasource(current_model);
        } else if(Number(current_model.numTry) > 5){
          throw new Error('Failed to upload datasource');
        } else{
          await hincrbyAsync(`${periodic.environment}_ml_aws:${current_model._id.toString()}`, 'numTry', 1);
        }
      } catch(e){
        periodic.app.locals.redisClient.del(`${periodic.environment}_ml_aws:${current_model._id.toString()}`);
        io.sockets.emit('provider_ml', { provider: 'aws', _id: current_model._id.toString(), organization: current_model.organization, status: 'Error', model_error: true });
        MLModel.update({
          id: current_model._id.toString(),
          isPatch: true,
          updatedoc: {
            'aws': {
              updatedat: new Date(),
              status: 'Error',
              fail_message: 'Failed to create model',
            }
          },
        });
      }
    });
  } catch(e){
    console.log({e});
    return e;
  }
}

module.exports = uploadDatasources;
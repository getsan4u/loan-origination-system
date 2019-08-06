'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
const Promisie = require('promisie');
const SUCCESS_STATUS = [ 'InService', 'Failed', ];

async function updateEndpoint({ endpoint }) {
  const redisClient = periodic.app.locals.redisClient;
  const sagemaker = periodic.aws.sagemaker;
  try {
    const MLModel = periodic.datas.get('standard_mlmodel');
    const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
    let result = await sagemaker.describeEndpoint({ EndpointName: endpoint.name }).promise();
    let { EndpointStatus, EndpointName, } = result;
    if (SUCCESS_STATUS.includes(EndpointStatus)) {
      if (EndpointStatus === 'InService') {
        let selected_provider = endpoint.to;
        await MLModel.update({
          id: endpoint.model_id,
          isPatch: true,
          updatedoc: {
            updatedat: new Date(),
            'user.updater': endpoint.user,
            updating_provider: false,
            selected_provider,
            [ `${selected_provider}.real_time_endpoint_status` ]: 'READY',
            [ `${selected_provider}.real_time_endpoint` ]: `https://runtime.sagemaker.us-east-1.amazonaws.com/endpoints/${EndpointName}/invocations`,
            [ `${selected_provider}.real_time_prediction_id` ]: EndpointName,
          }
        });
        if (endpoint.from_real_time_prediction_id) {
          await hmsetAsync(`${periodic.environment}_update_endpoint:${endpoint.model_id.toString()}`, {
            status: 'delete_endpoint',
          });
        }
      } else {
        redisClient.del(`${periodic.environment}_update_endpoint:${endpoint.model_id.toString()}`);
      }
    }
  } catch (e) {
    redisClient.del(`${periodic.environment}_update_endpoint:${endpoint.model_id.toString()}`);
  }
}

async function deleteEndpoint({ endpoint }) {
  const redisClient = periodic.app.locals.redisClient;
  const sagemaker = periodic.aws.sagemaker;
  try {
    await Promise.all([
      sagemaker.deleteEndpointConfig({ EndpointConfigName: endpoint.from_real_time_prediction_id }).promise(),
      sagemaker.deleteEndpoint({ EndpointName: endpoint.from_real_time_prediction_id }).promise()
    ]);
    redisClient.del(`${periodic.environment}_update_endpoint:${endpoint.model_id.toString()}`);
  } catch (e) {
    redisClient.del(`${periodic.environment}_update_endpoint:${endpoint.model_id.toString()}`);
  }
}

/**
 * Cron that updates model status to complete when all associated AWS evaluations and batch predictions are set to complete.
 */
function modelSelectionUpdater() { // ONLY AWS MACHINE LEARNING MODEL UPDATER
  const MLModel = periodic.datas.get('standard_mlmodel');
  const redisClient = periodic.app.locals.redisClient;
  let active = setInterval(async () => {
    const redisClient = periodic.app.locals.redisClient;
    const getAllKeys = Promisie.promisify(redisClient.keys).bind(redisClient);
    const getValues = Promisie.promisify(redisClient.hgetall).bind(redisClient);
    const allKeys = await getAllKeys(`${periodic.environment}_update_endpoint:*`);
    const allValues = await Promise.all(allKeys.map(key => getValues(key)));
    allValues.forEach(endpoint => {
      if (endpoint.status === 'create_endpoint') {
        updateEndpoint({ endpoint });
      } else if (endpoint.status === 'delete_endpoint') {
        deleteEndpoint({ endpoint });
      }
    })
  }, 5000);
}

module.exports = modelSelectionUpdater;
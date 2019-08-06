'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
const sagemaker_ll = require('./sagemaker_ll');
const sagemaker_xgb = require('./sagemaker_xgb');
const fetch = require('node-fetch');

/**
 * Cron that updates model status to complete when all associated AWS evaluations and batch predictions are set to complete.
 */
async function sageMaker() {
  try {
    let [
      sagemaker_ll_result,
      sagemaker_xgb_result,
    ] = await Promise.all([
        sagemaker_ll(),
        sagemaker_xgb(),  
    ]);
    // let body = JSON.stringify({
    //   "instances": [
    //     {
    //     "features": [5, 0, 0, 106, 3, 0, 0, 5, 0.35632, 0, 24442, 50000]
    //     },
    //   ]
    // });
    // var sagemakerruntime = periodic.aws.sagemakerruntime;
    // let params = {
    //   Body: body,
    //   EndpointName: 'sagemaker-model-1536950485571',
    //   ContentType: 'application/json',
    // };
    // let result = await sagemakerruntime.invokeEndpoint(params).promise();
    // result = JSON.parse(Buffer.from(result.Body).toString('utf8'));
    
    // periodic.aws.sagemaker.invokeEndpoint('https://runtime.sagemaker.us-east-1.amazonaws.com/endpoints/sagemaker-model-1536950485571/invocations')
    // console.log({ linearlearner_result });
    // "values": [5, 0, 0, 106, 3, 0, 0, 5, 0.35632, 0, 24442, 50000]
  } catch (e) {
    return e;
  }

}

module.exports = sageMaker;

// module.exports = sageMaker;
'use strict';
const periodic = require('periodicjs');
const Promisie = require('promisie');
const Papa = require('papaparse');
const csv = require('fast-csv');
const analyzeBatchPrediction = require('../../mlresource/batch/sagemaker_ll');
const prepareDatasource = require('../../mlresource/datasource/sagemaker_ll');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const logger = periodic.logger;
const SUCCESS_STATUS = [/*'datasource_cleanup',*/ 'ready_for_training', 'trainingjob_started', 'trainingjob_complete', 'created_model', 'training_transformjob_started', 'testing_transformjob_started', 'transformjob_completed', 'check_completion'];
const VALID_ERRORS = ['ThrottlingException', 'ResourceInUse', 'InternalFailure', 'ServiceUnavailable'];
const { runAWSScoreAnalysis } = require('../cronhelpers');
let PIPELINE = [ createTrainingJob, waitForTrainingJob, createModel, startTrainingBatchTransform, startTestingBatchTransform, checkBatchTransformJob, runBatchPredictionAnalysis, completeLLTrainingProcess];
const CLEAR_STATUS = {
  Completed: true,
  Stopped: true,
  Failed: true,
};

async function handleFailureAndError({ mlmodel, e, }) {
  logger.warn(e.message);
  const io = periodic.servers.get('socket.io').server;
  const redisClient = periodic.app.locals.redisClient;
  const MLModel = periodic.datas.get('standard_mlmodel');
  await MLModel.update({
    id: mlmodel._id.toString(),
    isPatch: true,
    updatedoc: { 'sagemaker_ll.progress': 100, 'sagemaker_ll.status': 'failed', 'sagemaker_ll.error_message': String(e.message), updatedat: new Date(), },
  });
  io.sockets.emit('provider_ml', { provider: 'sagemaker_ll', progress: 100, _id: mlmodel._id.toString(), organization: mlmodel.organization._id || mlmodel.organization, status: 'Error', model_error: true, });
  redisClient.del(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`);
  return false;
}

async function cleanUpDatasource({ mlmodel, }){
  const redisClient = periodic.app.locals.redisClient;
  const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
  const hincrbyAsync = Promisie.promisify(redisClient.hincrby).bind(redisClient);
  try{
    if(!mlmodel.numTry) {
      await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, {
        numTry: 1,
      });
      await prepareDatasource(mlmodel);
    } else if(Number(mlmodel.numTry) > 5){
      throw new Error('Failed to upload datasource');
    } else{
      await hincrbyAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, 'numTry', 1);
    }
  } catch(e){
    return await handleFailureAndError({ e, mlmodel, });
  }
}

async function createTrainingJob({ mlmodel, }){
  const redisClient = periodic.app.locals.redisClient;
  const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
  const hincrbyAsync = Promisie.promisify(redisClient.hincrby).bind(redisClient);
  try{
    let sagemaker = periodic.aws.sagemaker;
    await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, {
      status: 'trainingjob_started',
    });
    await sagemaker.createTrainingJob(JSON.parse(mlmodel.trainingParams)).promise();
    await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, {
      numErrors: 0,
      trainingParams: '',
    });
  } catch(e){
    await hincrbyAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, 'numErrors', 1);
    if (e && e.name && (!VALID_ERRORS.includes(e.name) || (mlmodel.numErrors && Number(mlmodel.numErrors) > 5))) {
      return await handleFailureAndError({ e, mlmodel, });
    } else {
      await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, {
        status: 'ready_for_training',
      });
    }
  }
}

async function waitForTrainingJob({ mlmodel, }) {
  const io = periodic.servers.get('socket.io').server;
  const redisClient = periodic.app.locals.redisClient;
  const MLModel = periodic.datas.get('standard_mlmodel');
  try {
    const sagemaker = periodic.aws.sagemaker;
    const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
    const WAITFOR_TRAINING = {
      TrainingJobName: mlmodel.model_name,
    };
    let { TrainingJobStatus, ModelArtifacts, } = await sagemaker.describeTrainingJob(WAITFOR_TRAINING).promise();
    if (TrainingJobStatus && CLEAR_STATUS[ TrainingJobStatus ]) {
      if (TrainingJobStatus === 'Completed') {
        await MLModel.update({
          id: mlmodel._id.toString(),
          isPatch: true,
          updatedoc: {
            'sagemaker_ll.progress': 60,
            'sagemaker_ll.status': 'trainingjob_complete',
            'sagemaker_ll.model_name': mlmodel.model_name,
            updatedat: new Date(),
          },
        });
        io.sockets.emit('provider_ml', { provider: 'sagemaker_ll', progress: 60, _id: mlmodel._id.toString(), organization: mlmodel.organization._id || mlmodel.organization, });
        await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, {
          status: 'trainingjob_complete',
          S3ModelArtifacts: ModelArtifacts.S3ModelArtifacts,
        });
        return true;
      } else {
        throw new Error('training failed');
      }
    }
  } catch (e) {
    if (e && e.name && !VALID_ERRORS.includes(e.name)) {
      return await handleFailureAndError({ e, mlmodel, });
    }
  }
}

async function createModel({ mlmodel, }) {
  const redisClient = periodic.app.locals.redisClient;
  const MLModel = periodic.datas.get('standard_mlmodel');
  const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
  const hincrbyAsync = Promisie.promisify(redisClient.hincrby).bind(redisClient);
  try {
    const sagemaker = periodic.aws.sagemaker;
    const role = THEMESETTINGS.sagemaker.role;
    const code_image = THEMESETTINGS.sagemaker.ll.code_image;
    const CREATEMODEL_PARAMS = {
      ExecutionRoleArn: role,
      ModelName: mlmodel.model_name,
      PrimaryContainer: {
        Image: code_image,
        ModelDataUrl: mlmodel.S3ModelArtifacts,
      },
      Tags: [],
    };
    await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, {
      status: 'created_model',
    });
    await sagemaker.createModel(CREATEMODEL_PARAMS).promise();
    await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, {
      numErrors: 0,
    });
    return true;
  } catch (e) {
    await hincrbyAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, 'numErrors', 1);
    if (e && e.name && (!VALID_ERRORS.includes(e.name) || (mlmodel.numErrors && Number(mlmodel.numErrors) > 5))) {
      return await handleFailureAndError({ e, mlmodel, });
    } else {
      await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, {
        status: 'trainingjob_started',
      });
    }
  }
}

function getTransformJobParams(options) {
  let { datasource, model_name, batch_type, } = options;
  let TRANSFORMJOB_PARAMS = {
    ModelName: model_name,
    TransformInput: {
      DataSource: {
        S3DataSource: {
          'S3DataType': 'S3Prefix',
          'S3Uri': `s3://${periodic.aws.sagemaker_bucket}/datasources/sagemaker_ll/${datasource.providers.sagemaker_ll[ batch_type ].filename}`,
        },
      },
      ContentType: 'text/csv',
      SplitType: 'Line',
    },
    TransformJobName: `${model_name}-${batch_type}batch`,
    TransformOutput: {
      S3OutputPath: `s3://${periodic.aws.sagemaker_bucket}/transformjobs/sagemaker_ll`,
      AssembleWith: 'None',
      Accept: 'application/json',
    },
    TransformResources: {
      InstanceCount: 1,
      InstanceType: 'ml.m4.xlarge',
    },
    MaxConcurrentTransforms: 10,
    Tags: [],
  };
  return TRANSFORMJOB_PARAMS;
}

async function startTrainingBatchTransform({ mlmodel, }) {
  const io = periodic.servers.get('socket.io').server;
  const redisClient = periodic.app.locals.redisClient;
  const MLModel = periodic.datas.get('standard_mlmodel');
  const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
  const hincrbyAsync = Promisie.promisify(redisClient.hincrby).bind(redisClient);
  try {
    const sagemaker = periodic.aws.sagemaker;
    const MLModel = periodic.datas.get('standard_mlmodel');
    const Datasource = periodic.datas.get('standard_datasource');
    let datasource = await Datasource.load({ query: { _id: mlmodel.datasource, }, });
    datasource = datasource.toJSON ? datasource.toJSON() : datasource;
    let BATCHTRAINING_PARAMS = getTransformJobParams({ datasource, model_name: mlmodel.model_name, batch_type: 'trainingbatch', });
    await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, {
      status: 'training_transformjob_started',
      batchtransform_training: BATCHTRAINING_PARAMS.TransformJobName,
    });
    await sagemaker.createTransformJob(BATCHTRAINING_PARAMS).promise();
    await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, {
      numErrors: 0,
    });
    await MLModel.update({
      id: mlmodel._id.toString(),
      isPatch: true,
      updatedoc: {
        'sagemaker_ll.progress': 70,
        'sagemaker_ll.status': 'transformjob_started',
        'sagemaker_ll.batch_training_status': 'InProgress',
        updatedat: new Date(),
      },
    });
    io.sockets.emit('provider_ml', { provider: 'sagemaker_ll', progress: 70, _id: mlmodel._id.toString(), organization: mlmodel.organization._id || mlmodel.organization, });
    return true;
  } catch (e) {
    await hincrbyAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, 'numErrors', 1);
    if (e && e.name && (!VALID_ERRORS.includes(e.name) || (mlmodel.numErrors && Number(mlmodel.numErrors) > 5))) {
      return await handleFailureAndError({ e, mlmodel, });
    } else {
      await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, {
        status: 'created_model',
      });
    }
  }
}

async function startTestingBatchTransform({ mlmodel, }) {
  const io = periodic.servers.get('socket.io').server;
  const redisClient = periodic.app.locals.redisClient;
  const MLModel = periodic.datas.get('standard_mlmodel');
  const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
  const hincrbyAsync = Promisie.promisify(redisClient.hincrby).bind(redisClient);
  try {
    const sagemaker = periodic.aws.sagemaker;
    const MLModel = periodic.datas.get('standard_mlmodel');
    const Datasource = periodic.datas.get('standard_datasource');
    let datasource = await Datasource.load({ query: { _id: mlmodel.datasource, }, });
    datasource = datasource.toJSON ? datasource.toJSON() : datasource;
    let BATCHTESTING_PARAMS = getTransformJobParams({ datasource, model_name: mlmodel.model_name, batch_type: 'testing', });
    await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, {
      status: 'testing_transformjob_started',
      batchtransform_testing: BATCHTESTING_PARAMS.TransformJobName,
    });
    await sagemaker.createTransformJob(BATCHTESTING_PARAMS).promise();
    await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, {
      numErrors: 0,
    });
    await MLModel.update({
      id: mlmodel._id.toString(),
      isPatch: true,
      updatedoc: {
        'sagemaker_ll.progress': 70,
        'sagemaker_ll.status': 'transformjob_started',
        'sagemaker_ll.batch_testing_status': 'InProgress',
        updatedat: new Date(),
      },
    });
    io.sockets.emit('provider_ml', { provider: 'sagemaker_ll', progress: 70, _id: mlmodel._id.toString(), organization: mlmodel.organization._id || mlmodel.organization, });
    return true;
  } catch (e) {
    await hincrbyAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, 'numErrors', 1);
    if (e && e.name && (!VALID_ERRORS.includes(e.name) || (mlmodel.numErrors && Number(mlmodel.numErrors) > 5))) {
      return await handleFailureAndError({ e, mlmodel, });
    } else {
      await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, {
        status: 'training_transformjob_started',
      });
    }
  }
}

async function processBatchPredictionResults({ datasource, batchprediction, batch_type, model_type, mlmodel }) {
  try {
    let aws_batch_type = (batch_type === 'trainingbatch') ? 'training' : 'testing';
    let s3 = periodic.aws.s3;
    let providerdata = datasource.providers.sagemaker_ll;
    let originalDocParams = {
      Bucket: datasource.original_file[ aws_batch_type ].Bucket,
      Key: datasource.original_file[ aws_batch_type ].Key,
    };
    let s3params = { Bucket: batchprediction.Bucket, Key: batchprediction.Key, };
    let encoders = datasource.encoders || {
      'false': 0,
      'true': 1,
    };
    let decoders = datasource.decoders || {
      0: false,
      1: true,
    };
    let originalDoc = await s3.getObject(originalDocParams).promise();
    originalDoc = originalDoc.Body.toString('utf8');
    Papa.parse(originalDoc, {
      skipEmptyLines: 'greedy',
      error: async function (err) {
        logger.warn('error while parsing originalfile in sagemaker_ll batch prediction process');
        return await handleFailureAndError({ err, mlmodel, });
      },
      complete: async function(results){
        const csvrows = results.data;
        const headers = csvrows.shift();
        const historicalResultIdx = headers.indexOf('historical_result');
        let sageMakerPredictions = await s3.getObject(s3params).promise();
        sageMakerPredictions = sageMakerPredictions.Body.toString('utf8');
        sageMakerPredictions = sageMakerPredictions.replace(/\]}{"predictions": \[/g, ',');
        let predictions = JSON.parse(sageMakerPredictions).predictions;
        let modelupdate;
        if (model_type === 'binary') {
          let batch_prediction_rows = csvrows.map((row, idx) => {
            return [encoders.historical_result[ row[historicalResultIdx] ], predictions[ idx ].predicted_label, predictions[ idx ].score,];
          });
          const original_batch_prediction_rows = batch_prediction_rows.slice();
          batch_prediction_rows.unshift(['trueLabel', 'bestAnswer', 'score',]);
          if (mlmodel.industry) {
            await runAWSScoreAnalysis({ mlmodel: mlmodel, batch_type: aws_batch_type, batchPredictionData: original_batch_prediction_rows, columnIdx: 2, provider: 'sagemaker_ll', originalDoc: csvrows, modelHeaders: headers })
          }
          modelupdate = await analyzeBatchPrediction({ batchprediction, batch_prediction_rows, });
        } else if (model_type === 'categorical') {
          let classes = Object.entries(datasource.decoders.historical_result).sort((a, b) => Number(a[ 0 ]) > Number(b[ 0 ]) ? 1 : -1).map(elmt => elmt[ 1 ]);
          let batch_prediction_rows = csvrows.map((row, idx) => {
            return [row[historicalResultIdx], ...predictions[ idx ].score,];
          });
          batch_prediction_rows.unshift(['trueLabel', ...classes,]);
          modelupdate = await analyzeBatchPrediction({ batchprediction, batch_prediction_rows, });
        } else if (model_type === 'regression') {
          let batch_prediction_rows = csvrows.map((row, idx) => {
            return [row[historicalResultIdx], predictions[ idx ].score,];
          });
          batch_prediction_rows.unshift(['trueLabel', 'score',]);
          modelupdate = await analyzeBatchPrediction({ batchprediction, batch_prediction_rows, });
        }
        return modelupdate;
      }
    });
  } catch (e) {
    return e;
  }
}

async function checkBatchTransformJob({ mlmodel, }) {
  const io = periodic.servers.get('socket.io').server;
  const redisClient = periodic.app.locals.redisClient;
  const MLModel = periodic.datas.get('standard_mlmodel');
  try {
    const sagemaker = periodic.aws.sagemaker;
    const redisClient = periodic.app.locals.redisClient;
    const MLModel = periodic.datas.get('standard_mlmodel');
    const Datasource = periodic.datas.get('standard_datasource');
    const BatchPrediction = periodic.datas.get('standard_batchprediction');
    let sagemaker_bucket = periodic.aws.sagemaker_bucket;
    let datasource = await Datasource.load({ query: { _id: mlmodel.datasource, }, });
    datasource = datasource.toJSON ? datasource.toJSON() : datasource;
    const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
    let batchtraing_result = await sagemaker.describeTransformJob({ TransformJobName: mlmodel.batchtransform_training, }).promise();
    let batchtesting_result = await sagemaker.describeTransformJob({ TransformJobName: mlmodel.batchtransform_testing, }).promise();
    if (batchtraing_result.TransformJobStatus && CLEAR_STATUS[ batchtraing_result.TransformJobStatus ] && batchtesting_result.TransformJobStatus && CLEAR_STATUS[ batchtesting_result.TransformJobStatus ]) {
      let batchTrainingMongoDocId, batchTestingMongoDocId;
      if (batchtraing_result.TransformJobStatus === 'Completed') {
        let created = await BatchPrediction.create({
          newdoc: {
            name: mlmodel.batchtransform_training,
            mlmodel: mlmodel._id.toString(),
            type: 'trainingbatch',
            batch_output_uri: batchtraing_result.TransformOutput.S3OutputPath,
            Bucket: `${sagemaker_bucket}/transformjobs/sagemaker_ll`,
            Key: datasource.providers.sagemaker_ll[ 'trainingbatch' ].filename + '.out',
          },
        });
        batchTrainingMongoDocId = created.toJSON()._id.toString();
      }
      if (batchtesting_result.TransformJobStatus === 'Completed') {
        let created = await BatchPrediction.create({
          newdoc: {
            name: mlmodel.batchtransform_testing,
            mlmodel: mlmodel._id.toString(),
            type: 'testing',
            batch_output_uri: batchtesting_result.TransformOutput.S3OutputPath,
            Bucket: `${sagemaker_bucket}/transformjobs/sagemaker_ll`,
            Key: datasource.providers.sagemaker_ll[ 'testing' ].filename + '.out',
          },
        });
        batchTestingMongoDocId = created.toJSON()._id.toString();
      }
      await MLModel.update({
        id: mlmodel._id.toString(),
        isPatch: true,
        updatedoc: {
          'sagemaker_ll.progress': 90,
          'sagemaker_ll.status': 'transformjob_completed',
          'sagemaker_ll.batch_training_status': batchtraing_result.TransformJobStatus,
          'sagemaker_ll.batch_testing_status': batchtesting_result.TransformJobStatus,
          'sagemaker_ll.batch_training_id': batchTrainingMongoDocId || null,
          'sagemaker_ll.batch_testing_id': batchTestingMongoDocId || null,
          updatedat: new Date(),
        },
      });
      io.sockets.emit('provider_ml', { provider: 'sagemaker_ll', progress: 90, _id: mlmodel._id.toString(), organization: mlmodel.organization._id || mlmodel.organization, });
      await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, {
        status: 'transformjob_completed',
        batchTrainingMongoDocId,
        batchTestingMongoDocId,
      });
    }
    return true;
  } catch (e) {
    if (e && e.name && !VALID_ERRORS.includes(e.name)) {
      return await handleFailureAndError({ e, mlmodel, });
    }
  }
}

async function runBatchPredictionAnalysis({ mlmodel, }) {
  const redisClient = periodic.app.locals.redisClient;
  const MLModel = periodic.datas.get('standard_mlmodel');
  const io = periodic.servers.get('socket.io').server;
  const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
  try {
    const Datasource = periodic.datas.get('standard_datasource');
    const BatchPrediction = periodic.datas.get('standard_batchprediction');
    let datasource = await Datasource.load({ query: { _id: mlmodel.datasource, }, });
    const modeldata = await MLModel.model.findOne({ _id: mlmodel._id.toString() }).lean();
    let modelupdate = {};
    let batchTrainingMongoDoc = await BatchPrediction.load({ query: { _id: mlmodel.batchTrainingMongoDocId, }, });
    let batchTestingMongoDoc = await BatchPrediction.load({ query: { _id: mlmodel.batchTestingMongoDocId, }, });
    if (batchTrainingMongoDoc) {
      batchTrainingMongoDoc = batchTrainingMongoDoc.toJSON();
      let processed = await processBatchPredictionResults({ datasource, batchprediction: batchTrainingMongoDoc, batch_type: 'trainingbatch', model_type: mlmodel.type, mlmodel: modeldata });
      modelupdate = Object.assign({}, modelupdate, { training: processed, });
    }
    if (batchTestingMongoDoc) {
      batchTestingMongoDoc = batchTestingMongoDoc.toJSON();
      let processed = await processBatchPredictionResults({ datasource, batchprediction: batchTestingMongoDoc, batch_type: 'testing', model_type: mlmodel.type, mlmodel: modeldata });
      modelupdate = Object.assign({}, modelupdate, { testing: processed, });
    }
    await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, {
      status: 'check_completion',
    });
    return true;
  } catch (e) {
    return await handleFailureAndError({ e, mlmodel, });
  }
}

async function completeLLTrainingProcess({ mlmodel, }) {
  try {
    const io = periodic.servers.get('socket.io').server;
    const redisClient = periodic.app.locals.redisClient;
    const MLModel = periodic.datas.get('standard_mlmodel');
    const BatchPrediction = periodic.datas.get('standard_batchprediction');
    const batchTrainingMongoDoc = await BatchPrediction.model.findOne({ _id: mlmodel.batchTrainingMongoDocId, }).lean();
    const batchTestingMongoDoc = await BatchPrediction.model.findOne({ _id: mlmodel.batchTestingMongoDocId, }).lean();
    if (batchTrainingMongoDoc && batchTrainingMongoDoc.status === 'complete' && batchTestingMongoDoc && batchTestingMongoDoc.status === 'complete') {
      redisClient.del(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`);
      await MLModel.update({
        id: mlmodel._id.toString(),
        isPatch: true,
        updatedoc: {
          'sagemaker_ll.progress': 100,
          'sagemaker_ll.status': 'completed',
          updatedat: new Date(),
        },
      });
      io.sockets.emit('provider_ml', { provider: 'sagemaker_ll', progress: 100, _id: mlmodel._id.toString(), organization: mlmodel.organization._id || mlmodel.organization, status: 'Complete', });
    }
    return true;
  } catch(e) {
    return await handleFailureAndError({ e, mlmodel, });
  }
}

async function linearlearner(options) {
  try {
    const redisClient = periodic.app.locals.redisClient;
    const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
    // await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${'5c744db6eb392d2ed5ce3fd2'}`, {
    //   type: 'binary',
    //   datasource: '5c744dc3eb392d2ed5ce3fd3',
    //   _id: '5c744db6eb392d2ed5ce3fd2',
    //   batchtransform_training: '5c744db6eb392d2ed5ce3fd2-ll-1551125994267-trainingbatchbatch',
    //   batchtransform_testing: '5c744db6eb392d2ed5ce3fd2-ll-1551125994267-testingbatch',
    //   batchTestingMongoDocId: '5c74513beb392d2ed5ce403a',
    //   status: 'transformjob_completed',
    //   batchTrainingMongoDocId: '5c74513beb392d2ed5ce4039',
    //   S3ModelArtifacts: 's3://dessagemaker/trainingjobs/5c744db6eb392d2ed5ce3fd2-ll-1551125994267/output/model.tar.gz',
    //   "model_name": "5c744db6eb392d2ed5ce3fd2-ll-1551125994267",
    //   organization: '5bc77d65b6f44d05d7eb8ed7',
    // });
    let active = setInterval(async () => {
      const redisClient = periodic.app.locals.redisClient;
      const getAllKeys = Promisie.promisify(redisClient.keys).bind(redisClient);
      const getValues = Promisie.promisify(redisClient.hgetall).bind(redisClient);
      const allKeys = await getAllKeys(`${periodic.environment}_ml_sagemaker_ll:*`);
      const allValues = await Promise.all(allKeys.map(key => getValues(key)));
      allValues.forEach((mlmodel, i) => {
        let currIdx = SUCCESS_STATUS.indexOf(mlmodel.status);
        if (currIdx > -1) {
          let mlpipe = PIPELINE[ currIdx ];
          mlpipe({ mlmodel, });
        }
      });
    }, 30000);
  } catch (e) {
    return e;
  }

}

module.exports = linearlearner;
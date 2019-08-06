'use strict';
const periodic = require('periodicjs');
const csv = require('fast-csv');
const Promisie = require('promisie');
const analyzeBatchPrediction = require('../batch/sagemaker_ll');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const helpers = require('../../helpers');
const logger = periodic.logger;

async function linearlearner(options) {
  try {
    const redisClient = periodic.app.locals.redisClient;
    const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
    let { mlmodel_mongo, mlmodel, } = options;
    let { datasource } = mlmodel_mongo;
    let included_columns = typeof datasource.included_columns === 'string'? JSON.parse(datasource.included_columns) : {};
    let feature_dim = Object.keys(included_columns).length;
    feature_dim = String(feature_dim - 1);
    const HYPER_PARAMETERS = {
      regression: () => {
        return {
          'predictor_type': 'regressor',
          'feature_dim': feature_dim,
          'mini_batch_size': '10',
        }
      },
      binary: () => {
        return {
          'predictor_type': 'binary_classifier',
          'feature_dim': feature_dim,
          'mini_batch_size': '10',
        }
      },
      categorical: () => {
        return {
          'predictor_type': 'multiclass_classifier',
          'num_classes': String(datasource.encoder_counts.historical_result),
          'feature_dim': feature_dim,
          'mini_batch_size': '10',
        };
      }
    };
    const role = THEMESETTINGS.sagemaker.role;
    const code_image =  THEMESETTINGS.sagemaker.ll.code_image;
    let model_name = `${mlmodel._id.toString()}-ll-${new Date().getTime()}`;
    model_name = model_name.replace(/_/g, '-');
    //REAL ONE
    let TRAINING_PARAMS = {
      'RoleArn': role,
      'TrainingJobName': model_name,
      'AlgorithmSpecification': {
        'TrainingImage': code_image,
        'TrainingInputMode': 'File',
      },
      'ResourceConfig': {
        'InstanceCount': 1,
        'InstanceType': THEMESETTINGS.sagemaker.ll.training_instance_type,
        'VolumeSizeInGB': 10,
      },
      'InputDataConfig': [
        {
          'ChannelName': 'train',
          'DataSource': {
            'S3DataSource': {
              'S3DataType': 'S3Prefix',
              'S3Uri': `s3://${periodic.aws.sagemaker_bucket}/datasources/sagemaker_ll/${datasource.providers.sagemaker_ll.training.filename}`,
              'S3DataDistributionType': 'FullyReplicated',
            },
          },
          'ContentType': 'text/csv',
          'CompressionType': 'None',
        },
      ],
      'OutputDataConfig': {
        'S3OutputPath': `s3://${periodic.aws.sagemaker_bucket}/trainingjobs`,
      },
      HyperParameters: HYPER_PARAMETERS[ mlmodel.type ](),
      'StoppingCondition': {
        'MaxRuntimeInSeconds': 60 * 60,
      },
    };
    await hmsetAsync(`${periodic.environment}_ml_sagemaker_ll:${mlmodel._id.toString()}`, Object.assign({}, mlmodel, {
      model_name,
      _id: mlmodel._id,
      status: 'ready_for_training',
      industry: mlmodel_mongo.industry? mlmodel_mongo.industry : '',
      numErrors: 0,
      numTry: 0,
      trainingParams: JSON.stringify(TRAINING_PARAMS),
    }));
    return true;
  } catch (e) {
    return e;
  }
}

module.exports = linearlearner;
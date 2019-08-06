'use strict';
const periodic = require('periodicjs');
const csv = require('fast-csv');
const Promisie = require('promisie');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const analyzeBatchPrediction = require('../batch/sagemaker_xgb');
const helpers = require('../../helpers');
const logger = periodic.logger;

async function xgboost(options) {
  try {
    const redisClient = periodic.app.locals.redisClient;
    const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
    let { mlmodel, mlmodel_mongo, } = options;
    let { datasource, } = mlmodel_mongo;
    const HYPER_PARAMETERS = {
      regression: () => {
        return {
          objective: 'reg:linear',
          'num_round':'100',
        };
      },
      binary: () => {
        return {
          'max_depth':'3',
          'eval_metric':'auc',
          'objective':'binary:logistic',
          'num_round':'100',
        };
      },
      categorical: () => {
        return {
          objective: 'multi:softprob',
          'num_round':'100',
          'num_class': String(datasource.encoder_counts.historical_result),
        };
      },
    };
    const role = THEMESETTINGS.sagemaker.role;
    const code_image =  THEMESETTINGS.sagemaker.xgb.code_image;
    let model_name = `${mlmodel._id.toString()}-xgb-${new Date().getTime()}`;
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
        'InstanceType': THEMESETTINGS.sagemaker.xgb.training_instance_type,
        'VolumeSizeInGB': 10,
      },
      'InputDataConfig': [
        {
          'ChannelName': 'train',
          'DataSource': {
            'S3DataSource': {
              'S3DataType': 'S3Prefix',
              'S3Uri': `s3://${periodic.aws.sagemaker_bucket}/datasources/sagemaker_xgb/${datasource.providers.sagemaker_xgb.training.filename}`,
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
    await hmsetAsync(`${periodic.environment}_ml_sagemaker_xgb:${mlmodel._id.toString()}`, Object.assign({}, mlmodel, {
      model_name,
      _id: mlmodel._id,
      industry: mlmodel_mongo.industry? mlmodel_mongo.industry : '',
      status: 'ready_for_training',
      numErrors: 0,
      numTry: 0,
      trainingParams: JSON.stringify(TRAINING_PARAMS),
    }));
    return true;
  } catch (e) {
    return e;
  }
}

module.exports = xgboost;
'use strict';
const periodic = require('periodicjs');
const AWS = require('aws-sdk');
const logger = periodic.logger;
const helpers = require('../../helpers');

async function createAWSDataSources(options) {
  try {
    let { datasource, data_source_upload_date, } = options;
    let aws_container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
    let machinelearning = periodic.aws.machinelearning;
    let training_data_source_id = `${datasource._id.toString()}_training_${data_source_upload_date.getTime()}`;
    let testing_data_source_id = `${datasource._id.toString()}_testing_${data_source_upload_date.getTime()}`;
    let parsed_included_columns = JSON.parse(datasource.included_columns);
    let parsed_original_schema = JSON.parse(datasource.data_schema);
    parsed_original_schema.attributes = parsed_original_schema.attributes.filter(attribute => parsed_included_columns[attribute.attributeName]);
    let DataSchema = JSON.stringify(parsed_original_schema);
    let trainingParams = {
      DataSourceId: training_data_source_id,
      DataSpec: {
        DataLocationS3: `s3://${aws_container_name}/mldata/${datasource.providers.aws.training.Key}`,
        DataSchema,
      },
      ComputeStatistics: true,
      DataSourceName: `${datasource.name} Training Data - ${training_data_source_id}`,
    };

    let testingParams = {
      DataSourceId: testing_data_source_id,
      DataSpec: {
        DataLocationS3: `s3://${aws_container_name}/mldata/${datasource.providers.aws.testing.Key}`,
        DataSchema,
      },
      ComputeStatistics: false,
      DataSourceName: `${datasource.name} Testing Data - ${testing_data_source_id}`,
    };
    let aws_training_response = await machinelearning.createDataSourceFromS3(trainingParams).promise();
    let aws_testing_response = await machinelearning.createDataSourceFromS3(testingParams).promise();
    return { aws_training_response, aws_testing_response, training_data_source_id, testing_data_source_id, };
  } catch(e) {
    logger.warn('Error in createAWSDataSources: ', e);
  }
}

async function stageRedisForAWSCrons(redisOptions, redisClient) {
  const MLModel = periodic.datas.get('standard_mlmodel');
  try {
    const BatchPrediction = periodic.datas.get('standard_batchprediction');
    let { mlmodel_mongo, mlmodel, organization, } = redisOptions;
    let { aws_training_response, aws_testing_response, training_data_source_id, testing_data_source_id, } = await createAWSDataSources({ datasource: mlmodel_mongo.datasource, data_source_upload_date: mlmodel_mongo.createdat, });
    let aws_container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
    let trainingAWSBatchOptions = {
      name: `${mlmodel_mongo.name}_training_batch_prediction`,
      type: 'training',
      provider: 'aws',
      mlmodel: mlmodel_mongo._id.toString(),
      display_name: `${mlmodel_mongo.display_name} Training Batch Prediction`,
      user: mlmodel.user_id,
      organization,
      status: 'not_initialized',
      createdat: mlmodel_mongo.createdat,
      original_datasource_filename: mlmodel_mongo.datasource.providers.aws.training.filename || null,
    };

    let testingAWSBatchOptions = {
      name: `${mlmodel_mongo.name}_testing_batch_prediction`,
      type: 'testing',
      provider: 'aws',
      mlmodel: mlmodel_mongo._id.toString(),
      display_name: `${mlmodel_mongo.display_name} Testing Batch Prediction`,
      user: mlmodel.user_id,
      organization,
      status: 'not_initialized',
      createdat: mlmodel_mongo.createdat,
      original_datasource_filename: mlmodel_mongo.datasource.providers.aws.testing.filename || null,
    };
    
    let [trainingBatch, testBatch,] = await Promise.all([BatchPrediction.create(trainingAWSBatchOptions), BatchPrediction.create(testingAWSBatchOptions),]);
    // redisClient.hdel(`${periodic.environment}_ml_aws:${mlmodel_mongo._id.toString()}`, 'status');
    redisClient.hmset(`${periodic.environment}_ml_aws:${mlmodel_mongo._id.toString()}`, Object.assign({}, mlmodel, {
      data_source_training_status: false,
      data_source_testing_status: false,
      ml_model_status: false,
      datasource: mlmodel_mongo.datasource._id.toString(),
      'training_data_source_id': training_data_source_id,
      'testing_data_source_id': testing_data_source_id,
      aws_model_id: `${mlmodel_mongo._id.toString()}_${mlmodel_mongo.createdat.getTime()}`,
      user: mlmodel.user_id,
      'model_id': mlmodel_mongo._id.toString(),
      batch_training_id: '',
      batch_training_mongo_id: trainingBatch._id.toString(),
      batch_training_aws_id: `${trainingBatch._id.toString()}_${trainingBatch.createdat.getTime()}`,
      batch_testing_id: '',
      batch_testing_mongo_id: testBatch._id.toString(),
      batch_testing_aws_id: `${testBatch._id.toString()}_${trainingBatch.createdat.getTime()}`,
      evaluation_id: '',
      real_time_endpoint: '',
      real_time_endpoint_status: '',
      model_name: mlmodel_mongo.name,
      model_type: mlmodel_mongo.type,
      progress: 0,
      organization: organization.toString(),
    }));
    return;
  } catch(e) {
    let { mlmodel_mongo, mlmodel, organization, } = redisOptions;
    await MLModel.update({
      id: mlmodel._id.toString(),
      isPatch: true,
      updatedoc: {
        status: 'failed',
      },
      updatedat: new Date(),
    });
    logger.warn('Error in stageRedisForAWSCrons: ', e);
  }
}

module.exports = stageRedisForAWSCrons;
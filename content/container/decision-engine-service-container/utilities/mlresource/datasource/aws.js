'use strict';

const math = require('mathjs');
const periodic = require('periodicjs');
const Promisie = require('promisie');
const rescale = require('ml-array-rescale');
const FETCH_PROVIDER_BATCH_DATA = require('../fetchProviderBatchData');
const registerTrainingProcess = require('../model/aws');

function createCSVString(aggregate, rowArray) {
  let row = rowArray.join(',');
  aggregate += row + '\r\n';
  return aggregate;
}

async function uploadDatasource({ rows, data_source_name, }) {
  try {
    let csv = rows.reduce(createCSVString, '');
    let s3 = periodic.aws.s3;
    let aws_container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
    let original_filename = data_source_name;
    let Key = `${original_filename}`;
    let params = {
      Bucket: `${aws_container_name}/mldata`,
      Key,
      Body: csv,
    };
    let options = { partSize: 10 * 1024 * 1024, queueSize: 1, };
    let uploaded = await s3.upload(params, options).promise();
    return {
      Key,
      Bucket: `${aws_container_name}/mldata`,
      filename: original_filename,
      fileurl: uploaded.Location,
    };
  } catch (e) {
    return e;
  }
}


function formatDataTypeColumns(options) {
  try {
    let { headers, training_data_transposed, testing_data_transposed, columnTypes} = options;
    headers.forEach((header, idx) => {
      if (columnTypes[ header ] === 'Date') {
        training_data_transposed[ idx ] = training_data_transposed[ idx ].map(celldata => new Date(celldata).getTime());
        testing_data_transposed[ idx ] = testing_data_transposed[ idx ].map(celldata => new Date(celldata).getTime());
      }
    });
    return {
      training_data_transposed,
      testing_data_transposed,
    };
  } catch (e) {
    console.log({ e, });
    return e;
  }
}

async function transformAWSMachineLearning({ mlmodel, headers, training_data_transposed, testing_data_transposed, columnTypes, }) {
  try{
    const MLModel = periodic.datas.get('standard_mlmodel');
    const Datasource = periodic.datas.get('standard_datasource');
    const redisClient = periodic.app.locals.redisClient;
    const hmsetAsync = Promisie.promisify(redisClient.hmset).bind(redisClient);
    let mongo_mlmodel = await MLModel.load({ query: { _id: mlmodel._id,  }, });
    mongo_mlmodel = mongo_mlmodel.toJSON? mongo_mlmodel.toJSON(): mongo_mlmodel;
    let datasource = mongo_mlmodel.datasource;
    let historical_result_idx = headers.indexOf('historical_result');
    let trainingName = datasource.original_file.training.Key;
    let testingName = datasource.original_file.testing.Key;
    let formatted = formatDataTypeColumns({ headers, training_data_transposed, testing_data_transposed, columnTypes,  });
    let trainingDataRows = math.transpose(formatted.training_data_transposed);
    let testingDataRows = math.transpose( formatted.testing_data_transposed);
    trainingDataRows.unshift(headers);
    testingDataRows.unshift(headers);
    let training = await uploadDatasource({ rows: trainingDataRows, data_source_name: trainingName, });
    let testing = await uploadDatasource({ rows: testingDataRows, data_source_name: testingName, });
    await Datasource.update({
      id: datasource._id.toString(),
      isPatch: true,
      updatedoc: {
        'providers.aws.headers': headers,
        'providers.aws.training': training,
        'providers.aws.testing': testing,
      },
      updatedat: new Date(),
    });
    mongo_mlmodel = await MLModel.load({ query: { _id: mlmodel._id,  }, });
    mongo_mlmodel = mongo_mlmodel.toJSON? mongo_mlmodel.toJSON(): mongo_mlmodel;
    let redisOption = {
      mlmodel_mongo: mongo_mlmodel, 
      mlmodel,
      organization: mlmodel.organization, 
      user: mongo_mlmodel.user, 
    };
    await registerTrainingProcess(redisOption, redisClient);
    return true;
  } catch(e){
    console.log({e});
    return e;
  }
}

module.exports = transformAWSMachineLearning;
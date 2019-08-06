'use strict';
const periodic = require('periodicjs');
const math = require('mathjs');
const FETCH_PROVIDER_BATCH_DATA = require('../mlresource/fetchProviderBatchData');
const PROVIDER_DATASOURCE_FUNCS = require('../mlresource/datasource');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const helpers = require('../helpers');
const logger = periodic.logger;

function oneHotEncode(column, columnType) {
  let encoder = {};
  let decoder = {};
  // let encoded = [];
  let count;
  if (columnType === 'Boolean') {
    count = 2;
    let trueArr = [1, true, '1', 'yes', 'Yes', 'YES', 'true', 'True', 'TRUE',];
    let falseArr = [0, false, '0', 'no', 'No', 'NO', 'false', 'False', 'FALSE',];
    let firstVal = column[ 0 ];
    let foundIdx = trueArr.concat(falseArr).indexOf(firstVal);
    if (foundIdx > -1) {
      let setIdx = foundIdx % (trueArr.length);
      encoder[ falseArr[ setIdx ] ] = 0;
      encoder[ trueArr[ setIdx ] ] = 1;
      decoder[ 0 ] = falseArr[ setIdx ];
      decoder[ 1 ] = trueArr[ setIdx ];
    }
  } else {
    count = 0;
    column.forEach(elmt => {
      if (encoder[ elmt ] === undefined && elmt.trim().length) {
        let encoding = count;
        count++;
        encoder[ elmt ] = encoding;
        decoder[ encoding ] = elmt;
      }
      // encoded.push(encoder[ elmt ]);
    });
  }
  return { decoder, encoder, decoder_count: count, };
}

function createHotEncodeMap({ csv_headers, training_data_transposed, columnTypes,  }) {
  try {
    let decoders = {};
    let encoders = {};
    let encoder_counts = {};
    csv_headers.forEach((header, idx) => {
      let column = training_data_transposed[ idx ];
      if (columnTypes[ header ] === 'String' || columnTypes[ header ] === 'Boolean') {
        let { decoder_count, decoder, encoder, } = oneHotEncode(column, columnTypes[ header ]);
        decoders[ header ] = decoder;
        encoders[ header ] = encoder;
        encoder_counts[ header ] = decoder_count;
      }
    });
    return { decoders, encoders, encoder_counts,};
  } catch (e) {
    return e;
  }
}

/**
 * Cron that updates model status to complete when all associated AWS evaluations and batch predictions are set to complete.
 */
async function preTrainingProcess({ mlmodel, }) { // ONLY AWS MACHINE LEARNING MODEL UPDATER
  const MLModel = periodic.datas.get('standard_mlmodel');
  const Datasource = periodic.datas.get('standard_datasource');
  try{
    let mongo_mlmodel = await MLModel.load({ query: { _id: mlmodel._id,  }, });
    mongo_mlmodel = mongo_mlmodel.toJSON? mongo_mlmodel.toJSON(): mongo_mlmodel;
    let datasource = mongo_mlmodel.datasource;
    let trainingDataRows = await FETCH_PROVIDER_BATCH_DATA[ 'original' ]({ mlmodel: mongo_mlmodel, batch_type: 'training', });
    let testingDataRows = await FETCH_PROVIDER_BATCH_DATA[ 'original' ]({ mlmodel: mongo_mlmodel, batch_type: 'testing', });
    let strategy_data_schema = JSON.parse(mongo_mlmodel.datasource.strategy_data_schema);
    let included_columns = datasource.included_columns? JSON.parse(datasource.included_columns) : {};
    let headers = trainingDataRows[0];
    trainingDataRows.splice(0, 1);
    testingDataRows.splice(0, 1);
    let historical_result_idx = headers.indexOf('historical_result');
    let columnTypes = {};
    for (let [key, val,] of Object.entries(strategy_data_schema)) {
      columnTypes[ key ] = val.data_type;
    }
    let training_data_transposed = math.transpose(trainingDataRows);
    let testing_data_transposed = math.transpose(testingDataRows);
    let included_headers = headers.filter(header => included_columns[header]? true : false);
    training_data_transposed = training_data_transposed.filter((column, idx) => {
      let header = headers[idx];
      let truthy = (included_columns[header])? true : false;
      return truthy;
    });
    testing_data_transposed = testing_data_transposed.filter((column, idx) => {
      let header = headers[idx];
      return (included_columns[header])? true : false;
    });
    let { decoders, encoders, encoder_counts,} = createHotEncodeMap({ csv_headers: included_headers, training_data_transposed, columnTypes,});
    let auto_progress_configs = {
      'aws': { 
        interval: 20000,
        max_progress: 20,
      },
      'sagemaker_ll': { 
        interval: 7000,
        max_progress: 60,
      },
      'sagemaker_xgb': { 
        interval: 8000,
        max_progress: 60,
      },
      'decision_tree': { 
        interval: 3000,
        max_progress: 60,
        progress_value: 1,
      },
      'random_forest': { 
        interval: 4000,
        max_progress: 60,
        progress_value: 1,
      },
      'neural_network': { 
        interval: 5000,
        max_progress: 60,
        progress_value: 1,
      },
    };
    await Datasource.update({
      id: datasource._id.toString(),
      isPatch: true,
      updatedoc: {
        decoders, 
        encoders, 
        encoder_counts,
      },
      updatedat: new Date(),
    });
    let providers = THEMESETTINGS.machinelearning.providers;
    let digifi_models = THEMESETTINGS.machinelearning.digifi_models[mongo_mlmodel.type] || [];
    providers.forEach(provider => {
      PROVIDER_DATASOURCE_FUNCS[provider]({ mlmodel, headers: included_headers, training_data_transposed, testing_data_transposed, columnTypes, });
      helpers.mlAutoProgress({ provider, model_id: mlmodel._id.toString(), interval: auto_progress_configs[provider].interval, organization: mlmodel.organization.toString(), max_progress: auto_progress_configs[provider].max_progress, });
    });
    PROVIDER_DATASOURCE_FUNCS['digifi']({ mlmodel, headers: included_headers, training_data_transposed, testing_data_transposed, columnTypes, });
    digifi_models.forEach(provider => {
      helpers.mlAutoProgress({ provider, model_id: mlmodel._id.toString(), interval: auto_progress_configs[provider].interval, organization: mlmodel.organization.toString(), max_progress: auto_progress_configs[provider].max_progress, progress_value: auto_progress_configs[provider].progress_value });
    });
  } catch(e){
    logger.warn(e.message);
    await MLModel.update({
      id: mlmodel._id.toString(),
      isPatch: true,
      updatedoc: {
        status: 'failed',
      },
      updatedat: new Date(),
    });
  }
}

module.exports = preTrainingProcess;
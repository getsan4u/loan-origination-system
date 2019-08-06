'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
const mathjs = require('mathjs');
const csv = require('fast-csv');
const Promisie = require('promisie');

function fetchFileFromAWSAsync({ Bucket, Key }) {
  return new Promise((resolve, reject) => {
    try {
      const s3 = periodic.aws.s3;
      const s3Stream = s3.getObject({ Bucket, Key, }).createReadStream();
      let csvarr = [];
      var zlib = require('zlib');
      var gunzip = zlib.createGunzip();
      s3Stream.pipe(gunzip).pipe(csv())
        .on('data', (data) => {
          csvarr.push(data);
        })
        .on('error', function (e) {
          logger.warn(`Invalid csv format: ${e.message}`);
        })
        .on('end', function () {
          return resolve(csvarr);
        });
    } catch (err) {
      return reject(err);
    }
  })
}

function original({ mlmodel, batch_type, }) {
  return new Promise((resolve, reject) => {
    try {
      const s3 = periodic.aws.s3;
      let { Bucket, Key } = mlmodel.datasource.original_file[ batch_type ];
      let s3params = { Bucket, Key };
      const s3Stream = s3.getObject({ Bucket, Key, }).createReadStream();
      let csvarr = [];
      s3Stream.pipe(csv())
        .on('data', (data) => {
          csvarr.push(data);
        })
        .on('error', function (e) {
          logger.warn(`Invalid csv format: ${e.message}`);
          return reject(e);
        })
        .on('end', function () {
          return resolve(csvarr);
        });
    } catch (err) {
      return reject(err);
    }
  })
}

async function fetchSageMakerOutputFilesAsync({ Bucket, Key, }) {
  try {
    const s3 = periodic.aws.s3;
    let s3params = { Bucket, Key };
    let sageMakerPredictions = await s3.getObject(s3params).promise();
    return sageMakerPredictions.Body.toString('utf8').replace(/\]}{"predictions": \[/g, ',')
  } catch (e) {
    return e;
  }
}

async function aws({ mlmodel, batch_type, }) {
  try {
    if (mlmodel[ 'aws' ][ `batch_${batch_type}_id` ]) {
      let batch_prediction_id = mlmodel[ 'aws' ][ `batch_${batch_type}_id` ];
      let fetch_result = await fetchFileFromAWSAsync(batch_prediction_id);
      fetch_result.shift();
      let predictions = fetch_result.map(row => {
        let columnIdx = (mlmodel.type === 'binary') ? 2 
          : (mlmodel.type === 'regression')
            ? 1
            : 0;
        return row[ columnIdx ];
      });
      return predictions;
    } else {
      return new Error('There is no batch data available for AWS Machine Learning.');
    }
  } catch (e) {
    return e;
  }
}

async function sagemaker_ll({ mlmodel, batch_type, }) {
  try {
    if (mlmodel[ 'sagemaker_ll' ][ `batch_${batch_type}_id` ]) {
      let batch_prediction_id = mlmodel[ 'sagemaker_ll' ][ `batch_${batch_type}_id` ];
      let fetched_file = await fetchSageMakerOutputFilesAsync(batch_prediction_id);
      let { datasource } = mlmodel;
      let model_type = mlmodel.type;
      let encoders = datasource.encoders || {
        'false': 0,
        'true': 1,
      };
      let decoders = datasource.decoders || {
        0: false,
        1: true,
      };
      let predictions = JSON.parse(fetched_file).predictions;
      let batch_predictions = [];
      if (model_type === 'binary') {
        batch_predictions = predictions.map(pd => pd.score);
      } else if (model_type === 'categorical') {
        batch_predictions = predictions.map(pd => {
          return decoders.historical_result[ parseInt(pd.predicted_label) ];
        });
      } else if (model_type === 'regression') {
        batch_predictions = predictions.map(pd => pd.score);
      }
      return batch_predictions;
    } else {
      return new Error('There is no batch data available for Sagemaker Linear Learner.');
    }
  } catch (e) {
    return e;
  }
}

function sagemaker_xgb({ mlmodel, batch_type, }) {
  return new Promise(async (resolve, reject) => {
    try {
      let { datasource } = mlmodel;
      let model_type = mlmodel.type;
      let encoders = datasource.encoders || {
        'false': 0,
        'true': 1,
      };
      let decoders = datasource.decoders || {
        0: false,
        1: true,
      };
      if (mlmodel[ 'sagemaker_xgb' ][ `batch_${batch_type}_id` ]) {
        let batch_prediction_id = mlmodel[ 'sagemaker_xgb' ][ `batch_${batch_type}_id` ];
        let fetched_file = await fetchSageMakerOutputFilesAsync(batch_prediction_id);
        let predictions = [];
        if (model_type === 'binary') {
          csv.fromString(fetched_file, { headers: false })
            .on('data', function (data) {
              predictions.push(data);
            })
            .on('end', function () {
              predictions = predictions.map(Number);
              return resolve(predictions);
            });
        } else if (model_type === 'categorical') {
          csv.fromString(fetched_file, { delimiter: '\n', trim: true, ignoreEmpty: true })
            .on('data', function (data) {
              data.forEach(dt => {
                if (dt) {
                  let parsed = JSON.parse(dt);
                  predictions.push(parsed);
                }
              })
            })
            .on('end', function () {
              predictions = predictions.map(pd => {
                let max = Math.max(...pd);
                return decoders.historical_result[ pd.indexOf(max) ];
              });
              return resolve(predictions);
            });
        } else if (model_type === 'regression') {
          csv.fromString(fetched_file, { headers: false })
            .on('data', function (data) {
              predictions.push(Number(data[ 0 ]));
            })
            .on('end', function () {
              predictions = predictions.map(Number);
              return resolve(predictions);
            });
        }
      } else {
        return reject(new Error('There is no batch data available for Sagemaker XGBoost.'));
      }
    } catch (e) {

      return reject(e);
    }
  });
}

function digifi({ mlmodel, batch_type, provider }) {
  return new Promise(async (resolve, reject) => {
    try {
      let { datasource } = mlmodel;
      let model_type = mlmodel.type;
      let encoders = datasource.encoders || {
        'false': 0,
        'true': 1,
      };
      let decoders = datasource.decoders || {
        0: false,
        1: true,
      };
      if (mlmodel[ provider ][ `batch_${batch_type}_id` ]) {
        const BatchPrediction = periodic.datas.get('standard_batchprediction');
        let batch_prediction_id = mlmodel[ provider ][ `batch_${batch_type}_id` ];
        let fetched_file = await BatchPrediction.load({ query: { _id: batch_prediction_id } });
        fetched_file = fetched_file.toJSON ? fetched_file.toJSON() : fetched_file;
        let predictions = fetched_file.predictions;
        if (model_type === 'binary') {
          return resolve(predictions);
        } else if (model_type === 'categorical') {
          predictions = predictions.map(pd => decoders.historical_result[ pd ]);
          return resolve(predictions);
        } else if (model_type === 'regression') {
          predictions = predictions.map(Number);  
          return resolve(predictions);
        }
      } else {
        return reject(new Error(`There is no batch data available for ${provider}`));
      }
    } catch (e) {

      return reject(e);
    }
  });
}

module.exports = {
  aws,
  original,
  sagemaker_ll,
  sagemaker_xgb,
  neural_network: digifi,
  decision_tree: digifi,
  random_forest: digifi,
};
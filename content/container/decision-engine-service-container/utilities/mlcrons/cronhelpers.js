'use strict';
const periodic = require('periodicjs');
const csv = require('fast-csv');
const numeral = require('numeral');
const logger = periodic.logger;
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectID;
const { openDownloadStreamAsync } = require('../mlresource/resourcehelpers');
const SCORE_ANALYSIS_FUNCTIONS = {
  binary: {
    lending: require('../mlresource/score_analysis/binary/lending'),
  }
};

function promisifiedPipeCSVData({ s3Stream, originalDoc, model_type, mlmodel, datasource, batch_type, batchData, provider }) {
  return new Promise((resolve, reject) => {
    try {
      s3Stream.pipe(csv())
        .on('data', (data) => {
          originalDoc.push(data);
        })
        .on('error', function (e) {
          logger.warn(`Invalid csv format: ${e.message}`);
          console.log({ e })
        })
        .on('end', async function () {
          const modelHeaders = originalDoc.shift();
          let inputAnalysisData = await openDownloadStreamAsync(periodic.gridfs.bucket, ObjectId(mlmodel.industry_file));
          const splitInputAnalysisData = {
            training: [],
            testing: []
          };
          inputAnalysisData.forEach((row, i) => {
            if (i % 10 <= 6) splitInputAnalysisData.training.push(row.map(parseFloat));
            else splitInputAnalysisData.testing.push(row.map(parseFloat));
          });
          await SCORE_ANALYSIS_FUNCTIONS[ model_type ][ mlmodel.industry ](mlmodel, datasource, modelHeaders, splitInputAnalysisData[batch_type], batchData, originalDoc, provider, batch_type);
          return resolve(true);
        })
    } catch (err) {
      return reject()
    }
  });
}
async function runAWSScoreAnalysis({ mlmodel, batch_type, batchPredictionData, columnIdx, provider, originalDoc = [], modelHeaders }) {
  try {
    const BatchPrediction = periodic.datas.get('standard_batchprediction');
    const Datasource = periodic.datas.get('standard_datasource');
    const model_type = mlmodel.type;
    const datasource = await Datasource.model.findOne({ _id: mlmodel.datasource.toString() });
    const s3 = periodic.aws.s3;
    const batchData = {
      predictions: []
    };
    batchPredictionData.forEach((row, i) => {
      batchData.predictions.push(Number(row[columnIdx]));
    })
    let originalDocParams = {
      Bucket: datasource.original_file[ batch_type ].Bucket,
      Key: datasource.original_file[ batch_type ].Key,
    };
    const s3Stream = s3.getObject(originalDocParams).createReadStream();
    if (provider === 'aws'){
      await promisifiedPipeCSVData({ s3Stream, originalDoc, model_type, mlmodel, datasource, batch_type, batchData, provider });
    } else {
      let inputAnalysisData = await openDownloadStreamAsync(periodic.gridfs.bucket, ObjectId(mlmodel.industry_file));
      const splitInputAnalysisData = {
        training: [],
        testing: []
      };
      inputAnalysisData.forEach((row, i) => {
        if (i % 10 <= 6) splitInputAnalysisData.training.push(row.map(parseFloat));
        else splitInputAnalysisData.testing.push(row.map(parseFloat));
      });
      await SCORE_ANALYSIS_FUNCTIONS[ model_type ][ mlmodel.industry ](mlmodel, datasource, modelHeaders, splitInputAnalysisData[batch_type], batchData, originalDoc, provider, batch_type);
    }
  } catch(e) {
    console.log({ e });
  }
}

module.exports = {
  runAWSScoreAnalysis,
}
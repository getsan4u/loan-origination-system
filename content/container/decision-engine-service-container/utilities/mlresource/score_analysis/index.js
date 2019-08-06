'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const logger = periodic.logger;
const SCORE_ANALYSIS_FUNCTIONS = {
  binary: {
    lending: require('./binary/lending'),
  }
};
const csv = require('fast-csv');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectID;
const { openDownloadStreamAsync } = require('../resourcehelpers');

async function runDigifiScoreAnalysis(mlmodel) {
  try {
    const BatchPrediction = periodic.datas.get('standard_batchprediction');
    const Datasource = periodic.datas.get('standard_datasource');
    const model_type = mlmodel.type;
    const providers = THEMESETTINGS.machinelearning.digifi_models[model_type];
    const datasource = await Datasource.model.findOne({ _id: mlmodel.datasource.toString() });
    const s3 = periodic.aws.s3;
    let originalTrainingDocParams = {
      Bucket: datasource.original_file[ 'training' ].Bucket,
      Key: datasource.original_file[ 'training' ].Key,
    };
    let originalTestingDocParams = {
      Bucket: datasource.original_file[ 'testing' ].Bucket,
      Key: datasource.original_file[ 'testing' ].Key,
    };

    const s3TrainingStream = s3.getObject(originalTrainingDocParams).createReadStream();
    const s3TestingStream = s3.getObject(originalTestingDocParams).createReadStream();
    let originalTrainingDoc = [];
    let originalTestingDoc = [];
    s3TrainingStream.pipe(csv())
      .on('data', (data) => {
        originalTrainingDoc.push(data);
      })
      .on('error', function (e) {
        logger.warn(`Invalid csv format: ${e.message}`);
        console.log({ e })
      })
      .on('end', async function () {
        s3TestingStream.pipe(csv())
          .on('data', (data) => {
            originalTestingDoc.push(data);
          })
          .on('error', function (e) {
            logger.warn(`Invalid csv format: ${e.message}`);
            console.log({ e })
          })
          .on('end', async function () {
            const modelHeaders = originalTrainingDoc.shift();
            originalTestingDoc.shift();
            const inputAnalysisData = await openDownloadStreamAsync(periodic.gridfs.bucket, ObjectId(mlmodel.industry_file));
            const trainingInputAnalysisData = [];
            const testingInputAnalysisData = [];
            inputAnalysisData.forEach((row, i) => {
              if (i % 10 <= 6) trainingInputAnalysisData.push(row.map(parseFloat));
              else testingInputAnalysisData.push(row.map(parseFloat));
            });
            await Promise.all(providers.map(async provider => {
              if (mlmodel[provider] && mlmodel[provider].batch_training_id && mlmodel[provider].batch_testing_id) {
                const trainingBatch = await BatchPrediction.model.findOne({ _id: mlmodel[provider].batch_training_id, }).lean();
                const testingBatch = await BatchPrediction.model.findOne({  _id: mlmodel[ provider ].batch_testing_id, }).lean();
                await SCORE_ANALYSIS_FUNCTIONS[ model_type ][ mlmodel.industry ](mlmodel, datasource, modelHeaders, trainingInputAnalysisData, trainingBatch, originalTrainingDoc, provider, 'training');
                await SCORE_ANALYSIS_FUNCTIONS[model_type][mlmodel.industry](mlmodel, datasource, modelHeaders, testingInputAnalysisData, testingBatch, originalTestingDoc, provider, 'testing');
              }
            }));
          });
      });
  } catch(e) {
    console.log({ e });
  }
}


module.exports = runDigifiScoreAnalysis;
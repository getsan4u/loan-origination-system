'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const logger = periodic.logger;
const INPUT_ANALYSIS_FUNCTIONS = {
  // regression: require('./regression'),
  // binary: require('./binary'),
  // categorical: require('./categorical'),
  binary: require('./binary'),
};
const csv = require('fast-csv');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectID;
const { openDownloadStreamAsync } = require('../resourcehelpers');

async function runDigifiInputAnalysis(mlmodel) {
  try {
    const Datasource = periodic.datas.get('standard_datasource');
    const model_type = mlmodel.type;
    const datasource = await Datasource.model.findOne({ _id: mlmodel.datasource.toString() });
    const providers = THEMESETTINGS.machinelearning.digifi_models[ model_type ];
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
            const inputAnalysisData = await openDownloadStreamAsync(periodic.gridfs.bucket, ObjectId(mlmodel.industry_file));
            let analysis_result = await INPUT_ANALYSIS_FUNCTIONS[ mlmodel.type ][ mlmodel.industry ](mlmodel, datasource, originalTrainingDoc, originalTestingDoc, inputAnalysisData);
          });
      });
  } catch (e) {
    console.log({ e });
  }
}

module.exports = runDigifiInputAnalysis;
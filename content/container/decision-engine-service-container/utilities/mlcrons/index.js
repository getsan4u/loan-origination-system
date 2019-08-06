'use strict';
const batchUpdater = require('./batch_updater');
const checkDataSources = require('./check_data_sources');
const checkMLModels = require('./check_ml_models');
const evaluationUpdater = require('./evaluation_updater');
const modelUpdater = require('./model_updater');
const overallModelUpdater = require('./overall_model_updater');
const modelSelectionUpdater = require('./model_selection_updater');
const uploadDatasources = require('./upload_data_sources');
const preTrainingProcess = require('./pre_training_process');
const sageMaker = require('./sagemaker');
const digifi = require('./digifi');

module.exports = {
  batchUpdater,
  checkDataSources,
  checkMLModels,
  evaluationUpdater,
  modelUpdater,
  overallModelUpdater,
  modelSelectionUpdater,
  preTrainingProcess,
  uploadDatasources,
  sageMaker,
  digifi,
};
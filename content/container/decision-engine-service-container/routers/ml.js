'use strict';

/** Routes for Simulation */

const periodic = require('periodicjs');
const controllers = require('../controllers');
const transformController = controllers.transform;
const mlController = controllers.ml;
const optimizationController = controllers.optimization;
const simulationController = controllers.simulation;
const organizationController = controllers.organization;
const authController = controllers.auth;
const paymentController = controllers.payment;
const MlRouter = periodic.express.Router();
const ensureApiAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.ensureApiAuthenticated;

MlRouter.get('/check_account_limit',
  ensureApiAuthenticated,
  mlController.checkOrgAccountLimit);

MlRouter.get('/download_tutorial_data',
  mlController.downloadTutorialData);

MlRouter.get('/models',
  ensureApiAuthenticated,
  mlController.getModels,
  transformController.posttransform,
  mlController.handleControllerDataResponse);

MlRouter.get('/models/:id/input_data',
  ensureApiAuthenticated,
  mlController.getModel,
  transformController.posttransform,
  mlController.handleControllerDataResponse);

MlRouter.get('/models/:id/analysis_charts/:idx',
  ensureApiAuthenticated,
  mlController.getModel,
  mlController.getInputAnalysis,
  mlController.getScoreAnalysis,
  transformController.posttransform,
  mlController.handleControllerDataResponse);

MlRouter.get('/models/:id/download_batch_results/:batch_type',
  ensureApiAuthenticated,
  mlController.getModel,
  mlController.getProviderBatchData,
  mlController.getIndustryProviderBatchData,
  mlController.downloadCSV);

MlRouter.get('/models/:id/download_chart_data',
  ensureApiAuthenticated,
  mlController.getModel,
  mlController.getChartDownloadData,
  mlController.downloadCSV);

MlRouter.get('/models/:id/model_selection',
  ensureApiAuthenticated,
  mlController.getModel,
  transformController.posttransform,
  mlController.handleControllerDataResponse);

MlRouter.get('/models/data_source_progress',
  ensureApiAuthenticated,
  transformController.pretransform,
  mlController.getModel,
  mlController.handleControllerDataResponse);

MlRouter.get('/model/:id',
  ensureApiAuthenticated,
  mlController.getModel,
  transformController.posttransform,
  mlController.handleControllerDataResponse);

MlRouter.get('/model/:id/select_type',
  ensureApiAuthenticated,
  mlController.getModel,
  transformController.posttransform,
  mlController.handleControllerDataResponse);

MlRouter.get('/model/:id/review_and_train',
  ensureApiAuthenticated,
  mlController.getModel,
  transformController.posttransform,
  mlController.handleControllerDataResponse);

MlRouter.get('/individual/run',
  ensureApiAuthenticated,
  mlController.getMLModelsForProcessing,
  transformController.posttransform,
  mlController.handleControllerDataResponse);

MlRouter.get('/individual/run/:id',
  ensureApiAuthenticated,
  mlController.getMLModelsForProcessing,
  mlController.populateDatasource,
  mlController.getMLCaseByQuery,
  transformController.posttransform,
  mlController.handleControllerDataResponse);

MlRouter.get('/individual/cases',
  ensureApiAuthenticated,
  mlController.getIndividualMLCases,
  mlController.handleControllerDataResponse
);

MlRouter.get('/individual/results/:id',
  ensureApiAuthenticated,
  mlController.getMLCase,
  mlController.checkIfModelExists,
  transformController.posttransform,
  mlController.handleControllerDataResponse
);

MlRouter.get('/batch/run',
  ensureApiAuthenticated,
  mlController.getMLModelsForProcessing,
  transformController.posttransform,
  mlController.handleControllerDataResponse);

MlRouter.get('/batch/simulations',
  ensureApiAuthenticated,
  mlController.getMLBatchSimulations,
  mlController.handleControllerDataResponse);

MlRouter.get('/batch/run/:id',
  ensureApiAuthenticated,
  mlController.getMLModelsForProcessing,
  transformController.posttransform,
  mlController.handleControllerDataResponse);

MlRouter.get('/batch/results/:id',
  ensureApiAuthenticated,
  optimizationController.getMLBatchSimulation,
  transformController.posttransform,
  mlController.handleControllerDataResponse
);

MlRouter.get('/batch/results/:id/cases',
  ensureApiAuthenticated,
  optimizationController.getMLBatchSimulation,
  transformController.posttransform,
  mlController.handleControllerDataResponse
);

MlRouter.get('/download_ml_template/:id',
  mlController.getModel,
  transformController.posttransform,
  simulationController.downloadCSV);

MlRouter.get('/download/case/:id', // need to move to ml controller
  optimizationController.getMLCase,
  transformController.posttransform,
  optimizationController.downloadMLCSV);

MlRouter.get('/download/mlbatch/:id', // need to move to ml controller
  optimizationController.getMLSimulation,
  optimizationController.getMLSimulationCases,
  transformController.posttransform,
  optimizationController.downloadMLCSV);

MlRouter.get('/download_sample_datasource_data',
  mlController.downloadSampleDataSourceData);

MlRouter.get('/models/:id/check_model_status',
  ensureApiAuthenticated,
  mlController.getModel,
  // mlController.checkModelStatusForDetailPage,
  mlController.redirectToModelSelection,
);

MlRouter.post('/individual/run/:id', // Machine Learning Individual
  ensureApiAuthenticated,
  organizationController.APIgetOrg,
  organizationController.checkOrganizationBalance,
  paymentController.setRequestTypeAndCost,
  mlController.getModel,
  mlController.getScoreAnalysisDocument,
  mlController.predictSingleMLCase,
  paymentController.stageProcessingTransactionForCreation,
  paymentController.addTransaction,
  mlController.createIndividualMLCase);

MlRouter.post('/batch/run', // Machine Learning Batch
  ensureApiAuthenticated,
  organizationController.APIgetOrg,
  organizationController.checkOrganizationBalance,
  paymentController.setRequestTypeAndCost,
  mlController.getUploadedMLData,
  mlController.getModel,
  mlController.getScoreAnalysisDocument,
  mlController.registerMLSimulation,
  paymentController.stageProcessingTransactionForCreation,
  paymentController.addTransaction,
  mlController.runBatchMLProcess);

MlRouter.post('/models/:id/data_source',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  mlController.getModel,
  mlController.deleteDataSourceIfExists,
  mlController.readCSVDataSource,
  mlController.uploadOriginalFilesToS3,
  mlController.createDataSource,
  mlController.uploadIndustryInputFile,
  mlController.updateModel,
  transformController.pretransform,
  mlController.updateDatasource,
  mlController.handleControllerDataResponse
);

MlRouter.post('/models/:id/train',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  mlController.getModel,
  mlController.checkIfLinearModelAndCategoricalAWS,
  mlController.updateDataSchema,
  mlController.trainProviderModels,
  mlController.handleControllerDataResponse
);

MlRouter.post('/initialize_new_model',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  transformController.pretransform,
  mlController.createInitialMongoModel);

MlRouter.put('/select_model_type/:id',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  mlController.getModel,
  mlController.deleteDataSourceIfExists,
  mlController.selectModelType);

MlRouter.put('/models/:id',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  mlController.getModel,
  transformController.pretransform,
  mlController.updateModel,
  mlController.handleControllerDataResponse);

MlRouter.delete('/models/:id',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  mlController.getModel,
  mlController.checkModelStatusForDelete,
  mlController.updateModelStatusToDeleting,
  mlController.deleteModel,
  mlController.handleControllerDataResponse);


MlRouter.delete('/individual/results/:id',
  ensureApiAuthenticated,
  mlController.deleteMLCase,
  mlController.handleControllerDataResponse);

module.exports = MlRouter;

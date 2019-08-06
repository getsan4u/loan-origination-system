'use strict';

/** Routes for Simulation */

const periodic = require('periodicjs');
const controllers = require('../controllers');
const transformController = controllers.transform;
const utilities = require('../utilities');
const CONSTANTS = utilities.constants;
const optimizationController = controllers.optimization;
const simulationController = controllers.simulation;
const integrationController = controllers.integration;
const organizationController = controllers.organization;
const paymentController = controllers.payment;
const apiController = controllers.api;
const standardControllers = utilities.standard_controllers.standardControllers();
const OptimizationRouter = periodic.express.Router();
const ensureApiAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.ensureApiAuthenticated;

// OptimizationRouter.get('/simulation_results/:id/download',
//   simulationController.getSimulationData,
//   simulationController.downloadCSV);

// OptimizationRouter.get('/download_variables/:id/:organization',
//   optimizationController.getTestCaseVariables,
//   simulationController.downloadCSV);

// OptimizationRouter.get('/get_documents',
//   ensureApiAuthenticated,
//   optimizationController.getDocuments,
//   transformController.posttransform,
//   optimizationController.handleControllerDataResponse);

OptimizationRouter.get('/download_tutorial_data',
  optimizationController.downloadTutorialData
);

OptimizationRouter.get('/download_document_template/:id',
  optimizationController.getDocument,
  simulationController.getFileFromAWS);

OptimizationRouter.get('/documents/get_document_editmodal/:id',
  ensureApiAuthenticated,
  apiController.getVariables,
  optimizationController.getDocument,
  transformController.posttransform,
  optimizationController.handleControllerDataResponse)

// OptimizationRouter.get('/get_documents/:id/:page',
//   ensureApiAuthenticated,
//   optimizationController.getDocument,
//   optimizationController.getOCRTemplateFromAWS,
//   integrationController.getInputVariablesMap,
//   transformController.posttransform,
//   optimizationController.handleControllerDataResponse);

OptimizationRouter.get('/datasources/:id',
  ensureApiAuthenticated,
  optimizationController.getDataSource,
  transformController.posttransform,
  optimizationController.handleControllerDataResponse);

OptimizationRouter.get('/mlmodels/:id',
  ensureApiAuthenticated,
  transformController.pretransform,
  optimizationController.getModel,
  transformController.posttransform,
  optimizationController.handleControllerDataResponse);

OptimizationRouter.get('/pagedata/*',
  optimizationController.getPageData,
  optimizationController.handleControllerDataResponse);

OptimizationRouter.get('/download_analysisdata',
  optimizationController.getBatchAnalysisData,
  transformController.pretransform,
  simulationController.downloadCSV);

OptimizationRouter.get('/download_datasource/:id',
  optimizationController.getDataSourceForDownload,
  optimizationController.downloadDataSourceData);

OptimizationRouter.get('/download_batchdata/:id',
  optimizationController.getBatchData,
  optimizationController.downloadBatchData);

OptimizationRouter.get('/analysis',
  ensureApiAuthenticated,
  optimizationController.getModelEvaluationDropdown,
  optimizationController.handleControllerDataResponse
);

OptimizationRouter.post('/run_analysis',
  ensureApiAuthenticated,
  optimizationController.getBatchAnalysisData,
  transformController.posttransform,
  optimizationController.handleControllerDataResponse
);
OptimizationRouter.get('/documents/:id/:page/edit_variable/:input',
  ensureApiAuthenticated,
  optimizationController.getDocument,
  optimizationController.getInputVariables,
  transformController.posttransform,
  optimizationController.handleControllerDataResponse);

// OptimizationRouter.post('/documents/:id/:page/add_variable',
//   ensureApiAuthenticated,
//   optimizationController.getInputVariables,
//   transformController.posttransform,
//   optimizationController.handleControllerDataResponse);


OptimizationRouter.get('/get_ml_create_data',
  ensureApiAuthenticated,
  optimizationController.formatModelCreate,
  optimizationController.handleControllerDataResponse)

OptimizationRouter.get('/get_datasource_data',
  ensureApiAuthenticated,
  optimizationController.getDataSources,
  optimizationController.handleControllerDataResponse)

OptimizationRouter.get('/get_mlmodel_data',
  ensureApiAuthenticated,
  optimizationController.getMlModelsIndex,
  optimizationController.handleControllerDataResponse)

OptimizationRouter.get('/download_data_source_template',
  optimizationController.getDataSourceTemplate,
  simulationController.downloadCSV);

// OptimizationRouter.put('/documents/:id/edit_ocrdocument_variables',
//   ensureApiAuthenticated,
//   optimizationController.getDocument,
//   optimizationController.updateOCRDocumentVariables,
//   optimizationController.handleControllerDataResponse);

OptimizationRouter.get('/individual/cases',
  ensureApiAuthenticated,
  optimizationController.getIndividualMLCases,
  optimizationController.handleControllerDataResponse
);

OptimizationRouter.get('/individual/run',
  ensureApiAuthenticated,
  optimizationController.getMLModels,
  transformController.posttransform,
  optimizationController.handleControllerDataResponse);

OptimizationRouter.get('/individual/run/:id', 
  ensureApiAuthenticated,
  optimizationController.getMLModels,
  transformController.posttransform,
  optimizationController.handleControllerDataResponse);

OptimizationRouter.get('/batch/run',
  ensureApiAuthenticated,
  optimizationController.getMLModels,
  transformController.posttransform,
  optimizationController.handleControllerDataResponse);

OptimizationRouter.get('/batch/simulations',
  ensureApiAuthenticated,
  optimizationController.getMLBatchSimulations,
  optimizationController.handleControllerDataResponse);

OptimizationRouter.get('/batch/run/:id',
  ensureApiAuthenticated,
  optimizationController.getMLModels,
  transformController.posttransform,
  optimizationController.handleControllerDataResponse);

OptimizationRouter.get('/download_ml_template/:id',
  optimizationController.getModel,
  transformController.posttransform,
  simulationController.downloadCSV);

OptimizationRouter.get('/download/case/:id',
  optimizationController.getMLCase,
  transformController.posttransform,
  optimizationController.downloadMLCSV);

OptimizationRouter.get('/download/mlbatch/:id',
  optimizationController.getMLSimulation,
  optimizationController.getMLSimulationCases,
  transformController.posttransform,
  optimizationController.downloadMLCSV);

OptimizationRouter.post('/batch/run', // Machine Learning Batch
  ensureApiAuthenticated,
  organizationController.APIgetOrg,
  organizationController.checkOrganizationBalance,
  paymentController.setRequestTypeAndCost,
  optimizationController.getUploadedMLData,
  optimizationController.getModel,
  optimizationController.registerMLSimulation,
  paymentController.stageProcessingTransactionForCreation,
  paymentController.addTransaction,
  optimizationController.runBatchMLProcess);

OptimizationRouter.post('/individual/run/:id', // Machine Learning Individual
  ensureApiAuthenticated,
  organizationController.APIgetOrg,
  organizationController.checkOrganizationBalance,
  paymentController.setRequestTypeAndCost,
  transformController.pretransform,
  optimizationController.getModel,
  optimizationController.predictSingleMLCase,
  paymentController.stageProcessingTransactionForCreation,
  paymentController.addTransaction,
  optimizationController.createIndividualMLCase);

OptimizationRouter.get('/individual/results/:id',
  ensureApiAuthenticated,
  optimizationController.getMLCase,
  transformController.posttransform,
  optimizationController.handleControllerDataResponse
);

OptimizationRouter.get('/batch/results/:id',
  ensureApiAuthenticated,
  optimizationController.getMLBatchSimulation,
  transformController.posttransform,
  optimizationController.handleControllerDataResponse
);

OptimizationRouter.get('/batch/results/:id/cases',
  ensureApiAuthenticated,
  optimizationController.getMLBatchSimulation,
  transformController.posttransform,
  optimizationController.handleControllerDataResponse
);

OptimizationRouter.put('/documents/:id/edit_ocrdocument_variables',
  ensureApiAuthenticated,
  optimizationController.getDocument,
  optimizationController.updateOCRDocumentVariables,
  optimizationController.handleControllerDataResponse);

OptimizationRouter.put('/documents/:id/:page',
  ensureApiAuthenticated,
  optimizationController.updateDocument,
  optimizationController.handleControllerDataResponse);

// OptimizationRouter.put('/documents/:id/:page/add_variable',
//   ensureApiAuthenticated,
//   optimizationController.getDocument,
//   transformController.pretransform,
//   optimizationController.updateDocument,
//   optimizationController.handleControllerDataResponse);

OptimizationRouter.put('/documents/:id/:page/edit_variable/:input',
  ensureApiAuthenticated,
  optimizationController.getDocument,
  transformController.pretransform,
  optimizationController.updateDocument,
  optimizationController.handleControllerDataResponse);

// OptimizationRouter.put('/upload_ocr_template',
//   ensureApiAuthenticated,
//   transformController.pretransform,
//   simulationController.getUploadedOCRDocuments,
//   optimizationController.getDocument,
//   simulationController.createLocalPDF,
//   simulationController.generateLocalImageFiles,
//   optimizationController.uploadOCRTemplateToAWS,
//   optimizationController.updateDocument,
//   simulationController.clearTempPDFandImageFiles,
//   optimizationController.handleControllerDataResponse);

OptimizationRouter.put('/documents/:id/:page/edit_variable/:input',
  ensureApiAuthenticated,
  optimizationController.getDocument,
  transformController.pretransform,
  optimizationController.updateDocument,
  optimizationController.handleControllerDataResponse);

OptimizationRouter.put('/documents/:id/:page/delete_variable/:input',
  ensureApiAuthenticated,
  optimizationController.getDocument,
  transformController.pretransform,
  optimizationController.updateDocument,
  optimizationController.handleControllerDataResponse);

OptimizationRouter.put('/update_status/document/:id',
  ensureApiAuthenticated,
  optimizationController.getDocument,
  optimizationController.flipDocumentStatus,
  optimizationController.updateDocument,
  optimizationController.handleControllerDataResponse);

OptimizationRouter.put('/mlmodels/:id',
  ensureApiAuthenticated,
  optimizationController.updateModel,
  optimizationController.handleControllerDataResponse)

OptimizationRouter.put('/datasources/:id',
  ensureApiAuthenticated,
  optimizationController.updateDataSource,
  optimizationController.handleControllerDataResponse)

OptimizationRouter.post('/data_source',
  ensureApiAuthenticated,
  transformController.pretransform,
  optimizationController.createMongoDataSource,
  optimizationController.handleControllerDataResponse);

// OptimizationRouter.post('/ocr',
//   ensureApiAuthenticated,
//   optimizationController.createOCRTemplate,
//   optimizationController.handleControllerDataResponse);

// old model training route
// OptimizationRouter.post('/ml_model',
//   ensureApiAuthenticated,
//   optimizationController.checkPendingMlTraining,
//   transformController.pretransform,
//   optimizationController.getDataSource,
//   // optimizationController.transformDataSource,
//   optimizationController.createAWSDataSource,
//   optimizationController.createMongoMLModelandBatches,
//   optimizationController.handleControllerDataResponse);

// new model training route
OptimizationRouter.post('/ml_model',
  ensureApiAuthenticated,
  // optimizationController.checkPendingMlTraining,
  transformController.pretransform,
  optimizationController.getDataSource,
  // optimizationController.transformDataSource,
  // optimizationController.createAWSDataSource,
  optimizationController.createProviderDataSources,
  optimizationController.createMongoModelGroup,
  optimizationController.handleControllerDataResponse);

OptimizationRouter.delete('/datasources/:id',
  ensureApiAuthenticated,
  optimizationController.deleteDataSource,
  optimizationController.handleControllerDataResponse);

OptimizationRouter.delete('/mlmodels/:id',
  ensureApiAuthenticated,
  optimizationController.deleteMLModel,
  optimizationController.handleControllerDataResponse);

// OptimizationRouter.delete('/delete_ocr/:id',
//   ensureApiAuthenticated,
//   optimizationController.deleteOCRTemplate,
//   optimizationController.handleControllerDataResponse);

module.exports = OptimizationRouter;

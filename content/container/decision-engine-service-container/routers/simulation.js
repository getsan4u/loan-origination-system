'use strict';

/** Routes for Simulation */

const periodic = require('periodicjs');
const controllers = require('../controllers');
const transformController = controllers.transform;
const utilities = require('../utilities');
const CONSTANTS = utilities.constants;
const SIMULATION_MODELS = CONSTANTS.SIMULATION_MODELS;
const simulationController = controllers.simulation;
const integrationController = controllers.integration;
const paymentController = controllers.payment;
const organizationController = controllers.organization;
const apiController = controllers.api;
const standardControllers = utilities.standard_controllers.standardControllers();
const SimulationRouter = periodic.express.Router();
const ensureApiAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.ensureApiAuthenticated;

// Old individual OCR
// SimulationRouter.post('/upload_ocr_file',
//   ensureApiAuthenticated,
//   simulationController.getUploadedOCRDocuments,
//   simulationController.getOCRDocument,
//   simulationController.parseOCRDocument,
//   // transformController.posttransform,
//   simulationController.redirectIndividualRunPage,
// );

// Old batch OCR
// SimulationRouter.post('/process_ocr_documents',
//   integrationController.getInputVariablesMap,
//   simulationController.getUploadedOCRDocuments,
//   simulationController.getOCRDocument,
//   transformController.pretransform,
//   integrationController.initializeStrategyForSimulationCompilation,
//   simulationController.parseOCRDocument,
//   simulationController.downloadOCRInputCSV,
//   simulationController.handleControllerDataResponse
// );

SimulationRouter.post('/upload_ocr_file',
  ensureApiAuthenticated,
  simulationController.getUploadedOCRDocuments,
  simulationController.createLocalPDF,
  simulationController.generateLocalImageFiles,
  simulationController.getOCRDocument,
  simulationController.retrieveOCRResults,
  simulationController.cleanOCRResults,
  simulationController.extractOCRResults,
  simulationController.clearTempPDFandImageFiles,
  simulationController.redirectIndividualRunPage,
);

SimulationRouter.post('/process_ocr_documents',
  ensureApiAuthenticated,
  integrationController.getInputVariablesMap,
  simulationController.getUploadedOCRDocuments,
  simulationController.createLocalPDF,
  simulationController.generateLocalImageFiles,
  simulationController.getOCRDocument,
  transformController.pretransform,
  integrationController.initializeStrategyForSimulationCompilation,
  simulationController.retrieveOCRResults,
  simulationController.cleanOCRResults,
  simulationController.extractOCRResults,
  simulationController.downloadOCRInputCSV,
  simulationController.clearTempPDFandImageFiles,
  simulationController.handleControllerDataResponse
);

SimulationRouter.get('/get_documentocr_dropdown',
  ensureApiAuthenticated,
  simulationController.getOCRDocuments,
  transformController.posttransform,
  simulationController.handleControllerDataResponse
);

SimulationRouter.get('/download/variables/:id/:strategy_id',
  ensureApiAuthenticated,
  simulationController.getStrategies,
  integrationController.getDataIntegrations,
  integrationController.initializeStrategyForSimulationCompilation,
  transformController.pretransform,
  simulationController.downloadCSV
);

SimulationRouter.get('/download/case_docs/:id',
  simulationController.getFile,
  simulationController.getFileFromAWS
);

SimulationRouter.get('/download/case/:id',
  simulationController.createZipFile,
  simulationController.getCase,
  simulationController.generateDownloadCaseData,
  simulationController.addCSVtoZipFile,
  simulationController.downloadZipFile);

SimulationRouter.get('/batch/results/:id',
  ensureApiAuthenticated,
  simulationController.getBatch,
  transformController.posttransform,
  simulationController.handleControllerDataResponse
);

SimulationRouter.get('/batch/results/:id/:case_id',
  ensureApiAuthenticated,
  simulationController.getCase,
  transformController.posttransform,
  simulationController.handleControllerDataResponse
);

SimulationRouter.get('/individual/results',
  ensureApiAuthenticated,
  simulationController.getCases,
  transformController.posttransform,
  simulationController.handleControllerDataResponse);

SimulationRouter.delete('/individual/results/:id',
  ensureApiAuthenticated,
  simulationController.deleteCase,
  simulationController.handleControllerDataResponse
);

SimulationRouter.get('/individual/results/:id',
  ensureApiAuthenticated,
  simulationController.getCase,
  simulationController.getCaseApplication,
  transformController.posttransform,
  simulationController.handleControllerDataResponse
);

SimulationRouter.get('/individual/run',
  ensureApiAuthenticated,
  simulationController.getStrategies,
  transformController.posttransform,
  simulationController.handleControllerDataResponse);

SimulationRouter.get('/individual/run/:id',
  ensureApiAuthenticated,
  simulationController.getStrategies,
  simulationController.getCaseFromQuery,
  integrationController.getDataIntegrations,
  integrationController.initializeStrategyForSimulationCompilation,
  transformController.posttransform,
  simulationController.handleControllerDataResponse);

SimulationRouter.get('/individual/cases',
  ensureApiAuthenticated,
  simulationController.getIndividualDecisionCases,
  simulationController.handleControllerDataResponse
);

SimulationRouter.get('/batch/simulations',
  ensureApiAuthenticated,
  simulationController.getDecisionBatchSimulations,
  simulationController.handleControllerDataResponse);

SimulationRouter.get('/batch/results',
  ensureApiAuthenticated,
  simulationController.getBatchSimulations,
  transformController.posttransform,
  simulationController.handleControllerDataResponse);

SimulationRouter.post('/individual/run/:id', // Rules Engine
  ensureApiAuthenticated,
  organizationController.APIgetOrg,
  organizationController.checkOrganizationBalance,
  paymentController.setRequestTypeAndCost,
  transformController.pretransform,
  integrationController.getDataIntegrations,
  integrationController.getVMParsers,
  integrationController.assignVMParserToDataIntegrations,
  integrationController.initializeStrategyForSimulationCompilation,
  simulationController.fetchAllDocumentTemplatesFromAWS,
  simulationController.stageStrategyForSimulation,
  // apiController.createSimulationRequestRecord,
  simulationController.runIndividualSimulation,
  // apiController.updateSimulationRequestRecord,
  paymentController.stageProcessingTransactionForCreation,
  paymentController.addTransaction,
  simulationController.redirectSuccessfulIndividualSimulation);

SimulationRouter.get('/generate_bulk_upload_modal',
  ensureApiAuthenticated,
  transformController.pretransform,
  simulationController.handleControllerDataResponse);

SimulationRouter.get('/simulation_results/:id/download',
  simulationController.createZipFile,
  simulationController.getSimulationData,
  simulationController.getCasesFromSimulation,
  simulationController.generateDownloadData,
  simulationController.sortBatchResults,
  simulationController.addCSVtoZipFile,
  simulationController.downloadZipFile);

SimulationRouter.get('/download_variables/:id/:organization',
  simulationController.getTestCaseVariables,
  simulationController.downloadCSV);

SimulationRouter.get('/download_testcase_template/:id',
  apiController.getVariables,
  transformController.pretransform,
  simulationController.getTestCaseTemplate,
  simulationController.downloadCSV);

SimulationRouter.get('/download_analysis_table_data',
  simulationController.getSimulationDatas,
  transformController.posttransform,
  simulationController.downloadCSV);

SimulationRouter.get('/get_all_simulations',
  ensureApiAuthenticated,
  simulationController.returnAllSimulations,
  simulationController.handleControllerDataResponse);

SimulationRouter.get('/get_analysis_data',
  ensureApiAuthenticated,
  simulationController.generateResultDropdown,
  simulationController.handleControllerDataResponse);

SimulationRouter.get('/get_setup_data',
  ensureApiAuthenticated,
  simulationController.getStrategies,
  // simulationController.getSimulations,
  // simulationController.getBatchSimulations,
  transformController.posttransform,
  simulationController.handleControllerDataResponse);

SimulationRouter.get('/get_setup_data/:id',
  ensureApiAuthenticated,
  simulationController.getStrategies,
  // simulationController.getSimulations,
  // simulationController.getBatchSimulations,
  transformController.posttransform,
  simulationController.handleControllerDataResponse);

SimulationRouter.get('/test_cases/dropdown',
  ensureApiAuthenticated,
  simulationController.getCompiledStrategyDropdown,
  simulationController.handleControllerDataResponse);

SimulationRouter.get('/test_cases/:id',
  ensureApiAuthenticated,
  simulationController.getSingleTestCaseData,
  apiController.getVariables,
  simulationController.getPopulationTag,
  transformController.posttransform,
  simulationController.handleControllerDataResponse);

SimulationRouter.get('/test_cases',
  ensureApiAuthenticated,
  simulationController.getTestCasesData,
  transformController.posttransform,
  simulationController.handleControllerDataResponse);

SimulationRouter.get('/variable/:id/:variable/:value',
  ensureApiAuthenticated,
  simulationController.getSingleTestCaseData,
  apiController.getVariables,
  transformController.posttransform,
  simulationController.handleControllerDataResponse);

SimulationRouter.post('/compare_simulations',
  simulationController.fetchSimulationsData,
  transformController.posttransform,
  simulationController.handleControllerDataResponse);

// with population tags
// SimulationRouter.post('/run_simulation',
//   ensureApiAuthenticated,
//   transformController.pretransform,
//   simulationController.checkSimulation,
//   simulationController.checkActiveSimulation,
//   integrationController.getDataIntegrations,
//   integrationController.initializeStrategyForSimulationCompilation,
//   simulationController.getTestCasesData,
//   simulationController.registerSimulation,
//   simulationController.stageStrategyForSimulation,
//   simulationController.pullPopulationTags,
//   apiController.createSimulationRequestRecord,
//   simulationController.runBatchSimulations,
//   apiController.updateSimulationRequestRecord
// );

SimulationRouter.post('/batch/run', // Rules Engine Batch
  ensureApiAuthenticated,
  organizationController.APIgetOrg,
  organizationController.checkOrganizationBalance,
  paymentController.setRequestTypeAndCost,
  transformController.pretransform,
  simulationController.checkSimulation,
  simulationController.checkActiveSimulation,
  integrationController.getDataIntegrations,
  integrationController.initializeStrategyForSimulationCompilation,
  simulationController.fetchAllDocumentTemplatesFromAWS,
  simulationController.getTestCasesData,
  simulationController.registerSimulation,
  integrationController.getVMParsers,
  integrationController.assignVMParserToDataIntegrations,
  simulationController.stageStrategyForSimulation,
  simulationController.pullPopulationTags,
  // apiController.createSimulationRequestRecord,
  simulationController.coerceTestCases,
  simulationController.runBatchSimulations,
  paymentController.stageProcessingTransactionForCreation,
  paymentController.addTransaction,
  // apiController.updateSimulationRequestRecord
);

SimulationRouter.post('/test_case',
  ensureApiAuthenticated,
  apiController.getVariables,
  transformController.pretransform,
  simulationController.checkTestCasesLimit,
  simulationController.checkTestCaseVariables,
  simulationController.createPopulationTag,
  simulationController.createNewTestCase,
  simulationController.handleControllerDataResponse);

SimulationRouter.post('/bulk_upload',
  ensureApiAuthenticated,
  simulationController.getTestCasesCount,
  simulationController.bulkUploadTC);

SimulationRouter.post('/test_cases',
  ensureApiAuthenticated,
  apiController.getVariables,
  transformController.pretransform,
  simulationController.checkTestCasesLimit,
  simulationController.checkTestCaseVariables,
  simulationController.checkExistingTestCases,
  simulationController.createPopulationTags,
  simulationController.createNewTestCases,
  simulationController.handleControllerDataResponse);

SimulationRouter.post('/create_population_tag',
  ensureApiAuthenticated,
  simulationController.createPopulationTag,
  simulationController.handleControllerDataResponse);

SimulationRouter.put('/test_cases/:id',
  ensureApiAuthenticated,
  transformController.pretransform,
  apiController.getVariables,
  simulationController.getSingleTestCaseData,
  transformController.posttransform, //format req.body
  simulationController.checkTestCaseVariables,
  simulationController.updateTestCase,
  simulationController.handleControllerDataResponse);

SimulationRouter.put('/edit_variable',
  ensureApiAuthenticated,
  apiController.getVariables,
  simulationController.getSingleTestCaseData,
  simulationController.checkVariable,
  simulationController.editVariable,
  simulationController.updateTestCase,
  simulationController.handleControllerDataResponse);

SimulationRouter.delete('/delete_variable/:id/:variable',
  ensureApiAuthenticated,
  apiController.getVariables,
  simulationController.getSingleTestCaseData,
  simulationController.deleteVariable,
  simulationController.updateTestCase,
  simulationController.handleControllerDataResponse);

SimulationRouter.delete('/test_cases/:id',
  ensureApiAuthenticated,
  simulationController.deleteTestCase,
  simulationController.handleControllerDataResponse);

SimulationRouter.delete('/batch/results/:id',
  ensureApiAuthenticated,
  simulationController.deleteBatchSimulation,
  simulationController.handleControllerDataResponse);

SimulationRouter.delete('/simulation_results/:id',
  ensureApiAuthenticated,
  simulationController.deleteSimulation,
  simulationController.handleControllerDataResponse);

SimulationRouter.delete('/delete_bulk_testcases',
  ensureApiAuthenticated,
  simulationController.deleteBulkTestCases,
  simulationController.handleControllerDataResponse);

module.exports = SimulationRouter;

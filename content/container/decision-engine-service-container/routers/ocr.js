'use strict';

/** Routes for Simulation */

const periodic = require('periodicjs');
const controllers = require('../controllers');
const transformController = controllers.transform;
const utilities = require('../utilities');
const CONSTANTS = utilities.constants;
const optimizationController = controllers.optimization;
const ocrController = controllers.ocr;
const simulationController = controllers.simulation;
const integrationController = controllers.integration;
const organizationController = controllers.organization;
const paymentController = controllers.payment;
const apiController = controllers.api;
const standardControllers = utilities.standard_controllers.standardControllers();
const OcrRouter = periodic.express.Router();
const ensureApiAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.ensureApiAuthenticated;

OcrRouter.get('/templates',
  ensureApiAuthenticated,
  ocrController.getTemplates,
  transformController.posttransform,
  ocrController.handleControllerDataResponse);

OcrRouter.post('/templates',
  ensureApiAuthenticated,
  ocrController.checkExistingTemplateName,
  ocrController.createTemplate,
  ocrController.handleControllerDataResponse);

OcrRouter.put('/templates/upload_template',
  ensureApiAuthenticated,
  transformController.pretransform,
  simulationController.getUploadedOCRDocuments,
  ocrController.fileTypeCheck,
  ocrController.getTemplate,
  simulationController.createLocalPDF,
  simulationController.generateLocalImageFiles,
  ocrController.uploadTemplateToAWS,
  ocrController.updateTemplate,
  simulationController.clearTempPDFandImageFiles,
  ocrController.handleControllerDataResponse);

OcrRouter.get('/templates/:id/:page',
  ensureApiAuthenticated,
  ocrController.getTemplate,
  ocrController.getTemplateFromAWS,
  transformController.posttransform,
  ocrController.handleControllerDataResponse);

OcrRouter.put('/templates/:id/:page/fields',
  ensureApiAuthenticated,
  ocrController.getTemplate,
  transformController.pretransform,
  ocrController.updateTemplate,
  ocrController.handleControllerDataResponse);

OcrRouter.delete('/templates/:id/:page/fields/:idx',
  ensureApiAuthenticated,
  ocrController.getTemplate,
  transformController.pretransform,
  ocrController.updateTemplate,
  ocrController.handleControllerDataResponse);

OcrRouter.delete('/templates/:id',
  ensureApiAuthenticated,
  ocrController.deleteTemplate,
  ocrController.handleControllerDataResponse);

OcrRouter.get('/processing/individual/cases',
  ensureApiAuthenticated,
  ocrController.getCases,
  transformController.posttransform,
  ocrController.handleControllerDataResponse);

OcrRouter.get('/processing/batch/simulations',
  ensureApiAuthenticated,
  ocrController.getSimulations,
  transformController.posttransform,
  ocrController.handleControllerDataResponse);

OcrRouter.get('/processing/batch/:id/cases',
  ensureApiAuthenticated,
  ocrController.getSimulation,
  transformController.posttransform,
  ocrController.handleControllerDataResponse);

OcrRouter.get('/download/processing/individual/:id',
  ocrController.getCase,
  transformController.posttransform,
  ocrController.downloadCSV,
  ocrController.handleControllerDataResponse
);

OcrRouter.get('/download/processing/batch/:id',
  ocrController.getSimulation,
  transformController.posttransform,
  ocrController.downloadCSV,
  ocrController.handleControllerDataResponse
);

OcrRouter.get('/download_tutorial_data',
  ocrController.downloadTutorialData,
);

OcrRouter.get('/processing/individual',
  ensureApiAuthenticated,
  ocrController.getTemplates,
  transformController.posttransform,
  ocrController.handleControllerDataResponse
);

OcrRouter.get('/processing/batch',
  ensureApiAuthenticated,
  ocrController.getTemplates,
  ocrController.getSimulations,
  transformController.posttransform,
  ocrController.handleControllerDataResponse
);

OcrRouter.get('/processing/individual/:id',
  ensureApiAuthenticated,
  ocrController.getCase,
  transformController.posttransform,
  ocrController.handleControllerDataResponse
);

OcrRouter.get('/processing/batch/:id',
  ensureApiAuthenticated,
  ocrController.getSimulation,
  transformController.posttransform,
  ocrController.handleControllerDataResponse
);

OcrRouter.get('/processing/batch/:id/cases/:caseid',
  ensureApiAuthenticated,
  ocrController.getSimulationCase,
  transformController.posttransform,
  ocrController.handleControllerDataResponse
);

OcrRouter.put('/processing/batch/:id/cases/:caseid',
  ensureApiAuthenticated,
  ocrController.getSimulationCase,
  transformController.pretransform,
  ocrController.updateSimulationCase,
  ocrController.handleControllerDataResponse
);

OcrRouter.put('/processing/individual/:id',
  ensureApiAuthenticated,
  ocrController.getCase,
  transformController.pretransform,
  ocrController.updateCase,
  ocrController.handleControllerDataResponse
);

OcrRouter.post('/processing/individual', // OCR Individual
  ensureApiAuthenticated,
  organizationController.APIgetOrg,
  organizationController.checkOrganizationBalance,
  ocrController.getUploadedDocuments,
  ocrController.checkTemplateFieldsExist,
  ocrController.createLocalPDF,
  ocrController.generateLocalImageFiles,
  ocrController.getTemplate,
  ocrController.retrieveTextExtractionResults,
  paymentController.setRequestTypeAndCost,
  ocrController.cleanTextExtractionResults,
  ocrController.assignFieldsFromTextExtractionResults,
  ocrController.clearTempPDFandImageFiles,
  paymentController.stageProcessingTransactionForCreation,
  paymentController.addTransaction,
  ocrController.createCase,
  ocrController.handleControllerDataResponse);

OcrRouter.post('/processing/batch', //OCR Batch
  ensureApiAuthenticated,
  organizationController.APIgetOrg,
  organizationController.checkOrganizationBalance,
  ocrController.getUploadedDocuments,
  ocrController.checkTemplateFieldsExist,
  ocrController.createSimulation,
  ocrController.updateSimulationProgress,
  ocrController.createLocalPDF,
  ocrController.generateLocalImageFiles,
  ocrController.updateSimulationProgress,
  ocrController.getTemplate,
  ocrController.retrieveTextExtractionResults,
  paymentController.setRequestTypeAndCost,
  ocrController.updateSimulationProgress,
  ocrController.cleanTextExtractionResults,
  ocrController.assignFieldsFromTextExtractionResults,
  ocrController.updateSimulationProgress,
  ocrController.clearTempPDFandImageFiles,
  ocrController.createCases,
  paymentController.stageProcessingTransactionForCreation,
  paymentController.addTransaction,
  ocrController.updateSimulationProgress,
  ocrController.handleControllerDataResponse
);



module.exports = OcrRouter;

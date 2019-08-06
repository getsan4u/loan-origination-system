'use strict';

const periodic = require('periodicjs');
const APIRouter = periodic.express.Router();
const controllers = require('../controllers');
const LAPRouters = require('./lap/index.js');
const apiController = controllers.api;
const ocrController = controllers.ocr;
const authController = controllers.auth;
const clientController = controllers.client;
const fileController = controllers.file;
const paymentController = controllers.payment;
const optimizationController = controllers.optimization;
const mlController = controllers.ml;
const simulationController = controllers.simulation;
const organizationController = controllers.organization;
const integrationController = controllers.integration;
const losController = controllers.los;
const transformController = controllers.transform;
const isClientAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.isClientAuthenticated;
const ensureApiAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.ensureApiAuthenticated;

APIRouter.get('/api_tabs',
  ensureApiAuthenticated,
  apiController.getVariables,
  transformController.pretransform,
  organizationController.getOrg,
  apiController.apiTabs,
  apiController.sendResponse);

APIRouter.get('/download_request/:format/text_recognition/:id/:type',
  ensureApiAuthenticated,
  authController.adminOnly,
  clientController.getClientByOrg,
  apiController.apiDownload);

APIRouter.get('/download_request/:format/machine_learning/:id/:type',
  ensureApiAuthenticated,
  authController.adminOnly,
  clientController.getClientByOrg,
  mlController.getModel,
  transformController.posttransform,
  apiController.apiDownload);

APIRouter.get('/download_request/:format/rules_engine/:id/:type',
  ensureApiAuthenticated,
  authController.adminOnly,
  clientController.getClientByOrg,
  simulationController.getStrategies,
  integrationController.getDataIntegrations,
  integrationController.initializeStrategyForSimulationCompilation,
  transformController.posttransform,
  apiController.apiDownload);

APIRouter.get('/download_response/:format/:client_id',
  ensureApiAuthenticated,
  authController.adminOnly,
  apiController.apiTabs,
  apiController.apiDownload);

APIRouter.get('/hiddendata',
  ensureApiAuthenticated,
  organizationController.getOrg,
  apiController.hiddenData,
  apiController.sendResponse);

APIRouter.get('/download_api_modal',
  ensureApiAuthenticated,
  integrationController.getStrategies,
  mlController.getCompleteModels,
  transformController.posttransform,
  apiController.sendResponse);

APIRouter.post('/v2/ml_rules_engine',
  isClientAuthenticated,
  transformController.pretransform,
  organizationController.APIgetOrg,
  apiController.checkPublicKey,
  apiController.getApiStrategy,
  integrationController.getDataIntegrations,
  integrationController.getVMParsers,
  integrationController.assignVMParserToDataIntegrations,
  apiController.initializeStrategyForApiCompilation,
  // apiController.checkStrategyExists,
  paymentController.checkOrganizationStatus,
  paymentController.setRequestTypeAndCost,
  apiController.stageRequest,
  apiController.createAPIRequestRecord,
  apiController.fetchAllDocumentTemplatesFromAWS,
  // apiController.runCreditEngine,
  apiController.runApiProcessEngine,
  apiController.formatResponse,
  apiController.updateAPIRequestRecord,
  fileController.createFiles,
  paymentController.stageAPITransactionForCreation,
  paymentController.addTransaction,
  apiController.createCaseRecord,
  transformController.posttransform,
  apiController.sendResponse);

APIRouter.post('/v2/rules_engine_batch',
  isClientAuthenticated,
  transformController.pretransform,
  // (req, res, next) => {
  //   console.timeEnd('pretransform')
  //   console.time('APIgetOrg')
  //   next();
  // },
  organizationController.APIgetOrg,
  // (req, res, next) => {
  //   console.timeEnd('APIgetOrg')
  //   console.time('checkPublicKey')
  //   next();
  // },
  apiController.checkPublicKey,
  // (req, res, next) => {
  //   console.timeEnd('checkPublicKey')
  //   console.time('limitMaxStrategies')
  //   next();
  // },
  apiController.limitMaxStrategies,
  // (req, res, next) => {
  //   console.timeEnd('limitMaxStrategies')
  //   console.time('batchStageStrategies')
  //   next();
  // },
  apiController.batchStageStrategies,
  apiController.createBatchAPIRequestRecord,
  // (req, res, next) => {
  //   console.timeEnd('batchStageStrategies');
  //   console.time('getBatchAPIStrategies')
  //   next();
  // },
  apiController.getBatchAPIStrategies,
  // (req, res, next) => {
  //   console.timeEnd('getBatchAPIStrategies');
  //   console.time('generateRulesAndVariableMap')
  //   next();
  // },
  // (req, res, next) => {
  //   console.timeEnd('generateRulesAndVariableMap');
  //   console.time('batchInitializeStrategiesForCompilation')
  //   next();
  // },
  integrationController.getDataIntegrations,
  apiController.batchInitializeStrategiesForCompilation,
  // (req, res, next) => {
  //   console.timeEnd('batchInitializeStrategiesForCompilation');
  //   console.time('checkOrganizationStatus')
  //   next();
  // },
  paymentController.checkOrganizationStatus,
  // (req, res, next) => {
  //   console.timeEnd('checkOrganizationStatus')
  //   console.time('setRequestTypeAndCost')
  //   next();
  // },
  paymentController.setRequestTypeAndCost,
  // (req, res, next) => {
  //   console.timeEnd('setRequestTypeAndCost')
  //   console.time('batchRunAPIProcessEngine')
  //   next();
  // },
  // apiController.createBatchAPIRequestRecord,
  integrationController.getVMParsers,
  integrationController.assignVMParserToDataIntegrations,
  apiController.batchRunAPIProcessEngine,
  // (req, res, next) => {
  //   console.timeEnd('batchRunAPIProcessEngine')
  //   console.time('batchFormatResponse')
  //   next();
  // },
  apiController.batchFormatResponse,
  apiController.updateAPIRequestRecord,
  // (req, res, next) => {
  //   console.timeEnd('batchFormatResponse')
  //   console.time('stageAPITransactionForCreation')
  //   next();
  // },
  apiController.createCasesAndBatchRecord,
  paymentController.stageAPITransactionForCreation,
  // (req, res, next) => {
  //   console.timeEnd('stageAPITransactionForCreation')
  //   console.time('addTransaction')
  //   next();
  // },
  paymentController.addTransaction,
  // (req, res, next) => {
  //   console.timeEnd('addTransaction')
  //   console.time('posttransform')
  //   next();
  // },
  transformController.posttransform,
  // (req, res, next) => {
  //   console.timeEnd('posttransform')
  //   next();
  // },
  apiController.sendResponse);

APIRouter.post('/v2/machine_learning_batch',
  isClientAuthenticated,
  transformController.pretransform,
  organizationController.APIgetOrg,
  apiController.checkPublicKey,
  apiController.limitMaxStrategies,
  paymentController.checkOrganizationStatus,
  paymentController.setRequestTypeAndCost,
  apiController.createAPIMLBatchRequestRecord,
  mlController.batchGetModels,
  mlController.getBatchApiScoreAnalysisDocs,
  // apiController.batchMLVariableCheck,
  mlController.predictBatchMLCase,
  apiController.batchFormatMLResponse,
  paymentController.stageAPITransactionForCreation,
  paymentController.addTransaction,
  apiController.updateAPIRequestRecord,
  transformController.posttransform,
  apiController.sendResponse);

APIRouter.post('/v2/ml_models',
  isClientAuthenticated,
  organizationController.APIgetOrg,
  apiController.checkPublicKey,
  paymentController.checkOrganizationStatus,
  paymentController.setRequestTypeAndCost,
  transformController.pretransform,
  apiController.createAPIMLRequestRecord,
  mlController.getModelByName,
  mlController.getScoreAnalysisDocument,
  apiController.mlVariableCheck,
  mlController.predictSingleMLCase,
  paymentController.stageAPITransactionForCreation,
  paymentController.addTransaction,
  apiController.updateSimulationRequestRecord,
  transformController.posttransform,
  apiController.sendResponse);

APIRouter.post('/v2/ocr',
  ocrController.getUploadedDocuments,
  isClientAuthenticated,
  organizationController.APIgetOrg,
  ocrController.checkTemplateFieldsExist,
  ocrController.createLocalPDF,
  ocrController.generateLocalImageFiles,
  ocrController.getTemplate,
  ocrController.retrieveTextExtractionResults,
  paymentController.setRequestTypeAndCost,
  ocrController.cleanTextExtractionResults,
  ocrController.assignFieldsFromTextExtractionResults,
  ocrController.clearTempPDFandImageFiles,
  paymentController.stageAPITransactionForCreation,
  paymentController.addTransaction,
  apiController.formatIndividualOCRResponse,
  apiController.sendResponse);

APIRouter.post('/v2/docusign/:id',
  isClientAuthenticated,
  organizationController.APIgetOrg,
  losController.doc.saveSignedDocusign,
  losController.doc.createDocument,
  apiController.sendSuccess
);

APIRouter.post('/v2/ml_vision',
  isClientAuthenticated,
  organizationController.APIgetOrg,
  apiController.checkPublicKey,
  apiController.checkStrategyExists,
  paymentController.checkOrganizationStatus,
  paymentController.setRequestTypeAndCost,
  apiController.stageRequest,
  // apiController.createAPIRequestRecord,
  // apiController.fetchAllDocumentTemplatesFromAWS,
  // apiController.runCreditEngine,
  // apiController.formatResponse,
  // transformController.posttransform,
  // apiController.updateAPIRequestRecord,
  // fileController.createFiles,
  paymentController.stageAPITransactionForCreation,
  paymentController.addTransaction,
  apiController.sendResponse);

APIRouter.post('/v2/los/customers',
  isClientAuthenticated,
  transformController.pretransform,
  organizationController.APIgetOrg,
  apiController.checkPublicKey,
  losController.customer.createCustomer,
  losController.customer.updatePrimaryContact,
  // paymentController.checkOrganizationStatus,
  // paymentController.setRequestTypeAndCost,
  // paymentController.stageAPITransactionForCreation,
  // paymentController.addTransaction,
  apiController.sendResponse);

APIRouter.post('/v2/los/applications',
  isClientAuthenticated,
  organizationController.APIgetOrg,
  apiController.checkPublicKey,
  apiController.getLosProductByName,
  apiController.getLosApplicationLabelsByName,
  transformController.pretransform,
  apiController.createAPIApplication,
  // paymentController.checkOrganizationStatus,
  // paymentController.setRequestTypeAndCost,
  // paymentController.stageAPITransactionForCreation,
  // paymentController.addTransaction,
  apiController.sendResponse);

APIRouter.use('/v2/lap/applications', LAPRouters.ApplicationRouter);
APIRouter.use('/v2/lap/companies', LAPRouters.CompanyRouter);
APIRouter.use('/v2/lap/communications', LAPRouters.CommunicationRouter);
APIRouter.use('/v2/lap/documents', LAPRouters.DocumentRouter);
APIRouter.use('/v2/lap/intermediaries', LAPRouters.IntermediaryRouter);
APIRouter.use('/v2/lap/people', LAPRouters.PersonRouter);
APIRouter.use('/v2/rules_engine_results', LAPRouters.CaseRouter);
APIRouter.use('/v2/lap/tasks', LAPRouters.TaskRouter);
APIRouter.put('/v2/los/applications/:id',
  isClientAuthenticated,
  organizationController.APIgetOrg,
  apiController.checkPublicKey,
  apiController.updateApplication,
  apiController.sendResponse);

module.exports = APIRouter;
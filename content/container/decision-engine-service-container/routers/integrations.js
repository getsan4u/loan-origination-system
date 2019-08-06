'use strict';

/** Routes for integration page */

const periodic = require('periodicjs');
const controllers = require('../controllers');
const apiController = controllers.api;
const integrationController = controllers.integration;
const simulationController = controllers.simulation;
const authController = controllers.auth;
const transformController = controllers.transform;
const IntegrationRouter = periodic.express.Router();
const ensureApiAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.ensureApiAuthenticated;

IntegrationRouter.get('/get_strategies',
  ensureApiAuthenticated,  
  integrationController.getStrategies,
  transformController.posttransform,
  authController.handleControllerDataResponse);

IntegrationRouter.get('/download_docusign_instructions',
  ensureApiAuthenticated,  
  integrationController.downloadDocusignInstructions,
  authController.handleControllerDataResponse);

IntegrationRouter.get('/get_dataintegrations',
  ensureApiAuthenticated,  
  integrationController.getDataIntegrations,
  transformController.posttransform,
  authController.handleControllerDataResponse);

IntegrationRouter.get('/get_docusign_credentials',
  ensureApiAuthenticated,
  integrationController.getDocusignCredentials,
  authController.handleControllerDataResponse);

IntegrationRouter.put('/update_docusign_credentials',
  ensureApiAuthenticated,
  integrationController.updateDocusignCredentials,
  authController.handleControllerDataResponse);

IntegrationRouter.get('/get_dataintegrations/:id',
  ensureApiAuthenticated,  
  apiController.getVariables,
  integrationController.getDataIntegration,
  transformController.posttransform,
  authController.handleControllerDataResponse);

IntegrationRouter.put('/update_status/:id',
  ensureApiAuthenticated,
  integrationController.getDataIntegration,
  integrationController.flipStatus,
  integrationController.updateDataIntegration,
  authController.handleControllerDataResponse);

IntegrationRouter.put('/update_credentials/:id',
  ensureApiAuthenticated,
  authController.adminOnly,
  integrationController.getDataIntegration,
  transformController.pretransform,
  integrationController.updateCredentials,
  integrationController.updateDataIntegration,
  authController.handleControllerDataResponse);

IntegrationRouter.put('/edit_variables/:id',
  ensureApiAuthenticated,
  integrationController.getDataIntegration,
  transformController.pretransform,
  integrationController.checkVariables,
  integrationController.updateDataIntegration,
  authController.handleControllerDataResponse);

IntegrationRouter.post('/activate',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  integrationController.getStrategies,
  integrationController.checkStrategies,
  integrationController.activateStrategies,
  integrationController.updateRedisRules,
  // integrationController.getDataIntegrations,
  // integrationController.initializeStrategyForCompilation,
  // integrationController.lockStrategyDependencies,
  // integrationController.reloadCreditEngine,
  authController.handleControllerDataResponse);

IntegrationRouter.post('/upload_security_cert/:id',
  ensureApiAuthenticated,
  integrationController.uploadSecurityCert,
  integrationController.updateDataIntegration,
  authController.handleControllerDataResponse);

module.exports = IntegrationRouter;
'use strict';

const periodic = require('periodicjs');
const pluralize = require('pluralize');
const url = require('url');
const util = require('util');
const DecisionRouter = periodic.express.Router();
const utilities = require('../utilities');
const CONSTANTS = utilities.constants;
const controllers = require('../controllers');
const transformController = controllers.transform;
const simulationController = controllers.simulation;
const mlController = controllers.ml;
const integrationController = controllers.integration;
const authController = controllers.auth;
const apiController = controllers.api;
const DECISION_MODELS = CONSTANTS.DECISION_MODELS;
const standardControllers = utilities.standard_controllers.standardControllers();
const strategyController = require('../controllers').overrides.standard_strategy;
const ruleController = require('../controllers').overrides.standard_rule;
const decisionController = require('../controllers/decision');
const runRuleVariableUpdateCron = require('../crons/update_rules_variables.cron')(periodic);
const ensureApiAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.ensureApiAuthenticated;

DecisionRouter.post('/api/add_document_template',
  ensureApiAuthenticated,
  decisionController.getUploadedDocumentTemplate,
  transformController.posttransform,
  decisionController.handleControllerDataResponse
);

DecisionRouter.get('/api/download_variable_template', decisionController.getVariableTemplate, simulationController.downloadCSV);

DecisionRouter.get('/api/download_standard_rules_template',
  decisionController.getCurrentRulesSegment,
  transformController.posttransform,
  mlController.downloadCSV);

DecisionRouter.get('/api/download_document_template/:filename', decisionController.downloadDocumentTemplate);

DecisionRouter.get('/api/standard_strategies/:id/export_strategy',
  integrationController.initializeStrategyForSimulationCompilation,
  decisionController.handleStrategyExport);

DecisionRouter.use('/api', ensureApiAuthenticated, decisionController.checkAssociatedOrganization);

DecisionRouter.get('/api/:collection/:id/changelog', transformController.posttransform, decisionController.handleControllerDataResponse);

DecisionRouter.get('/api/variable_dropdown',
  ensureApiAuthenticated,
  decisionController.fetchVariableDropdown
);

DecisionRouter.post('/api/upload_csv_segment',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  decisionController.getCurrentRulesSegment,
  decisionController.getUploadedRulesCSV,
  transformController.pretransform,
  decisionController.createRules,
  decisionController.updateStrategyWithNewRules,
  decisionController.handleStrategyVariableDependencies,
  decisionController.setQueryForRuleAndVariableCron,
  runRuleVariableUpdateCron,
  decisionController.handleControllerDataResponse);

DecisionRouter.post('/api/variables',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  apiController.getVariables,
  transformController.pretransform,
  decisionController.checkExistingVariables,
  decisionController.createNewVariables,
  decisionController.setQueryForRuleAndVariableCron,
  runRuleVariableUpdateCron,
  decisionController.handleControllerDataResponse);

DecisionRouter.get('/api/standard_strategies/:id/changelogs/:logid',
  strategyController.getChangeLog,
  transformController.posttransform,
  decisionController.handleControllerDataResponse);

DecisionRouter.get('/api/standard_strategies/:id/changelogs',
  strategyController.getChangeLogs,
  transformController.posttransform,
  decisionController.handleControllerDataResponse);


DecisionRouter.get('/api/standard_strategies/:id/versions',
  strategyController.getStrategyVersions,
  transformController.posttransform,
  decisionController.handleControllerDataResponse);

DecisionRouter.get('/api/standard_strategies/:id/general_info',
  strategyController.getStrategy,
  transformController.posttransform,
  decisionController.handleControllerDataResponse);

DecisionRouter.get('/api/standard_strategies/:id/update_history',
  transformController.pretransform,
  strategyController.getStrategies,
  transformController.posttransform,
  decisionController.handleControllerDataResponse);

DecisionRouter.get('/api/standard_strategies/:id/copyModule', transformController.pretransform, strategyController.getStrategies, transformController.posttransform, decisionController.handleControllerDataResponse);

DecisionRouter.get('/api/standard_strategies/:id/addSegment', strategyController.getStrategy, transformController.posttransform, decisionController.handleControllerDataResponse);

DecisionRouter.get('/api/standard_strategies/required_model_variables/:id', apiController.getVariables, strategyController.getStrategy, transformController.posttransform, decisionController.handleControllerDataResponse)

DecisionRouter.get('/api/standard_strategies/:id/:type/createRule',
  transformController.pretransform,
  decisionController.getInitCreateFormData);

DecisionRouter.put('/api/standard_rules/:id',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  transformController.pretransform,
  decisionController.update,
  decisionController.handleControllerDataResponse);

DecisionRouter.put('/api/standard_strategies/:id/:name/:segment_index/createRule',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  transformController.pretransform,
  ruleController.createRule,
  transformController.posttransform,
  strategyController.update);

DecisionRouter.put('/api/standard_strategies/:id/*',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  transformController.pretransform,
  strategyController.update);

DecisionRouter.get('/api/standard_strategies/:id/:type/copySegment',
  transformController.pretransform, strategyController.getStrategies, transformController.posttransform, decisionController.handleControllerDataResponse);

DecisionRouter.post('/api/standard_strategies/:id/:name/:segment_index/createRule',
  ensureApiAuthenticated,
  authController.checkReadOnlyUser,
  transformController.pretransform,
  strategyController.initialCreateRuleModal
);

for (let modelcontroller of periodic.datas.keys()) {
  if (DECISION_MODELS.indexOf(modelcontroller) > -1) {
    DecisionRouter.use('/api',
      decisionController.addOrganizationToQuery,
      authController.checkReadOnlyUser,
      standardControllers.get(modelcontroller).router);
  }
}

DecisionRouter.get('/api/standard_strategies/:id/:type', transformController.pretransform, transformController.posttransform, decisionController.handleControllerDataResponse);

DecisionRouter.get('/dashboard/strategies', ensureApiAuthenticated, decisionController.fetchDashboardStrategyData);

DecisionRouter.get('/dashboard/changes', ensureApiAuthenticated, decisionController.fetchDashboardChangeData);

DecisionRouter.get('/pagedata', decisionController.formatPageData);
DecisionRouter.get('/moduledata',
  ensureApiAuthenticated,
  decisionController.getModuleDropdowns, decisionController.handleControllerDataResponse
);

module.exports = DecisionRouter;
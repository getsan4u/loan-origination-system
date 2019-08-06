'use strict';
const periodic = require('periodicjs');
const decision = require('./decision');
const api = require('./api');
const url = require('url');
const auth = require('./auth');
const integrations = require('./integrations');
const organization = require('./organization');
const simulation = require('./simulation');
const user = require('./user');
const optimization = require('./optimization');
const ocr = require('./ocr');
const ml = require('./ml');
const los = require('./los');
const lap = require('./lap');
const util = require('util');
const helper = require('../utilities').controllers.helper;
const unflatten = require('flat').unflatten;

module.exports = {
  GET: {
    '/decision/api/:collection': [
      decision.generateIndexModelQuery,
    ],
    '/auth/reset_token/:token': [
      auth.putTokenOnForm,
    ],
    '/optimization/api/download_analysisdata': [
      optimization.formatTableForDownload,
    ],
    '/api/api_tabs': [
      api.reformatVariables,
      api.populateUniqueVariables,
    ],
    '/decision/api/standard_strategies/:id/:type/createRule': [
      decision.strategy.generateVariableDropdown,
      decision.generateSystemVariableDropdown,
    ],
    '/decision/api/*': [
      decision.checkEntityExists,
      api.populateUniqueVariables,
    ],
    '/ml/api/models/data_source_progress': [
      ml.setModelIdFromURL,
    ],
    '/optimization/api/mlmodels/:id': [
      decision.getVariableMap,
    ],
    '/simulation/api/download_testcase_template/:id': [
      api.reformatVariables,
      api.populateUniqueVariables,
      simulation.assignExampleValue,
    ],
    '/simulation/api/download/variables/:id/:strategy_id': [
      simulation.getStrategyInputVariables,
      api.reformatVariables,
      api.populateUniqueVariables,
      simulation.assignExampleValue,
      simulation.assignDownloadCsvData,
    ],
    '/simulation/api/generate_bulk_upload_modal': [
      simulation.generateBulkUploadModal,
    ],
    '/user/get_user_info': [
      user.formatUser,
    ],
    '/user/get_user_info/:id': [
      user.formatUser,
    ],
  },
  POST: {
    '/auth/organization/new': [
      auth.transformEmailtoLowerCase,
      auth.orgTrimWhitespace,
    ],
    '/auth/change_email': [
      auth.transformEmailtoLowerCase,
    ],
    '/auth/resend_email': [
      auth.addEmailToBody,
    ],
    '/auth/login': [
      auth.transformEmailtoLowerCase,
      auth.orgTrimWhitespace,
    ],
    '/auth/forgot_password': [
      auth.transformEmailtoLowerCase,
      auth.orgTrimWhitespace,
    ],
    '/decision/api/standard_rules': [
      decision.rule.unflattenReqBody,
      decision.rule.stageRuleReqBodyForCreate,
      decision.rule.populateRuleRequiredVariables,
    ],
    '/decision/api/standard_strategies/:id/:name/:segment_index/createRule': [
      decision.strategy.generateVariableDropdown,
    ],
    '/decision/api/standard_strategies': [
      decision.strategy.createRuleCopies,
      decision.strategy.stageStrategyReqBody,
    ],
    '/decision/api/upload_csv_segment': [
      decision.variable.generateVariableTitleMap,
      decision.rule.generateRuleObjectsForCreate,
    ],
    '/auth/reset_password/:token': [
      auth.confirmPassword,
    ],
    '/decision/api/standard_variables': [
      decision.variable.restrictedVariableCheck,
      decision.variable.stageVariableReqBody,
    ],
    '/decision/api/variables': [
      decision.variable.uploadBulkVariables,
      decision.variable.formatVariableName,
      decision.variable.checkVariables,
      decision.variable.restrictedVariableCheck,
    ],
    '/optimization/api/data_source': [
      optimization.readCSVDataSource,
      optimization.generatePredictorVariableStatistics,
      optimization.transformDataSourceProviders,
      // optimization.generateVariableNameMap,
      // optimization.uploadMultipleProviderDataSources,
      // optimization.uploadSplitFilesToS3,
      // optimization.generateMLAssets,
    ],
    '/ml/api/models/:id/data_source': [
      ml.formatDataTypeColumns,
      ml.countColumnUniqueValues,
      ml.generatePredictorVariableStatistics,
    ],
    '/ml/api/initialize_new_model': [
      ml.checkIfDuplicateNameAndOrg,
    ],
    '/simulation/api/test_case': [
      api.reformatVariables,
      simulation.formatTestCaseName,
      api.populateUniqueVariables,
      simulation.assignExampleValue,
      simulation.formatPopulationTags,
    ],
    '/simulation/api/test_cases': [
      api.reformatVariables,
      simulation.uploadBulkTestCases,
      simulation.formatTestCaseName,
      simulation.checkTestCasesNamesInCSV,
      api.populateUniqueVariables,
      simulation.assignExampleValue,
    ],
    '/simulation/api/process_ocr_documents': [
      simulation.stageStrategyCompilation,
    ],
    // with population tags
    // '/simulation/api/run_simulation': [
    //   decision.variable.generateVariableTitleMap,
    //   simulation.setupStrategyAndTestCases,
    // ],
    '/simulation/api/individual/run/:id': [
      decision.variable.generateVariableTitleMap,
      simulation.setupStrategyAndIndividualCase,
    ],
    '/simulation/api/batch/run': [
      decision.variable.generateVariableTitleMap,
      simulation.setupStrategyAndTestCases,
    ],
    '/optimization/api/ml_model': [
      decision.getVariableSystemNameToIdMap,
    ],
    '/optimization/api/individual/run/:id': [
      optimization.formatIndividualMLInputs,
    ],
    '/api/v2/ml_rules_engine': [
      api.removeWhitespaceCharacters,
      optimization.stageMLRequest,
    ],
    '/api/v2/rules_engine_batch': [
      api.removeWhitespaceCharacters,
    ],
    '/api/v2/ml_models': [
      api.removeWhitespaceCharacters,
      ml.stageMLRequest,
    ],
    '/api/v2/machine_learning_batch': [
      api.removeWhitespaceCharacters,
      ml.stageBatchMLRequest,
    ],
    '/api/v2/lap/applications': [
      lap.formatNewApplicationRequest,
    ],
    '/api/v2/lap/people': [
      lap.formatNewPersonRequest,
    ],
    '/api/v2/lap/companies': [
      lap.formatNewCompanyRequest,
    ],
    '/user/new_user': [
      user.lowercaseEmail,
    ],
    '/los/api/applications': [
      los.formatCreateApplication,
    ],
    '/los/api/tasks': [
      los.formatCreateTask,
    ],
    '/api/v2/los/applications': [
      api.formatApplicationForCreate,
    ],
    '/los/api/applications/:id/run_automation/decision/:strategy': [
      decision.variable.generateVariableTitleMap,
      simulation.setupStrategyAndIndividualCase,
    ],
  },
  PUT: {
    // create new module
    '/decision/api/standard_strategies/:id/modules': [
      decision.checkLocked,
      decision.rule.createInitialRule,
      decision.getVariableSystemNameToIdMap,
      decision.strategy.stageStrategyDecisionProcessUpdate,
      // decision.strategy.updateMlAndVariableDependencies,
    ],
    // create new rule and add to strategy segment
    '/decision/api/standard_strategies/:id/:name/:segment_index/createRule': [
      decision.checkLocked,
      decision.strategy.checkIfValidJavaScript,
      decision.strategy.generateInputVariableMap,
      decision.rule.getVariableMap,
      decision.rule.unflattenReqBody,
      decision.rule.stageRuleReqBodyForUpdate,
    ],
    '/decision/api/standard_strategies/:id/:name/:segment_index': [
      decision.checkLocked,
    ],
    '/decision/api/standard_rules/:id': [
      decision.rule.getRule,
      decision.rule.checkStrategyLocked,
      decision.strategy.checkIfValidJavaScript,
      decision.strategy.generateInputVariableMap,
      decision.rule.getVariableMap,
      decision.rule.unflattenReqBody,
      decision.rule.stageRuleReqBodyForUpdate,
    ],
    // copy ruleset, copy module
    '/decision/api/standard_strategies/:id': [
      decision.checkLocked,
      decision.strategy.createRuleCopies,
      decision.rule.createInitialRule,
    ],
    // delete module
    '/decision/api/standard_strategies/:id/:module_name': [
      decision.checkLocked,
    ],
    // delete segment and delete rule
    '/decision/api/standard_strategies/:id/segments/:type/:index': [
      decision.checkLocked,
      decision.strategy.checkSegmentLength,
    ],
    '/simulation/api/test_cases/:id': [
      simulation.uploadBulkTestCases,
      simulation.formatPopulationTags,
    ],
    '/integrations/edit_variables/:id': [
      integrations.formatRequiredVariables,
    ],
    '/user/update_user/:id': [
      user.formatUser,
    ],
    '/integrations/update_credentials/:id': [
      integrations.formatCredentialsBody,
    ],
    '/ocr/api/templates/:id/:page/fields': [
      ocr.formatTemplateFieldForUpdate,
    ],
    '/optimization/api/documents/:id/:page/edit_variable/:input': [
      optimization.formatDocumentVariableForUpdate,
    ],
    // '/optimization/api/documents/:id/:page/delete_variable/:input': [
    //   optimization.formatDocumentVariableForDelete,
    // ],
    // '/optimization/api/upload_ocr_template': [
    //   optimization.formatOCRTemplateUploadRequest,
    // ],
    '/ocr/api/templates/upload_template': [
      ocr.formatTemplateUploadRequest,
    ],
    '/ocr/api/processing/individual/:id': [
      ocr.formatIndividualCaseDocForUpdate,
    ],
    '/ocr/api/processing/batch/:id/cases/:caseid': [
      ocr.formatBatchCaseDocForUpdate,
    ],
    '/organization/update_org_info': [
      organization.stageInfoForUpdate,
    ],
    '/ml/api/models/:id': [
      ml.stageModelSelection,
    ],
    '/los/api/applications/:id': [
      los.formatApplicationDataForUpdate,
    ],
    '/los/api/customers/companies/:id': [
      los.formatApplicationDataForUpdate,
    ],
    '/los/api/customers/people/:id': [
      los.formatPersonDataForUpdate,
    ],
    '/los/api/docs/:id': [
      los.formatDocumentDataForUpdate,
    ],
    '/los/api/docs/:id/edit_file': [
      los.formatDocumentDataForUpdate,
    ],
    '/los/api/applications/:id/cases/:caseid/output_variables/': [
      los.addOutputVariableToApplicationInfo,
    ],
    '/api/v2/lap/applications/:id': [
      lap.formatUpdateApplicationRequest,
      lap.formatPatchApplicationRequest,
    ],
    '/api/v2/lap/people/:id': [
      lap.formatUpdatePersonRequest,
      lap.formatPatchPersonRequest,
    ],
    '/api/v2/lap/companies/:id': [
      lap.formatUpdateCompanyRequest,
      lap.formatPatchCompanyRequest,
    ],
    '/api/v2/lap/intermediaries/:id': [
      lap.formatUpdateIntermediaryRequest,
      lap.formatPatchIntermediaryRequest,
    ],
    '/api/v2/lap/communications/:id': [
      lap.formatUpdateCommunicationRequest,
      lap.formatPatchCommunicationRequest,
    ],
    '/api/v2/lap/tasks/:id': [
      lap.formatUpdateTaskRequest,
      lap.formatPatchTaskRequest,
    ],
    '/api/v2/rules_engine_results/individual/:id': [
      lap.formatUpdateRulesEngineIndividualResult,
    ],
    '/api/v2/rules_engine_results/batch/:id': [
      lap.formatUpdateRulesEngineBatchResult,
    ],
  },
  DELETE: {
    '/decision/api/standard_strategies/:id': [
      decision.checkLocked,
      decision.assignNewLatestVersion,
      decision.deleteStrategyFromVariables,
    ],
    '/decision/api/standard_variables/:id': [
      decision.checkDependency,
      decision.assignNewLatestVersion,
    ],
    '/ocr/api/templates/:id/:page/fields/:idx': [
      ocr.deleteFieldFromTemplate,
    ],
  },
};
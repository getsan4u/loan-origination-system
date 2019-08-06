'use strict';
const periodic = require('periodicjs');
const url = require('url');
const api = require('./api');
const auth = require('./auth');
const decision = require('./decision');
const organization = require('./organization');
const simulation = require('./simulation');
const integrations = require('./integrations');
const optimization = require('./optimization');
const los = require('./los');
const lap = require('./lap');
const ml = require('./ml');
const ocr = require('./ocr');
const payment = require('./payment');
const pagegenerator = require('./pagegenerator');

module.exports = {
  GET: {
    '/decision/api/standard_strategies/:id/addSegment': [
      decision.strategy.getModuleDropdown,
    ],
    '/decision/api/standard_strategies/:id/:type/copySegment': [
      decision.strategy.filterCurrentSegment,
      decision.strategy.generateStrategySegmentDropdown,
    ],
    '/decision/api/standard_strategies/:id/copyModule': [
      decision.strategy.generateStrategyModuleDropdown,
    ],
    '/decision/api/standard_strategies/required_model_variables/:id': [
      decision.strategy.generateVariableFormOptions,
      decision.strategy.generateRequiredMLVariablesModal,
      decision.strategy.generateReceivedMLVariablesModal,
      decision.strategy.generateRequiredIntegrationVariablesModal,
      decision.strategy.generateReceivedIntegrationVariablesModal,
      decision.strategy.generateDocumentCreationVariablesModal,
    ],
    '/decision/api/:collection/:id/changelog': [
      decision.populateAllVariablesMap,
      decision.populateBeforeAfterChanges,
      decision.checkIfEntityDeleted,
      decision.strategy.generateRuleMap,
      decision.strategy.generateVariableMap,
      decision.strategy.generateUpdateHistoryDetail,
      decision.populateBeforeAfterVariableMap,
      decision.rule.generateRuleUpdateHistoryForm,
      decision.variable.formatRequiredVariablesList,
    ],
    //process_flow change_type
    '/decision/api/standard_strategies/:id/changelogs/:logid': [
      decision.formatStrategyChangeLogDetails,
      decision.checkIfEntityDeleted,
      decision.strategy.generateUpdateHistoryDetail,
    ],
    '/decision/api/standard_strategies/:id/versions': [
      decision.generateVersionTable,
    ],
    '/decision/api/standard_strategies/:id/changelogs': [
      decision.generateChangeLogTable,
    ],
    '/decision/api/standard_strategies/:id/general_info': [
      decision.strategy.formatStrategyGeneralInfo,
    ],
    '/decision/api/standard_strategies/:id/:type': [
      decision.strategy.generateRuleDropdown,
    ],
    '/decision/api/standard_strategies/:id': [
      decision.formatVersionAndStatus,
      decision.strategy.generateOutputVariablesOptions,
      decision.populateAllVariablesMap,
      decision.strategy.populateSegment,
      decision.strategy.populateArtificialIntelligenceAndDataIntegrationSegment,
      decision.strategy.formatModuleRunOrder,
    ],
    '/decision/api/standard_rules/:id': [
      decision.strategy.populateRequiredCalculationVariables,
      decision.rule.generateVariableDropdown,
      decision.rule.getVariableMap,
      decision.rule.formatRuleDetail,
      decision.setCalculationVariableDropdown,
    ],
    '/decision/api/standard_variables/:id': [
      decision.formatVersionAndStatus,
      decision.generateVersionTable,
      decision.variable.generateVariableDropdown,
      // decision.variable.formatVariableDetail,
    ],
    '/decision/api/download_standard_rules_template': [
      decision.getVariableMap,
      decision.rule.prepareCSVContentForDownload,
    ],
    '/decision/api/:collection': [
      decision.formatStatus,
      decision.rule.generateVariableDropdown,
    ],
    '/ml/api/models': [
      ml.formatModelIndexRows,
    ],
    '/ml/api/model/:id/select_type': [
      ml.setDefaultModelType,
    ],
    '/ml/api/models/:id/model_selection': [
      ml.formatModelSelectionPage,
      ml.generateModelSelectionForm,
      ml.setModelHeader,
    ],
    '/ml/api/models/:id/analysis_charts/:idx': [
      ml.setModelHeader,
      ml.stageAnalysisChartLayout,
    ],
    '/ml/api/model/:id/review_and_train': [
      ml.formatDataFields,
    ],
    '/ml/api/models/:id/input_data': [
      ml.formatDataFields,
      ml.generateInputDataForm,
      ml.setModelHeader,
    ],
    '/simulation/api/get_setup_data': [
      simulation.generateStrategyDropdown,
      // simulation.formatSimulationResults,
      // simulation.formatBatchCasesIndex,
      simulation.formatBatchResultsData,
      simulation.createSimulationPage,
      simulation.deleteTestCasesModal,
      pagegenerator.processingBatchRun,
    ],
    '/simulation/api/get_setup_data/:id': [
      simulation.generateStrategyDropdown,
      // simulation.formatSimulationResults,
      simulation.formatBatchResultsData,
      // simulation.formatBatchCasesIndex,
      simulation.createSimulationPage,
      simulation.deleteTestCasesModal,
    ],
    '/simulation/api/test_cases/:id': [
      api.reformatVariables,
      simulation.formatTestCaseDetail,
      simulation.testcaseTabs,
    ],
    '/simulation/api/test_cases': [
      simulation.testcasesPage,
    ],
    '/simulation/api/get_documentocr_dropdown': [
      simulation.formatOCRDocumentsDropdown,
    ],
    '/simulation/api/download_analysis_table_data': [
      simulation.formatSimulationSummaryData,
      simulation.formatSimulationTableDataForExport,
    ],
    '/simulation/api/variable/:id/:variable/:value': [
      api.reformatVariables,
      simulation.generateVariablesDropdown,
      simulation.addVariableModal,
      simulation.editVariableModal,
    ],
    '/simulation/api/individual/run': [
      simulation.generateIndividualRunProcessPage,
      pagegenerator.processingIndividualRun,
    ],
    '/simulation/api/individual/run/:id': [
      simulation.generateIndividualRunProcessPage,
      simulation.clearExtraData,
    ],
    '/simulation/api/individual/results/:id': [
      decision.variable.generateVariableTitleMap,
      simulation.generateIndividualResultsDetailPage,
      pagegenerator.processingIndividualDetail,
    ],
    '/simulation/api/batch/results/:id/:case_id': [
      decision.variable.generateVariableTitleMap,
      simulation.generateBatchCaseResultsDetailPage,
    ],
    '/simulation/api/individual/results': [
      simulation.formatCasesIndex,
    ],
    '/simulation/api/download/case_docs/:id': [
      simulation.downloadCaseDocumentFile,
    ],
    '/simulation/api/batch/results': [
      simulation.formatBatchResultsData,
    ],
    '/simulation/api/batch/results/:id': [
      simulation.generateBatchResultsDetailPage,
      pagegenerator.processingBatchDetail,
    ],
    '/organization/get_org': [
      organization.formatUsers,
    ],
    '/organization/get_activity_log': [
      organization.formatActivityLogs,
    ],
    '/organization/:id/download_activity_log': [
      organization.formatActivityLogs,
    ],
    '/api/download_request/:format/rules_engine/:id/:type': [
      api.reformatVariables,
      api.populateUniqueVariables,
    ],
    '/api/download_request/:format/machine_learning/:id/:type': [
      api.reformatMLVariables,
      api.populateUniqueVariables,
    ],
    '/api/download_api_modal': [
      api.APIRequestModal,
    ],
    '/integrations/get_dataintegrations/:id': [
      integrations.transformDataIntegration,
      integrations.overviewPage,
    ],
    '/integrations/get_dataintegrations': [
      integrations.transformDataIntegrations,
    ],
    '/integrations/get_strategies': [
      integrations.generateActivationManifest,
    ],
    // '/optimization/api/get_documents/:id/:page': [
    //   optimization.formatDocument,
    //   optimization.formatOCRDetailPage,
    // ],
    '/ocr/api/templates/:id/:page': [
      ocr.formatTemplate,
      ocr.formatTemplateDetailPage,
    ],
    '/optimization/api/documents/get_document_editmodal/:id': [
      decision.strategy.generateVariableFormOptions,
      decision.strategy.generateDocumentOCRVariablesModal,
    ],
    '/optimization/api/individual/results/:id': [
      optimization.generateIndividualMLResultsDetailPage,
    ],
    '/optimization/api/batch/results/:id': [
      optimization.generateBatchMLResultsDetailPage,
    ],
    '/optimization/api/batch/results/:id/cases': [
      optimization.formatBatchCasesTable,
    ],
    '/optimization/api/download/case/:id': [
      optimization.formatMLCaseCSV,
    ],
    '/optimization/api/download/mlbatch/:id': [
      optimization.formatMLBatchSimulationCSV,
    ],
    '/ocr/api/templates': [
      ocr.formatTemplates,
    ],
    '/optimization/api/mlmodels/:id': [
      optimization.formatModelPage,
    ],
    '/optimization/api/datasources/:id': [
      optimization.formatDataSourcePage,
    ],
    '/optimization/api/documents/:id/:page/edit_variable/:input': [
      optimization.getInputFromDocument,
      optimization.formatAddOCRVariableModal,
    ],
    '/optimization/api/individual/run': [
      optimization.generateMLIndividualRunProcessPage,
    ],
    '/optimization/api/individual/run/:id': [
      optimization.generateMLIndividualRunProcessPage,
    ],
    '/ml/api/individual/run': [
      ml.filterCompleteModels,
      ml.generateMLIndividualRunProcessPage,
      pagegenerator.processingIndividualRun,
    ],
    '/ml/api/individual/run/:id': [
      ml.filterCompleteModels,
      ml.generateMLIndividualRunProcessPage,
      pagegenerator.processingIndividualDetail,
    ],
    '/ml/api/individual/results/:id': [
      ml.generateIndividualMLResultsDetailPage,
      pagegenerator.processingIndividualDetail,
    ],
    '/ml/api/batch/run': [
      ml.filterCompleteModels,
      ml.generateMLBatchRunProcessPage,
      pagegenerator.processingBatchRun,
    ],
    '/ml/api/batch/run/:id': [
      ml.filterCompleteModels,
      ml.generateMLBatchRunProcessPage,
      pagegenerator.processingBatchDetail,
    ],
    '/ml/api/download_ml_template/:id': [
      ml.stageMLModelTemplateDownload,
    ],
    '/ml/api/batch/results/:id': [
      ml.generateBatchMLResultsDetailPage,
      pagegenerator.processingBatchDetail,
    ],
    '/ml/api/batch/results/:id/cases': [
      ml.formatBatchCasesTable,
      pagegenerator.processingBatchDetail,
    ],
    '/ml/api/download/case/:id': [
      optimization.formatMLCaseCSV,
    ],
    '/ml/api/download/mlbatch/:id': [
      ml.formatMLBatchSimulationCSV,
    ],
    '/optimization/api/batch/run': [
      optimization.generateMLBatchRunProcessPage,
    ],
    '/optimization/api/batch/run/:id': [
      optimization.generateMLBatchRunProcessPage,
    ],
    '/optimization/api/download_ml_template/:id': [
      optimization.stageMLModelTemplateDownload,
    ],
    '/ocr/api/processing/individual': [
      ocr.formatIndividualRunProcessPage,
      pagegenerator.processingIndividualRun,
    ],
    '/ocr/api/processing/batch': [
      ocr.formatBatchRunProcessPage,
      pagegenerator.processingBatchRun,
    ],
    '/ocr/api/processing/batch/simulations': [
      ocr.formatBatchResultsHistoryTable,
    ],
    '/ocr/api/processing/individual/cases': [
      ocr.formatIndividualResultsHistoryTable,
    ],
    '/ocr/api/processing/individual/:id': [
      ocr.formatIndividualRunProcessDetailPage,
      pagegenerator.processingIndividualDetail,
    ],
    '/ocr/api/processing/batch/:id': [
      ocr.formatBatchRunProcessDetailPage,
      pagegenerator.processingBatchDetail,
    ],
    '/ocr/api/processing/batch/:id/cases': [
      ocr.formatBatchCasesTable,
    ],
    '/ocr/api/processing/batch/:id/cases/:caseid': [
      ocr.formatSimulationCaseEditModal,
    ],
    '/ocr/api/download/processing/individual/:id': [
      ocr.formatCaseCSV,
    ],
    '/ocr/api/download/processing/batch/:id': [
      ocr.formatSimulationCSV,
    ],
    '/payment/getCustomer': [
      payment.formatCustomerData,
    ],
    '/payment/downloadTransactions': [
      payment.formatTransactionsCSVData,
    ],
    '/los/api/applications': [
      los.formatApplicationsIndexTable,
    ],
    '/los/api/customers': [
      los.formatCustomersIndexTable,
    ],
    '/los/api/customers/companies/new': [
      los.formatDropdowns,
      los.formatNewCompanyModal,
    ],
    '/los/api/intermediaries': [
      los.formatIntermediaryIndexTable,
    ],
    '/los/api/intermediaries/new': [
      los.formatDropdowns,
      los.formatNewIntermediaryModal,
    ],
    '/los/api/intermediaries/:id': [
      los.formatIntermediaryDetail,
    ],
    '/los/api/intermediaries/:id/people': [
      los.formatIntermediaryPeoplesIndexTable,
    ],
    '/los/api/intermediaries/:id/add_person': [
      los.formatDropdowns,
      los.prefillDropdowns,
    ],
    '/los/api/intermediaries/:id/docs': [
      los.formatDocsIndexTable,
    ],
    '/los/api/intermediaries/:id/applications': [
      los.formatApplicationsIndexTable,
    ],
    '/los/api/intermediaries/:id/applications/swimlane': [
      los.formatIntermediaryApplicationSwimlane,
    ],
    '/los/api/intermediaries/:id/applications/table': [
      los.formatIntermediaryApplicationTablePage,
    ],
    '/los/api/intermediaries/:id/key_information/:idx': [
      los.formatIntermediaryAttributeDetail,
    ],
    '/los/api/customers/companies/:id': [
      los.formatCompanyDetail,
      los.setCompanyDisplayTitle,
    ],
    '/los/api/customers/companies/:id/people': [
      los.formatCompanyPeoplesIndexTable,
      los.setCompanyDisplayTitle,
    ],
    '/los/api/customers/people/new': [
      los.formatDropdowns,
      los.formatNewPersonModal,
    ],
    '/los/api/customers/people/:id': [
      los.formatPersonDetail,
      los.formatDropdowns,
      los.setPersonDisplayTitle,
    ],
    '/los/api/applications/swimlane': [
      los.formatApplicationSwimlane,
    ],
    '/los/api/applications/new': [
      los.formatNewApplicationFormData,
    ],
    '/los/api/applications/:id': [
      los.formatApplicationDetail,
    ],
    '/los/api/applications/:id/searchLoanInformation': [
      los.formatApplicationLoanInformation,
    ],
    '/los/api/customers/companies/:id/add_person': [
      los.formatDropdowns,
      los.prefillDropdowns,
    ],
    '/los/api/customers/companies/:id/key_information/:idx': [
      los.formatCompanyAttributeDetail,
    ],
    '/los/api/customers/people/:id/key_information/:idx': [
      los.formatPersonAttributeDetail,
    ],
    '/los/api/customers/companies/:id/tasks': [
      los.formatCompanyTasksIndexTable,
      los.setCompanyDisplayTitle,
    ],
    '/los/api/customers/people/:id/tasks': [
      los.formatPersonTasksIndexTable,
      los.setPersonDisplayTitle,
    ],
    '/los/api/applications/:id/key_information/:idx': [
      los.formatApplicationAttributeDetail,
    ],
    '/los/api/applications/:id/docs': [
      los.formatApplicationDocsIndexTable,
    ],
    '/los/api/docs': [
      los.formatDocsIndexTable,
    ],
    '/los/api/customers/companies/:id/docs': [
      los.formatDocsIndexTable,
    ],
    '/los/api/customers/people/:id/docs': [
      los.formatDocsIndexTable,
    ],
    '/los/api/docs/new': [
      los.formatUploadDocFormDropdown,
    ],
    '/los/api/docs/docusign/get_templates': [
      los.formatDocuSignTemplates,
    ],
    '/los/api/docs/docusign/templates/:id': [
      los.formatDocuSignTemplateDetail,
    ],
    '/los/api/docs/:id': [
      los.formatDocumentDetail,
    ],
    '/los/api/docs/:id/edit_file/:application_id': [
      los.formatDropdowns,
      los.filterEditFileDropdown,
    ],
    '/los/api/applications/:id/docs/new': [
      los.formatDropdowns,
      los.assignParentDirectory,
    ],
    '/los/api/applications/:id/docs/:file_id': [
      los.formatApplicationDocsIndexTable,
    ],
    '/los/api/applications/:id/communications': [
      los.formatApplicationCommunicationsIndexTable,
    ],
    '/los/api/customers/companies/:id/communications': [
      los.formatCompanyCommunicationsIndexTable,
    ],
    '/los/api/customers/people/:id/communications': [
      los.formatPeopleCommunicationsIndexTable,
    ],
    '/los/api/tasks/new': [
      los.formatTaskForm,
    ],
    '/los/api/tasks/:id': [
      los.formatTaskForm,
    ],
    '/los/api/applications/:id/tasks': [
      los.formatApplicationTasksIndexTable,
    ],
    '/los/api/applications/:id/cases': [
      los.formatApplicationCasesIndexTable,
    ],
    '/los/api/applications/:id/notes': [
      los.formatNotesIndexTable,
    ],
    '/los/api/applications/:id/generate_doc/:template': [
      los.assignParentDirectory,
      los.createGenerateDocumentForm,
    ],
    '/los/api/applications/:id/select_template': [
      los.formatSelectTemplateForm,
    ],
    '/los/api/customers/:id/notes': [
      los.formatNotesIndexTable,
    ],
    '/los/api/tasks': [
      los.formatTasksIndexTable,
    ],
    '/los/api/taskbots': [
      los.formatTaskBotsIndexTable,
    ],
    '/los/api/products': [
      los.formatProductsIndexTable,
    ],
    '/los/api/customer_templates': [
      los.formatCustomerTemplateTables,
    ],
    '/los/api/customer_templates/:id/template/:idx': [
      los.formatCustomerTemplateDetail,
    ],
    '/los/api/products/:id': [
      los.formatProductDetail,
    ],
    '/los/api/products/:id/template/:idx': [
      los.formatProductTemplateDetail,
    ],
    '/los/api/templates': [
      los.formatTemplatesIndexTable,
    ],
    '/los/api/templates/:id/:page': [
      los.formatTemplateDetail,
    ],
    '/los/api/templates/:id/field/:idx': [
      los.formatTemplateFieldDetail,
    ],
    '/los/api/communications': [
      los.formatCommunicationsIndexTable,
    ],
    '/los/api/communications/new': [
      los.formatCommunicationForm,
    ],
    '/los/api/communications/:id': [
      los.formatCommunicationForm,
    ],
    '/los/api/applicationlabels': [
      los.formatApplicationLabelsIndexTable,
    ],
    '/los/api/applications/:id/run_automation/decision/:strategy': [
      los.formatRunAutomatedDecisionForm,
    ],
    '/los/api/applications/:id/run_automation/ml/:mlmodel': [
      los.formatRunAutomatedMLForm,
    ],
    '/api/v2/lap/applications': [
      // lap.formatApplicationLookup,
    ],
    '/api/v2/lap/applications/search': [
      lap.formatApplicationResponse,
      lap.formatApplicationSearchResult,
    ],
    '/api/v2/lap/applications/:id': [
      lap.formatApplicationResponse,
      lap.formatApplicationLookup,
    ],
    '/api/v2/lap/companies/search': [
      lap.formatCompanyResponse,
      lap.formatCompanySearchResult,
    ],
    '/api/v2/lap/companies/:id': [
      lap.formatCompanyResponse,
      lap.formatCompanyLookup,
    ],
    '/api/v2/rules_engine_results/individual/:id': [
      lap.formatRulesEngineResultResponse,
      lap.formatRulesEngineResultLookup,
    ],
    '/api/v2/rules_engine_results/batch/:id': [
      lap.formatRulesEngineResultResponse,
      lap.formatRulesEngineSearchResult,
    ],
    '/api/v2/rules_engine_results/search': [
      lap.formatRulesEngineResultResponse,
      lap.formatRulesEngineSearchResult,
    ],
    '/api/v2/lap/people/search': [
      lap.formatPersonResponse,
      lap.formatPersonSearchResult,
    ],
    '/api/v2/lap/people/:id': [
      lap.formatPersonResponse,
      lap.formatPersonLookup,
    ],
    '/api/v2/lap/documents/search/:id': [
      lap.formatSearchDocumentsResponse,
    ],
    '/api/v2/lap/documents/:id': [
      lap.formatDocumentLookup,
    ],
    '/api/v2/lap/intermediaries/search': [
      lap.formatIntermediaryResponse,
      lap.formatIntermediarySearchResult,
    ],
    '/api/v2/lap/intermediaries/:id': [
      lap.formatIntermediaryResponse,
      lap.formatIntermediaryLookup,
    ],
    '/api/v2/lap/tasks/search': [
      lap.formatTaskResponse,
      lap.formatTaskSearchResult,
    ],
    '/api/v2/lap/tasks/:id': [
      lap.formatTaskResponse,
      lap.formatTaskLookup,
    ],
    '/api/v2/lap/communications/search': [
      lap.formatCommunicationResponse,
      lap.formatCommunicationSearchResult,
    ],
    '/api/v2/lap/communications/:id': [
      lap.formatCommunicationResponse,
      lap.formatCommunicationLookup,
    ],
  },
  POST: {
    '/api/v2/ml_models': [
      ml.formatMLResponse,
      api.convertToXML,
    ],
    '/api/v2/ml_rules_engine': [
      api.convertToXML,
    ],
    '/api/v2/rules_engine_batch': [
      api.convertToXML,
    ],
    '/api/v2/machine_learning_batch': [
      api.convertToXML,
    ],
    '/api/v2/lap/communications': [
      lap.formatCommunicationResponse,
      lap.formatNewCommunicationResponse,
    ],
    '/api/v2/lap/documents': [
      lap.formatDocumentResponse,
      lap.formatNewDocumentResponse,
    ],
    '/api/v2/lap/people': [
      lap.formatPersonResponse,
      lap.formatNewPersonResponse,
    ],
    '/api/v2/lap/tasks': [
      lap.formatTaskResponse,
      lap.formatNewTaskResponse,
    ],
    '/api/v2/lap/intermediaries': [
      lap.formatIntermediaryResponse,
      lap.formatNewIntermediaryResponse,
    ],
    '/api/v2/lap/applications': [
      lap.formatApplicationResponse,
      lap.formatNewApplicationResponse,
    ],
    '/api/v2/lap/companies': [
      lap.formatCompanyResponse,
      lap.formatNewCompanyResponse,
    ],
    '/auth/resend_mfa_phone': [
      auth.resendMFAMessage,
    ],
    '/simulation/api/compare_simulations': [
      simulation.formatSimulationSummaryData,
      simulation.formatSimulationChartData,
    ],
    '/decision/api/add_document_template': [
      decision.generateVariableDropdown,
      decision.generateDocumentTemplateRequiredVariable,
    ],
    '/optimization/api/run_analysis': [
      optimization.formatAnalysisPage,
    ],
  },
  PUT: {
    '/api/v2/lap/people/:id': [
      lap.formatPersonResponse,
      lap.formatUpdatePersonResponse,
    ],
    '/api/v2/lap/applications/:id': [
      lap.formatApplicationResponse,
      lap.formatUpdateApplicationResponse,
    ],
    '/api/v2/lap/tasks/:id': [
      lap.formatTaskResponse,
      lap.formatUpdateTaskResponse,
    ],
    '/api/v2/lap/communications/:id': [
      lap.formatCommunicationResponse,
      lap.formatUpdateCommunicationResponse,
    ],
    '/api/v2/lap/intermediaries/:id': [
      lap.formatIntermediaryResponse,
      lap.formatUpdateIntermediaryResponse,
    ],
    '/api/v2/lap/companies/:id': [
      lap.formatCompanyResponse,
      lap.formatUpdateCompanyResponse,
    ],
    '/api/v2/rules_engine_results/individual/:id': [
      lap.formatRulesEngineResultResponse,
      lap.formatUpdateRulesEngineResultResponse,
    ],
    '/api/v2/rules_engine_results/batch/:id': [
      lap.formatRulesEngineResultResponse,
      lap.formatRulesEngineSearchResult,
    ],
    '/simulation/api/test_cases/:id': [
      api.reformatVariables,
      simulation.formatTestCaseIndices,
      simulation.formatTestCaseBody,
    ],
  },
  DELETE: {
    '/api/v2/lap/people/:id': [
      lap.formatPersonResponse,
      lap.formatDeletePersonResponse,
    ],
    '/api/v2/lap/tasks/:id': [
      lap.formatDeleteTaskResponse,
    ],
    '/api/v2/lap/companies/:id': [
      lap.formatCompanyResponse,
      lap.formatDeleteCompanyResponse,
    ],
    '/api/v2/lap/communications/:id': [
      lap.formatDeleteCommunicationResponse,
    ],
    '/api/v2/lap/documents/:id': [
      lap.formatDeleteDocumentResponse,
    ],
    '/api/v2/lap/applications/:id': [
      lap.formatDeleteApplicationResponse,
    ],
    '/api/v2/rules_engine_results/individual/:id': [
      lap.formatDeleteApplicationResponse,
    ],
    '/api/v2/rules_engine_results/batch/:id': [
      lap.formatDeleteApplicationResponse,
    ],
    '/api/v2/lap/intermediaries/:id': [
      lap.formatDeleteIntermediaryResponse,
    ],
  },
};
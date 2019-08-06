'use strict';

const guideLinks = {
  models: {
    historicalData: 'https://docs.digifi.io/docs/adding-a-data-source',
    modelTraining: 'https://docs.digifi.io/docs/training-an-ml-model',
    evaluation: 'https://docs.digifi.io/docs/evaluating-predictive-power',
    individualProcessing: 'https://docs.digifi.io/docs/individual-processing-1',
    batchProcessing: 'https://docs.digifi.io/docs/batch-processing-1',
    modelSelection: 'https://docs.digifi.io/docs/evaluating-predictive-power',
  },
  vision: {
    templates: 'https://docs.digifi.io/docs/templates',
    individualProcessing: 'https://docs.digifi.io/docs/individual-processing-tr',
    batchProcessing: 'https://docs.digifi.io/docs/batch-processing-tr',
  },
  rulesEngine: {
    variables: 'https://docs.digifi.io/docs/variables',
    strategies: 'https://docs.digifi.io/docs/creating-editing-strategies',
    strategiesDetailProcessFlow: 'https://docs.digifi.io/docs/implementing-a-decision-process',
    strategiesDetailRules: 'https://docs.digifi.io/docs/adding-business-rules',
    strategiesDetailVersions: 'https://docs.digifi.io/docs/versioning-and-locking',
    individualProcessing: 'https://docs.digifi.io/docs/individual-processing',
    batchProcessing: 'https://docs.digifi.io/docs/batch-processing',
    APIProcessing: 'https://docs.digifi.io/docs/activating-a-decision-strategy',
  },
  decision: {
    '/strategies/all': 'https://docs.digifi.io/docs/creating-editing-strategies',
    '/strategies/active': 'https://docs.digifi.io/docs/creating-editing-strategies',
    '/strategies/testing': 'https://docs.digifi.io/docs/creating-editing-strategies',
    '/variables/input': 'https://docs.digifi.io/docs/variables',
    '/variables/output': 'https://docs.digifi.io/docs/variables',
    '/variables/:id/detail': 'https://docs.digifi.io/docs/variables',
    '/activation': 'https://docs.digifi.io/docs/activating-a-decision-strategy',
    '/strategies/:id/overview': 'https://docs.digifi.io/docs/implementing-a-decision-process',
    '/strategies/:id/:type/:segment': 'https://docs.digifi.io/docs/adding-processing-logic-to-a-strategy',
    '/strategies/:id/versions': 'https://docs.digifi.io/docs/versioning-and-locking',
  },
  optimization: {
    '/data_sources': 'https://docs.digifi.io/docs/adding-a-data-source',
    '/data_sources/:id': 'https://docs.digifi.io/docs/adding-a-data-source',
    '/artificialintelligence': 'https://docs.digifi.io/docs/training-an-ml-model',
    '/mlmodels/:id': 'https://docs.digifi.io/docs/training-an-ml-model',
    '/analysis': 'https://docs.digifi.io/docs/evaluating-predictive-power',
    // '/analysis/binary': 'https://docs.digifi.io/docs/binary-model-evaluation',
    // '/analysis/regression': 'https://docs.digifi.io/docs/linear-model-evaluation',
    // '/analysis/categorical': 'https://docs.digifi.io/docs/categorical-model-evaluation',
  },
  simulation: {
    '/test_cases': 'https://docs.digifi.io/docs/reusable-cases',
    '/test_cases/:id/detail': 'https://docs.digifi.io/docs/reusable-cases',
    '/simulation': 'https://docs.digifi.io/docs/running-strategies',
    '/analysis': 'https://docs.digifi.io/docs/analyze-results',
  },
  integration: {
    '/dataintegrations': 'https://docs.digifi.io/docs/data-integrations',
    '/dataintegrations/:id/overview': 'https://docs.digifi.io/docs/data-integrations',
    '/dataintegrations/:id/data_setup': 'https://docs.digifi.io/docs/data-integrations',
    '/api_request': 'https://docs.digifi.io/docs/api-request',
    '/api_response': 'https://docs.digifi.io/docs/api-response',
  },
  companySettings: {
    productManagement: 'https://docs.digifi.io/docs/overview-of-company-settings',
    billingManagement: 'https://docs.digifi.io/docs/overview-of-company-settings',
    userManagement: 'https://docs.digifi.io/docs/overview-of-company-settings',
    apiSetup: 'https://docs.digifi.io/docs/api-setup',
  },
  account: {
    myAccount: 'https://docs.digifi.io/docs/overview-of-my-account',
  },
}; 

module.exports = {
  guideLinks,
};
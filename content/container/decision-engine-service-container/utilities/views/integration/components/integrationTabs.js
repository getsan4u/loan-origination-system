'use strict';

/** Create Simulation tabs  */

const appGlobalTabs = require('../../shared/component/appGlobalTabs').appGlobalTabs;

function generateIntegrationTabs(tabname) {
  let tabs = [{
    label: 'Overview',
    location: 'overview',
  }, {
    label: 'Data Integrations',
    location: 'dataintegrations',
  }, {
    label: 'Documents',
    location: 'documents/ocr',
  }, {
    label: 'API Setup',
    location: 'api_setup/request',
  }, 
  // {
  //   label: 'API Response',
  //   location: 'api_response',
  // },
  ];
  return appGlobalTabs(tabs, tabname, 'integration');
}

module.exports = generateIntegrationTabs;
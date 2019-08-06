'use strict';

/** Create Simulation tabs  */

const appGlobalTabs = require('../../shared/component/appGlobalTabs').appGlobalTabs;

function generateSimulationTabs(tabname) {
  let tabs = [{
    label: 'Individual',
    location: 'individual/run',
  }, {
    label: 'Batch',
    location: 'batch/run',
  },];
  return appGlobalTabs(tabs, tabname, 'processing');
}

module.exports = generateSimulationTabs;
'use strict';

/** Create Simulation tabs  */

const appGlobalTabs = require('../../shared/component/appGlobalTabs').appGlobalTabs;

function generateOptimizationTabs(tabname, userRole) {
  let tabs = [
    {
      label: 'Models',
      location: 'models',
    }, {
      label: 'Processing',
      location: 'processing/individual',
    },
  ];
  // if (userRole === 'user') tabs.shift();
  return appGlobalTabs(tabs, tabname, 'ml');
}

module.exports = generateOptimizationTabs;
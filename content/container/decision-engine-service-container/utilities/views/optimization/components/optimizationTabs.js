'use strict';

/** Create Simulation tabs  */

const appGlobalTabs = require('../../shared/component/appGlobalTabs').appGlobalTabs;

function generateOptimizationTabs(tabname) {
  let tabs = [
  //   {
  //   label: 'Overview',
  //   location: 'overview',
  // }, 
    {
      label: 'Training',
      location: 'training/historical_data',
    }, {
      label: 'Evaluation',
      location: 'evaluation',
    }, {
      label: 'Processing',
      location: 'processing/individual',
    },
  // {
  //   label: 'Model Evaluation',
  //   location: 'analysis/binary',
  // },
  ];
  return appGlobalTabs(tabs, tabname, 'optimization');
}

module.exports = generateOptimizationTabs;
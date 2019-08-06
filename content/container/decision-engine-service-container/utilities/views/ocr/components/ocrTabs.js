'use strict';

const appGlobalTabs = require('../../shared/component/appGlobalTabs').appGlobalTabs;

function generateOptimizationTabs(tabname, userRole) {
  let tabs = [
    {
      label: 'Templates',
      location: 'templates',
    },
    {
      label: 'Processing',
      location: 'processing/individual',
    },
  ];
  if (userRole === 'user') tabs.shift();
  return appGlobalTabs(tabs, tabname, 'ocr');
}

module.exports = generateOptimizationTabs;
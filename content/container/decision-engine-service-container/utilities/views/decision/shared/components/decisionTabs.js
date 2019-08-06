'use strict';
const globalTabs = require('./appGlobalTabs');
const pluralize = require('pluralize');


function decisionTabs(tabname, userRole) {
  let tabs = [{
    label: 'Rules Management',
    category: 'strategies',
    dropdownType: 'latest',
  }, {
    label: 'Processing',
    category: 'processing/individual/run',
    dropdownType: 'none',
  }, 
  ];
  if (userRole === 'user') {
    // tabs.shift();
    return globalTabs(tabs, tabname, 'decision');
  } else {
    return globalTabs(tabs, tabname, 'decision');
  }
}


module.exports = decisionTabs;
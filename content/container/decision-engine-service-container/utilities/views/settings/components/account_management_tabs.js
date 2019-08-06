'use strict';

/** Create account management tabs  */

const appGlobalTabs = require('../../shared/component/appGlobalTabs').appGlobalTabs;

module.exports = function(tabname) {
  let tabs = [{
    label: 'Account',
    location: 'account/products',
  },
  { 
    label: 'API',
    location: 'api',
  },
  ];
  return appGlobalTabs(tabs, tabname, 'company-settings');
};
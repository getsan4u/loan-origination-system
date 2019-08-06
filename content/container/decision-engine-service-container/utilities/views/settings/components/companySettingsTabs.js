'use strict';

/** Create account management tabs  */

const appGlobalTabs = require('../../shared/component/appGlobalTabs').appGlobalTabs;

module.exports = function(tabname) {
  let tabs = [{
    label: 'Company Information',
    location: 'company_info',
  },
  { 
    label: 'Users',
    location: 'users',
  },
  { 
    label: 'Transactions',
    location: 'transactions',
  },
  { 
    label: 'API Credentials',
    location: 'api_credentials',
  },
  ];
  return appGlobalTabs(tabs, tabname, 'company-settings');
};
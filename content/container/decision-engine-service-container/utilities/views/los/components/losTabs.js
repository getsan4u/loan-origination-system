'use strict';

/** Create Lending CRM tabs  */

const appGlobalTabs = require('../../shared/component/appGlobalTabs').appGlobalTabs;

module.exports = function (tabname) {
  let tabs = [ 
  //   {
  //   label: 'Dashboard',
  //   location: '',
  //   icon: 'chart bar',
  // },
    {
      label: 'Applications',
      location: 'applicationsdashboard',
      icon: 'file alternate',
    }, {
      label: 'Tasks',
      location: 'tasks',
      icon: 'check square',
    }, {
      label: 'Customers',
      icon: 'user',
      dropdown: [{
        name: 'Companies',
        icon: 'building',
        location: '/los/companies',
      },
      {
        name: 'People',
        location: '/los/people',
        icon: 'user',
      }, ],
    }, {
      label: 'Intermediaries',
      location: 'intermediaries',
      icon: 'fas fa-seedling',
    }, {
      label: 'Task Bots',
      location: 'taskbots',
      icon: 'fas fa-robot',
    }, {
      label: 'Other',
      icon: 'ellipsis horizontal',
      dropdown: [{
        name: 'Communications',
        location: '/los/others/communications',
      }, {
        name: 'Documents',
        location: '/los/others/docs',
      }, {
        name: 'Loan Product Types',
        location: '/los/others/products',
      }, {
        name: 'Customer & Intermediary Templates',
        location: '/los/others/customer_templates',
      }, {
        name: 'Document Creation Templates',
        location: '/los/others/templates',
      }, {
        name: 'Application Labels',
        location: '/los/others/applicationlabels',
      },
      ],
    },
  ];
  return appGlobalTabs(tabs, tabname, 'los');
};
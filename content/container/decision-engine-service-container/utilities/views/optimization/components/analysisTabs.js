'use strict';

const COLLECTION_TABS = require('../../constants').COLLECTION_TABS;
const pluralize = require('pluralize');

const ANALYSIS_SUBTABS = [{
    label: 'Binary',
    location: 'binary',
  }, {
    label: 'Linear',
    location: 'regression',
  }, {
    label: 'Categorical',
    location: 'categorical',
  },
];

function getTabComponent(tab, tabname) {
  return {
    component: 'Tab',
    props: {
      isActive: (tab.location === tabname),
      style: {
        textAlign: 'center'
      },
    },
    children: [ {
      component: 'ResponsiveButton',
      props: {
        onclickProps: {   
          onclickBaseUrl: `${tab.location}`,
        },
        onClick: 'func:window.mlAnalysisTabOnClick',
        style: {
          border: 'none',
        },
      },
      children: tab.label,
    }, ],
  };
}

function generateComponent(tabname) {
  return {
    component: 'div',
    props: {
      className: 'global-sub-tabs',
    },
    children: [ {
      component: 'Container',
      children: [ {
        component: 'Tabs',
        props: {
          tabStyle: 'isBoxed',
          style: {
            marginBottom: '-1px',
            marginTop: '-10px',
          }
        },
        children: [
          {
            component: 'TabGroup',
            children: ANALYSIS_SUBTABS.map(tab => getTabComponent(tab, tabname)),
            props: {},
          },
        ]
      }]
    }]
  }
}

module.exports = generateComponent;
'use strict';

const COLLECTION_TABS = require('../../constants').COLLECTION_TABS;
const pluralize = require('pluralize');

const API_SUBTABS = [{
  label: 'Request',
  location: 'request',
}, {
  label: 'Response',
  location: 'response',
},
];

function getTabComponent(tab, tabname) {
  return {
    component: 'Tab',
    props: {
      isActive: (tab.location === tabname),
      style: {
        textAlign: 'center',
      },
    },
    children: [{
      component: 'ResponsiveButton',
      props: {
        onClick: 'func:this.props.reduxRouter.push',
        onclickBaseUrl: `/integration/api_setup/${tab.location}`,
        style: {
          border: 'none',
        },
      },
      children: tab.label,
    },],
  };
}

function generateComponent(tabname) {
  return {
    component: 'div',
    props: {
      className: 'global-sub-tabs',
    },
    children: [{
      component: 'Container',
      children: [{
        component: 'Tabs',
        props: {
          tabStyle: 'isBoxed',
          style: {
            marginBottom: '-1px',
            marginTop: '-10px',
          },
        },
        children: [
          {
            component: 'TabGroup',
            children: API_SUBTABS.map(tab => getTabComponent(tab, tabname)),
            props: {},
          },
        ],
      },],
    },],
  };
}

module.exports = generateComponent;
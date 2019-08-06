'use strict';

const COLLECTION_TABS = require('../../constants').COLLECTION_TABS;
const pluralize = require('pluralize');

const DATASOURCE_SUBTABS = [{
  label: 'Data Schema',
  location: 'data_schema',
}, {
  label: 'Transformations',
  location: 'transformations',
},
];

function getTabComponent(tab, options) {
  return {
    component: 'Tab',
    props: {
      isActive: (tab.location === options.tabname),
      style: {
        textAlign: 'center',
      },
    },
    children: [{
      component: 'ResponsiveButton',
      asyncprops: {
        onclickPropObject: ['datasourcedata', 'data',],
      },
      props: {
        onClick: 'func:this.props.reduxRouter.push',
        onclickBaseUrl: `/optimization/data_sources/:id/${tab.location}`,
        onclickLinkParams: [{
          key: ':id',
          val: '_id',
        }, {
          key: ':type',
          val: 'type',
        },],
        style: {
          border: 'none',
        },
      },
      children: tab.label,
    },],
  };
}

function generateComponent(options) {
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
            children: DATASOURCE_SUBTABS.map(tab => getTabComponent(tab, options)),
            props: {},
          },
        ],
      },],
    },],
  };
}

module.exports = generateComponent;
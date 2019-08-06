'use strict';
const pluralize = require('pluralize');

function getTabComponent(tab, tabname, baseURL) {
  return {
    component: 'Tab',
    bindprops: true,
    props: {
      isActive: tab.url.indexOf(tabname) !== -1,
      style: {
        textAlign: 'center',
        alignSelf: 'flex-end',
      },
    },
    children: [ {
      component: 'ResponsiveButton',
      props: {
        onClick: 'func:this.props.reduxRouter.push',
        onclickBaseUrl: `/${baseURL}${tab.url}`,
        onclickLinkParams: [],
        style: {
          borderColor: 'transparent',
          padding: 0,
        },
      },
      asyncprops: {
        onclickPropObject: [ 'variabledata', 'data', ],
      },
      children: tab.label,
    }, ],
  };
}

function generateComponent(tabname, tabs, baseURL) {
  return {
    component: 'div',
    props: {
      className: 'global-sub-tabs',
    },
    children: [{
      component: 'Container',
      children: [{
        component: 'Tabs',
        bindprops: true,
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
            bindprops: true,
            children: tabs.map(tab => {
              return getTabComponent(tab, tabname, baseURL);
            }),
          },
        ],
      }]
    }]
  };
};

function generateFindTabs(options) {
  let { tabnames, innerTabs, outerTabs, collection, baseURL } = options;
  baseURL = (baseURL || baseURL === '') ? baseURL : `decision/${pluralize(collection)}`;
  return (!innerTabs) ? {
    outerTabs: generateComponent(tabnames[0], outerTabs, baseURL),
  } : {
      outerTabs: generateComponent(tabnames[0], outerTabs, baseURL),
      innerTabs: generateComponent(tabnames[1], innerTabs, baseURL),
    };
}

module.exports = generateFindTabs;
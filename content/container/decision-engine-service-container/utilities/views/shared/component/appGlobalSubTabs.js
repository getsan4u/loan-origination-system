'use strict';
const pluralize = require('pluralize');
const capitalize = require('capitalize');

function getTabComponent(tab, tabname, baseURL) {
  try {
    return {
      component: 'Tab',
      props: {
        isActive: (tab.isActive || tab.location === tabname || tabname === tab.label),
        style: {
          textAlign: 'center',
          minWidth: 'auto',
        },
      },
      children: [
        {
          component: 'ResponsiveButton',
          asyncprops: (tab.asyncprops) ? tab.asyncprops : null,
          props: {
            onClick: 'func:this.props.reduxRouter.push',
            onclickBaseUrl: `${tab.baseUrl || baseURL}/${tab.location}`,
            style: {
              border: 'none',
            },
            onclickLinkParams: (tab.params) ? tab.params : null,
          },
          children: tab.label || capitalize(pluralize(tab.location)),
        },
      ],
    };
  } catch (e) {
    // console.error(e, { tab, tabname, baseURL });
    throw e;
  }
}

function appGlobalSubTabs(tabname, tabs, baseURL) {
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
          },
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
      },],
    },],
  };
}

module.exports = {
  appGlobalSubTabs,
};
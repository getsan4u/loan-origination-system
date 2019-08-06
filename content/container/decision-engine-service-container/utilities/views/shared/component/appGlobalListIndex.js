'use strict';

function getTabComponent(tab, tabname, baseURL) {
  return {
    component: 'Tab',
    props: {
      isActive: (tab.location == tabname),
      style: {
      },
    },
    children: [{
      // component: 'ResponsiveLink',
      component: 'ResponsiveButton',
      props: {
        onClick: 'func:this.props.reduxRouter.push',
        onclickProps: `/${baseURL||'crm'}/${tab.location}`,
        // location: `/crm/${tab.location}`,
        style: {
          border:'none',
        },
      },
      children: tab.label,        
    }, ],
  };
}

function appGlobalListIndex(tabname, tabs, baseURL) {
  return {
    component: 'div',
    props: {
      className: 'global-sub-tabs',
      style: {
        backgroundColor: 'white',
        width: '100%',
        paddingTop: 70,
        borderBottom: '1px solid #d3d6db',
      },
    },
    children: [{
      component: 'Container',
      children: [{
        component: 'Tabs',
        children: [
          {
            component: 'TabGroup',
            children: tabs.map(tab => {
              return getTabComponent(tab, tabname, baseURL);
            }),
            props: {
              className: 'breadcrumb',
            },
          },
        ],
      }, ]
    }, ]
  };
}

module.exports = {
  appGlobalListIndex,
};
'use strict';
const ML_MODEL_TABS = [ {
  label: 'Historical Data',
  location: 'historical_data',
}, {
  label: 'Model Training',
  location: 'mlmodels',
}, ];

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
        onClick: 'func:this.props.reduxRouter.push',
        onclickBaseUrl: `/optimization/training/${tab.location}`,
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
            children: ML_MODEL_TABS.map(tab => getTabComponent(tab, tabname)),
            props: {},
          },
        ]
      } ]
    } ]
  }
}

module.exports = generateComponent;
'use strict';
const DEFAULT_ML_SUBTABS = [ {
  label: 'Deployed Model',
  location: 'model_selection',
}, {
  label: 'Model Evaluation',
  location: 'comparison_charts/0',
}, {
  label: 'Input Summary',
  location: 'input_data',
}, ];

const INDUSTRY_ML_SUBTABS = [ {
  label: 'Deployed Model',
  location: 'model_selection',
}, {
  label: 'Input Data Analysis',
  location: 'input_analysis/0',
}, {
  label: 'DigiFi Score Analysis',
  location: 'score_analysis/0',
}, {
  label: 'Model Evaluation',
  location: 'comparison_charts/0',
}, {
  label: 'Input Summary',
  location: 'input_data',
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
      asyncprops: {
        onclickPropObject: ['mlmodeldata', 'mlmodel',],
      },
      props: {
        onClick: 'func:this.props.reduxRouter.push',
        onclickBaseUrl: `/ml/models/:id/${tab.location}`,
        onclickLinkParams: [{
          key: ':id',
          val: '_id',
        }],
        style: {
          border: 'none',
        },
      },
      children: tab.label,
    }, ],
  };
}

function generateComponent(tabname, industrySpecific = false) {
  const subtabConfig = industrySpecific ? INDUSTRY_ML_SUBTABS : DEFAULT_ML_SUBTABS;
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
            children: subtabConfig.map(tab => getTabComponent(tab, tabname)),
            props: {},
          },
        ]
      } ]
    } ]
  }
}

module.exports = generateComponent;
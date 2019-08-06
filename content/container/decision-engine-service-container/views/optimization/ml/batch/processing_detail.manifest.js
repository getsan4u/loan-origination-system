'use strict';

const utilities = require('../../../../utilities');
const shared = utilities.views.shared;
const formElements = shared.props.formElements.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
const optimizationTabs = utilities.views.optimization.components.optimizationTabs;
const mlProcessingTabs = utilities.views.optimization.components.mlProcessingTabs;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/optimization/processing/batch/:id': {
      layout: {
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        children: [
          optimizationTabs('processing/individual'),
          plainHeaderTitle({
            title: [ {
              component: 'span',
              children: 'Decision Processing',
            }, ],
            subtitle: 'Use your machine learning model to make accurate decisions',
          }),
          mlProcessingTabs('batch'),
          {
            component: 'Container',
            props: {
              style: {},
            },
            asyncprops: {
              _children: ['setupdata', 'mlbatchPage', ],
            },
          },
        ],
      },
      resources: {
        setupdata: '/optimization/api/batch/run/:id',
        simulationdata: '/optimization/api/batch/simulations?pagination=mlbatches',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      callbacks: [ 'func:window.setHeaders', 'func:window.filterDataSourceFile',  ],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Machine Learning',
        navLabel: 'Machine Learning',
      },
    },
  },
};

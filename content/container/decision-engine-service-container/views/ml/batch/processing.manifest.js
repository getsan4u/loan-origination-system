'use strict';

const utilities = require('../../../utilities');
const shared = utilities.views.shared;
const formElements = shared.props.formElements.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
const mlTabs = utilities.views.ml.components.mlTabs;
const mlProcessingTabs = utilities.views.ml.components.mlProcessingTabs;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/ml/processing/batch': {
      layout: {
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        asyncprops: {
          _children: ['setupdata', 'layout']
        }
      },
      resources: {
        setupdata: '/ml/api/batch/run?type=ml',
        simulationdata: '/ml/api/batch/simulations?pagination=mlbatches',
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

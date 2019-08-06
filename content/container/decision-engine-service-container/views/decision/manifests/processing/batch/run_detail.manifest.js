'use strict';

const utilities = require('../../../../../utilities');
const shared = utilities.views.shared;
const formElements = shared.props.formElements.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
const decisionTabs = utilities.views.decision.shared.components.decisionTabs;
const strategyProcessingTabs = utilities.views.decision.shared.components.strategyProcessingTabs;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/decision/processing/batch/run/:id': {
      layout: {
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        children: [
          decisionTabs('processing/individual/run'),
          plainHeaderTitle({
            title: [ {
              component: 'span',
              children: 'Strategy Processing',
            }, ],
            subtitle: 'Generate rules-based decisions in individual or batch processes',
          }),
          strategyProcessingTabs('batch'),
          {
            component: 'Container',
            props: {
              style: {},
            },
            asyncprops: {
              _children: ['setupdata', 'simulationPage', ],
            },
          },
        ],
      },
      resources: {
        setupdata: '/simulation/api/get_setup_data/:id?pagination=batchsimulations',
        simulationdata: '/simulation/api/batch/results?format=json&pagination=batchsimulations',
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
        'title': 'DigiFi | Decision Engine',
        'navLabel': 'Decision Engine',
      },
    },
  },
};

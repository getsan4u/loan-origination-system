'use strict';

const utilities = require('../../../../../utilities');
const shared = utilities.views.shared;
const formElements = shared.props.formElements.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const simpleAsyncHeaderTitle = utilities.views.shared.component.layoutComponents.simpleAsyncHeaderTitle;
const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
const decisionTabs = utilities.views.decision.shared.components.decisionTabs;
const strategyProcessingTabs = utilities.views.decision.shared.components.strategyProcessingTabs;
let randomKey = Math.random;

module.exports = {
  'containers': {
    [ '/decision/processing/individual/results/:id' ]: {
      layout: {
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        asyncprops: {
          _children: ['simulationdata', 'layout']
        }
      },
      'resources': {
        [ 'simulationdata' ]: '/simulation/api/individual/results/:id?format=json&type=decision',
        checkdata: {
          url: '/auth/run_checks',
          settings: {
            onSuccess: [ 'func:window.redirect', ],
            onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      'callbacks': [ 'func:window.globalBarSaveBtn', 'func:window.setHeaders', ],
      pageData: {
        'title': 'DigiFi | Decision Engine',
        'navLabel': 'Decision Engine',
      },
      'onFinish': 'render',
    },
  },
};

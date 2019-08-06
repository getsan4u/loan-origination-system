'use strict';

const utilities = require('../../../../utilities');
const shared = utilities.views.shared;
const formElements = shared.props.formElements.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const simpleAsyncHeaderTitle = utilities.views.shared.component.layoutComponents.simpleAsyncHeaderTitle;
const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
const optimizationTabs = utilities.views.optimization.components.optimizationTabs;
let randomKey = Math.random;

module.exports = {
  'containers': {
    [ '/optimization/batch/results/:id' ]: {
      layout: {
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        children: [
          optimizationTabs('processing/individual'),
          simpleAsyncHeaderTitle({
            type: 'optimization',
            title: true,
          }),
          styles.fullPageDivider,
          {
            component: 'Container',
            props: {
              className: 'optimization',
            },
            asyncprops: {
              _children: [ 'optimizationdata', 'pageLayout', ],
            },
          }, ],
      },
      'resources': {
        [ 'optimizationdata' ]: '/optimization/api/batch/results/:id?format=json',
        casedata: '/optimization/api/batch/results/:id/cases',
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
        title: 'DigiFi | Machine Learning',
        navLabel: 'Machine Learning',
      },
      'onFinish': 'render',
    },
  },
};

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
  'containers': {
    [ '/decision/processing/individual/run/:id' ]: {
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
          strategyProcessingTabs('individual'),
          {
            component: 'Container',
            props: {
              className: 'simulation',
            },
            asyncprops: {
              _children: [ 'pagedata', 'pageLayout', ],
            },
          }, ],
      },
      'resources': {
        [ 'pagedata' ]: '/simulation/api/individual/run/:id?format=json&pagination=true',
        casedata: '/simulation/api/individual/cases?format=json&pagination=decisioncases',
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

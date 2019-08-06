'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../../utilities');
const shared = utilities.views.shared;
const formElements = utilities.views.decision.shared.components.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const decisionTabs = utilities.views.decision.shared.components.decisionTabs;
const strategyProcessingTabs = utilities.views.decision.shared.components.strategyProcessingTabs;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/decision/processing/api/run': {
      layout: {
        component: 'div',
        privileges: [ 101, 102],
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
          strategyProcessingTabs('api'),
          {
            component: 'Container',
            props: {
              style: {},
            },
            asyncprops: {
              _children: [ 'strategydata', 'form' ],
            },
          },
        ],
      },
      resources: {
        strategydata: '/integrations/get_strategies?manifest=true',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: [ 'func:window.redirect', ],
            onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      callbacks: [ 'func:window.globalBarSaveBtn', 'func:window.setHeaders', ],
      onFinish: 'render',
      pageData: {
        'title': 'DigiFi | Decision Engine',
        'navLabel': 'Decision Engine',
      },
    },
  },
};
'use strict';

const utilities = require('../../../utilities');
const shared = utilities.views.shared;
const formElements = shared.props.formElements.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const detailAsyncTitleAndSubtitle = utilities.views.shared.component.layoutComponents.detailAsyncTitleAndSubtitle;
const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
const mlTabs = utilities.views.ml.components.mlTabs;
let randomKey = Math.random;

module.exports = {
  'containers': {
    [ '/ml/individual/results/:id' ]: {
      layout: {
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        asyncprops: {
          _children: ['mldata', 'layout']
        },
      },
      'resources': {
        [ 'mldata' ]: '/ml/api/individual/results/:id?format=json&type=ml&page=results',
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
      'callbacks': [ 'func:window.globalBarSaveBtn', 'func:window.setHeaders', 'func:window.renderScorePieChart' ],
      pageData: {
        title: 'DigiFi | Machine Learning',
        navLabel: 'Machine Learning',
      },
      'onFinish': 'render',
    },
  },
};

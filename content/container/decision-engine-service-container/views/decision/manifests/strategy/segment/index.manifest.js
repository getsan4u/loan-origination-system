'use strict';
const styles = require('../../../../../utilities/views/constants/styles');

module.exports = {
  'containers': {
    [ `/decision/strategies/:id/:name/:index` ]: {
      layout: {
        privileges: [101, 102, 103],
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        asyncprops: {
          _children: [ 'strategydata', 'data', 'children' ],
        }
      },
      'resources': {
        [ `strategydata` ]: `/decision/api/standard_strategies/:id?format=json`,
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
      callbacks: [ 'func:window.checkPopulationRulesExists' ],
      'pageData': {
        'title': 'DigiFi | Decision Engine',
        'navLabel': 'Decision Engine',
      },
      'onFinish': 'render',
    },
  },
};

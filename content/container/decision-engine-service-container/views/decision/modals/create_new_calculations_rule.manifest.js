'use strict';

const moment = require('moment');
const utilities = require('../../../utilities');
const randomKey = Math.random;
const pluralize = require('pluralize');
const styles = utilities.views.constants.styles;

module.exports = {
  'containers': {
    [ `/decision/strategies/:id/calculations/create` ]: {
      layout: {
        // privileges: [101, 102],
        component: 'Hero',
        asyncprops: {
          _children: ['pagedata', '_children', 'form']
        },  
      },
      'resources': {
        [ `pagedata` ]: `/decision/api/standard_strategies/:id/calculations/createRule?init=true&type=calculations`,
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: [ 'func:window.redirect', ],
            onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      'callbacks': [ 'func:window.dynamicModalHeight' ],
      'pageData': {
        'navLabel': 'Decision Engine',
      },
      'onFinish': 'render',
    },
  },
};
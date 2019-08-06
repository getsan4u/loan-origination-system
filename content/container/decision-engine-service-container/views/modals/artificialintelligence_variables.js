'use strict';
const styles = require('../../utilities/views/constants/styles');
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/modal/required_artificialintelligence_variables/:id': {
      layout: {
        privileges: [101, 102],
        component: 'div',
        props: {
        },
        asyncprops: {
          _children: ['modeldata', 'requiredVariablesModal',],
        },
      },
      'resources': {
        modeldata: '/decision/api/standard_strategies/required_model_variables/:id?format=json&type=artificialintelligence',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      'callbacks': ['func:window.setHeaders', ],
      'onFinish': 'render',
    },
    '/modal/received_artificialintelligence_variables/:id': {
      layout: {
        component: 'div',
        props: {
        },
        asyncprops: {
          _children: ['modeldata', 'receivedVariablesModal',],
        },
      },
      'resources': {
        modeldata: '/decision/api/standard_strategies/required_model_variables/:id?format=json&type=artificialintelligence&variable_type=output',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      'callbacks': ['func:window.setHeaders', 'func:window.dynamicModalHeight'],
      'onFinish': 'render',
    },
  },
};
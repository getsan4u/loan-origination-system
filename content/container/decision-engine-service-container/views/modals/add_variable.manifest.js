'use strict';
const styles = require('../../utilities/views/constants/styles');

module.exports = {
  'containers': {
    '/modal/add_variable/:id': {
      layout: {
        privileges: [101, 102],
        component: 'div',
        asyncprops: {
          _children: ['variabledata', 'addVariableModal', ],
        },
      },
      'resources': {
        variabledata: '/simulation/api/variable/:id/variable/value?modal=addVariable',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect', ],
            onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      'callbacks': ['func:window.setHeaders', ],
      'onFinish': 'render',
    },
  },
};
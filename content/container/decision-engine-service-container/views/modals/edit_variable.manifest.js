'use strict';

module.exports = {
  'containers': {
    '/modal/edit_variable/:id/:variable/:value': {
      layout: {
        privileges: [101, 102],
        component: 'div',
        props: {
        },
        asyncprops: {
          _children: ['variabledata', 'editVariableModal',],
        },
      },
      'resources': {
        variabledata: '/simulation/api/variable/:id/:variable/:value?modal=editVariable',
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
      'callbacks': [],
      'onFinish': 'render',
    },
  },
};
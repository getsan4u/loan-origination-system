'use strict';

const styles = require('../../utilities/views/constants/styles');

module.exports = {
  'containers': {
    '/modal/delete_user/:id': {
      layout: {
        privileges: [101, ],
        component: 'Container',
        props: {},
        asyncprops: {
          _children: ['deletedata', 'deleteUserModal',],
        },
      },
      'resources': {
        deletedata: '/user/get_user_info/:id',
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
      'onFinish': 'render',
    },
  },
};
'use strict';

const newUserForm = require('../../utilities/views/modals/new_user_form.js');
const styles = require('../../utilities/views/constants/styles');
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/modal/add_new_user': {
      layout: newUserForm,
      'resources': {
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
      'callbacks': ['func:window.dynamicModalHeight'],
      'onFinish': 'render',
    },
  },
};
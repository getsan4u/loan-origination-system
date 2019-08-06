'use strict';

const changeEmail = require('../../utilities/views/modals/change_email_form.js');
const styles = require('../../utilities/views/constants/styles');
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/modal/change_email': {
      layout: changeEmail,
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
      'onFinish': 'render',
    },
  },
};
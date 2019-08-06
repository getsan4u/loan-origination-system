'use strict';

const mfaPhone = require('../../utilities/views/modals/mfa_phone_form.js');
const styles = require('../../utilities/views/constants/styles');
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/modal/mfa/phone': {
      layout: mfaPhone,
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
'use strict';

const mfaCode = require('../../utilities/views/modals/mfa_code_form.js');
const styles = require('../../utilities/views/constants/styles');
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/modal/mfa/code': {
      layout: {
        component: 'Container',
        props: {},
        children: [
          {
            component: 'p',
            asyncprops: {
              children: ['userdata', 'mfaPhoneText', ],
            },
          },
          mfaCode,
        ],
      },
      'resources': {
        userdata: '/user/get_user_info',
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
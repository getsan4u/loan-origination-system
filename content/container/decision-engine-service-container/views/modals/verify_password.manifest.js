'use strict';

const verifyPassword = require('../../utilities/views/modals/verify_password_form.js');
const verifyPasswordAndDisableMFA = require('../../utilities/views/modals/verify_password_and_disable_mfa_form.js');
const styles = require('../../utilities/views/constants/styles');
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/modal/verify_password_1': {
      layout: verifyPassword({ pathname: '/modal/replace_secret_1', title: 'Confirm Generate New Secret 1', ownerOnly: true, }),
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
      'pageData': {
        'title': 'DigiFi | Account',
        'navLabel': 'Account',
      },
      'onFinish': 'render',
    },
    '/modal/verify_password_2': {
      layout: verifyPassword({ pathname: '/modal/replace_secret_2', title: 'Confirm Generate New Secret 2', ownerOnly: true }),
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
      'pageData': {
        'title': 'DigiFi | Account',
        'navLabel': 'Account',
      },
      'onFinish': 'render',
    },
    '/modal/verify_password_for_email': {
      layout: verifyPassword({ pathname: '/modal/change_email', title: 'Change Email', }),
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
      'pageData': {
        'title': 'DigiFi | Account',
        'navLabel': 'Account',
      },
      'onFinish': 'render',
    },
    '/modal/verify_password_for_mfa': {
      layout: verifyPassword({ pathname: '/modal/mfa/phone', title: 'Phone Authentication', }),
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
      'pageData': {
        'title': 'DigiFi | Account',
        'navLabel': 'Account',
      },
      'onFinish': 'render',
    },
    '/modal/verify_password_disable_mfa': {
      layout: verifyPasswordAndDisableMFA(),
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
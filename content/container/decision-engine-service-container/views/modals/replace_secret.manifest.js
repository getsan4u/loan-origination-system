'use strict';

const replaceSecret = require('../../utilities/views/modals/replace_secret_form.js');
const styles = require('../../utilities/views/constants/styles');
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/modal/replace_secret_1': {
      layout: replaceSecret(1),
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
    '/modal/replace_secret_2': {
      layout: replaceSecret(2),
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
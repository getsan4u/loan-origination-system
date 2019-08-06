'use strict';
const loginManifest = require('../auth/login.manifest'); 
const newPasswordForm = require('../../utilities/views/public/components/new_password_form.js');
const styles = require('../../utilities/views/constants/styles');

module.exports = {
  'containers': {
    '/auth/user/reset/:token': {
      'layout': loginManifest({
        formLayout: newPasswordForm,
        subtitle: 'Reset Password',
      }),
      resources: {
        passworddata: '/auth/reset_token/:token',
      },
      callbacks: [],
      'onFinish': 'render',
      'pageData': {
        'title': 'DigiFi | Reset Password',
        'navLabel': 'Reset Password',
      },
    },
  },
};
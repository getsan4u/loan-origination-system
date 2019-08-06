'use strict';
const loginManifest = require('../auth/login.manifest'); 
const inviteForm = require('../../utilities/views/public/components/invite_form.js');
const styles = require('../../utilities/views/constants/styles');

module.exports = {
  'containers': {
    '/auth/accept-invite': {
      'layout': loginManifest({
        formLayout: inviteForm,
        subtitle: 'Create Your Account',
      }),
      'resources': {
        successdata: {
          url: '/auth/success',
          options: {
            onSuccess: ['func:window.hideHeader', ],
          },
        },
      },
      callbacks: [],
      'onFinish': 'render',
      'pageData': {
        'title': 'DigiFi | Invite',
        'navLabel': 'Invite',
      },
    },
  },
};
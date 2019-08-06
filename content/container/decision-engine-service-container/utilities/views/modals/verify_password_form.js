'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const FormCreator = require('@digifi-los/form-creator');
const formElement = require('../shared/form_creator/new_api_credentials');

function verifyPassword(options) {
  let { pathname, title, ownerOnly, } = options;
  const form = new FormCreator();
  if(ownerOnly) form.addFields('privileges', [ 101, ]);
  form.addOnSubmit({
    url: '/auth/verify_password',
    method: 'POST',
    successCallback: ['func:this.props.hideModal', 'func:this.props.createModal', ],
    successProps: ['last', {
      pathname,
      title,
    }],
    errorCallback: 'func:this.props.createNotification',
    success: {
      notification: {
        text: 'Password Verified.',
        timeout: 10000,
        type: 'success',
      },
    },
  });
  form.addFormElements(formElement.text('Please verify your password to confirm your identity.'));
  form.addFormElements(formElement.password());
  form.addFormElements(formElement.verify());
  return form.getForm();
}
module.exports = verifyPassword;
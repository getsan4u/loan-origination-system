'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const FormCreator = require('@digifi-los/form-creator');
const formElement = require('../shared/form_creator/new_api_credentials');

function verifyPassword() {
  const form = new FormCreator();
  form.addOnSubmit({
    url: '/auth/verify_password_and_disable_mfa',
    method: 'POST',
    successCallback: [ 'func:this.props.hideModal', 'func:this.props.refresh', ],
    successProps: ['last', ],
    errorCallback: 'func:this.props.createNotification',
    success: {
      notification: {
        text: 'Phone authentication disabled.',
        timeout: 10000,
        type: 'success',
      },
    },
  });
  form.addFormElements(formElement.text('Verify your password to proceed.'));
  form.addFormElements(formElement.password());
  form.addFormElements(formElement.verify());
  return form.getForm();
}
module.exports = verifyPassword;
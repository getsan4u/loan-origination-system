'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const FormCreator = require('@digifi-los/form-creator');
const formElement = require('../shared/form_creator/profile');

function mfa() {
  const form = new FormCreator();
  form.addOnSubmit({
    url: '/auth/verify_mfa_code',
    method: 'POST',
    successCallback: ['func:this.props.hideModal', 'func:this.props.refresh', ],
    successProps: 'last',
    errorCallback: 'func:this.props.createNotification',
    success: {
      notification: {
        text: 'Phone authentication enabled.',
        timeout: 10000,
        type: 'success',
      },
    },
  });
  form.addFormElements(formElement.code());
  form.addFormElements(formElement.continueButton());
  return form.getForm();
}

module.exports = mfa();
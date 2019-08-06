'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const FormCreator = require('@digifi-los/form-creator');
const formElement = require('../shared/form_creator/new_api_credentials');

function replaceSecret(num) {
  const form = new FormCreator();
  form.addFields('privileges', [ 101, ]);
  form.addOnSubmit({
    url: `/auth/generate_api_credentials?secret=${num}`,
    method: 'POST',
    successCallback: 'func:this.props.hideModal',
    responseCallback: 'func:this.props.refresh',
    successProps: 'last',
    errorCallback: 'func:this.props.createNotification',
    success: {
      notification: {
        text: 'New secret set successfully.',
        timeout: 10000,
        type: 'success',
      },
    },
  });
  form.addFormElements(formElement.text(' CHANGING YOUR SECRET WILL RESULT IN AN IMMEDIATE CHANGE TO THE SYSTEM AND THE CURRENT SECRET WILL NO LONGER BE ACTIVE.', 'WARNING:'));
  form.addFormElements(formElement.text(`Please confirm that you would like to generate a new secret for Client Secret ${num}.`));
  form.addFormElements(Object.assign(formElement.confirm(), formElement.cancel()));
  return form.getForm();
}
module.exports = replaceSecret;
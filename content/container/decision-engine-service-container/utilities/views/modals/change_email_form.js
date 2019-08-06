'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const FormCreator = require('@digifi-los/form-creator');
const formElement = require('../shared/form_creator/profile');

function changeEmail() {
  const form = new FormCreator();
  form.addOnSubmit({
    url: '/auth/change_email',
    method: 'POST',
    successCallback: [ 'func:window.hideModalandCreateNotificationandRefresh', ],
    errorCallback: 'func:this.props.createNotification',
  });
  form.addFormElements(formElement.text('Enter your new email address.'));
  form.addFormElements(formElement.email());
  form.addFormElements(formElement.continueButton());
  return form.getForm();
}
module.exports = changeEmail();
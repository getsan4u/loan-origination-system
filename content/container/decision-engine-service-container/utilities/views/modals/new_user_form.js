'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const FormCreator = require('@digifi-los/form-creator');
const formElement = require('../shared/form_creator/new_user');

function newUserForm() {
  const form = new FormCreator();
  form.addFields('privileges', [ 101, ]);
  form.addOnSubmit({
    url: '/user/new_user?page=company_settings',
    method: 'POST',
    successCallback: 'func:window.closeModalAndCreateNotification',
    responseCallback: 'func:this.props.refresh',
    errorCallback: 'func:this.props.createNotification',
  });
  form.addFields('hasWindowFunc', true);
  form.addFormElements(formElement.firstname());
  form.addFormElements(formElement.lastname());
  form.addFormElements(formElement.email());
  form.addFormElements(formElement.type());
  form.addFormElements(formElement.addUser());
  return form.getForm();
}
module.exports = newUserForm();
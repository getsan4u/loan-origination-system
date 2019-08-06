'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const FormCreator = require('@digifi-los/form-creator');
const formElement = require('../../shared/form_creator/new_org');

function newOrgForm() {
  const form = new FormCreator();
  form.addOnSubmit({
    url: '/auth/organization/new',
    method: 'POST', 
    successCallback: 'func:this.props.loginUser',
    errorCallback: 'func:this.props.createNotification',
  });
  form.addFields('hasWindowFunc', true);
  form.addFields('props', {
    ref: 'func:window.addRef',
    hiddenFields: formElement.hiddenFields,
    blockPageUI: true,
    blockPageUILayout: THEMESETTINGS.blockPageUILayout,
  });
  form.addFormElements(formElement.name());
  form.addFormElements(formElement.organization());
  form.addFormElements(formElement.email());
  // form.addFormElements(formElement.phone());
  form.addFormElements(formElement.password());
  form.addFormElements(formElement.consentBox());
  form.addFormElements(formElement.createAccount());
  form.addFormElements(Object.assign({}, formElement.text('Already have an account?'), formElement.signIn()));
  return form.getForm();
}
module.exports = newOrgForm();
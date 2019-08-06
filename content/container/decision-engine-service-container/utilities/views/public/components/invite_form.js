'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const FormCreator = require('@digifi-los/form-creator');
const formElement = require('../../shared/form_creator/new_org');

function newOrgForm() {
  const form = new FormCreator();
  form.addOnSubmit({
    url: '/auth/register_new_user',
    method: 'POST',
    successCallback: 'func:this.props.reduxRouter.push',
    errorCallback: 'func:this.props.createNotification',
  });
  form.addFields('props', {
    blockPageUI: true,
    blockPageUILayout: THEMESETTINGS.blockPageUILayout,
  });
  form.addFormElements(formElement.fullText('Set your password to accept your invitation.'));
  form.addFormElements(formElement.password());
  form.addFormElements(formElement.createAccount());
  form.addFormElements(formElement.signIn());
  return form.getForm();
}
module.exports = newOrgForm();
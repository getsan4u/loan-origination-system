'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const FormCreator = require('@digifi-los/form-creator');
const formElement = require('../../shared/form_creator/new_password');

function newPasswordForm() {
  const form = new FormCreator();
  form.addOnSubmit({
    url: '/auth/reset_password/:token',
    params: [
      {
        key: ':token',
        val: 'token',
      },
    ],
    method: 'POST',
    success: {
      notification: {
        text: 'Password reset successfully',
        timeout: 10000,
        type: 'success',
      },
    },
    successCallback: 'func:this.props.reduxRouter.push',
    successProps: '/',
    errorCallback: 'func:this.props.createNotification',
  });
  form.addFields('asyncprops', {
    formdata: ['passworddata', ],
  });
  form.addFields('props', {
    blockPageUI: true,
    blockPageUILayout: THEMESETTINGS.blockPageUILayout,
  });
  form.addFormElements(formElement.text('Please enter your new password.'));
  form.addFormElements(formElement.password());
  form.addFormElements(formElement.resetPassword());
  return form.getForm();
}
module.exports = newPasswordForm();
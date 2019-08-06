'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const FormCreator = require('@digifi-los/form-creator');
const formElement = require('../shared/form_creator/profile');

function phone() {
  const form = new FormCreator();
  form.addOnSubmit({
    url: '/auth/mfa_phone',
    method: 'POST',
    successCallback: [ 'func:this.props.hideModal', 'func:this.props.createModal', ],
    successProps: [ 'last', {
      title: 'Phone Authentication',
      pathname: '/modal/mfa/code',
    },
    ],
  });
  form.addFormElements(formElement.text('Please provide your mobile phone number. This number must be capable of receiving text messages (standard rates apply).'));
  form.addFormElements(formElement.phone());
  form.addFormElements(formElement.continueButton());
  return form.getForm();
}
module.exports = phone();
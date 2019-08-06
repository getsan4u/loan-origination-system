'use strict';
const periodic = require('periodicjs');
const FormCreator = require('@digifi-los/form-creator');
const formElement = require('../shared/form_creator/api_download');

function apiRequest() {
  const form = new FormCreator();
  form.addFields('privileges', [ 101, ]);
  form.addFields('hasWindowFunc', true);
  form.addFields('props', {
    onChange: 'func:window.switchResponseFormat',
    ref: 'func:window.addRef',
  });
  form.addFields('asyncprops', {
    clientdata: ['checkdata', 'org', 'association', 'client', ],
    hiddenFields: ['hiddendata', ],
  });
  form.addFormElements(formElement.text('Download a JSON or XML template of the request format.'));
  form.addFormElements(formElement.format());
  form.addFormElements(formElement.downloadResponseButton());
  return form.getForm();
}
module.exports = apiRequest();
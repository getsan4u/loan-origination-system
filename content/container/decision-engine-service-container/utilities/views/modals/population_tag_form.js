'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const FormCreator = require('@digifi-los/form-creator');
const formElement = require('../shared/form_creator/population_tag');

function newUserForm() {
  const form = new FormCreator();
  form.addOnSubmit({
    url: '/simulation/api/create_population_tag',
    method: 'POST',
    successCallback: ['func:this.props.hideModal', 'func:this.props.createNotification',],
    responseCallback: 'func:this.props.refresh',
    errorCallback: 'func:this.props.createNotification',
    successProps:['last', {
      text: 'Population tag created successfully!',
      timeout: 10000,
      type: 'success',
    },
    ],
  });
  form.addFields('hasWindowFunc', true);
  form.addFormElements(formElement.populationTag());
  form.addFormElements(formElement.submit());
  return form.getForm();
}
module.exports = newUserForm();
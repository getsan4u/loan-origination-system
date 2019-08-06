'use strict';

/** Form Creator for adding new users modal */

const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const { styles, } = require('../../constants');

/**
 * This function returns the firstname object for formCreator.
 * @returns {Object} Returns the firstname object for formCreator.
 */
function populationTag() {
  return {
    validations: {
      population_tags: [{
        constraint: 'presence',
        message: '^Name is required.',
      }, {
        constraint: 'length',
        maximum: 30,
        message: '^Name must be less than 30 characters.',
      }, 
      ],
    },
    populationTags: {
      type: 'text',
      name: 'population_tags',
      submitOnEnter: true,
      hasValidations: true,
      errorIcon: 'fa fa-exclamation',
      label: 'Name',
      keyUp: 'func:window.populationOnChange',
      layoutProps: {
        horizontalform: false,
      }
    },
  };
}

/**
 * This function returns the add user button for formCreator.
 * @returns {Object} Returns the add user button for formCreator.
 */
function submit() {
  return {
    gridProps: {
      className: 'submit-wrapper modal-footer-btns',
    },
    submit: {
      'type': 'submit',
      'value': 'ADD POPULATION TAG',
      'name': 'submit',
      'passProps': {
        color: 'isPrimary',
      },
      layoutProps: {
        style: {
          textAlign: 'right',
        },
      },
    },
  };
}

module.exports = {
  populationTag,
  submit,
};

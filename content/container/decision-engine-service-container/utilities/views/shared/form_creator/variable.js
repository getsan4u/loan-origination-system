'use strict';

/** Form Creator for adding new users modal */

const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const { styles, } = require('../../constants');

/**
 * This function returns the variable object for formCreator.
 * @returns {Object} Returns the variable object for formCreator.
 */
function variable(field) {
  return {
    gridProps: {
      className: '__dynamic_form_elements',
    },
    validations: {
      variable: [{
        constraint: 'presence',
        message: '^Variable is required.',
      },
      ],
    },
    variable: {
      type: 'text',
      name: 'variable',
      label: 'Variable Name',
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
      passProps: field === 'disable'
        ? {
          state: 'isDisabled',
        }
        : {},  
    },
    type: {
      type: 'text',
      name: 'type',
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        },
      },
      label: 'Variable Type',
      labelProps: {
        style: {
          visibility: 'hidden'
        }
      },
      passProps: {
        state: 'isDisabled',
      },
    },
  };
}

/**
 * This function returns the type object for formCreator.
 * @returns {Object} Returns the type object for formCreator.
 */
function value() {
  return {
    validations: {
      value: [{
        constraint: 'presence',
        message: '^Value is required.',
      },
      ],
    },
    value: {
      type: 'text',
      name: 'value',
      submitOnEnter: true,
      hasValidations: true,
      errorIcon: 'fa fa-exclamation',
      label: 'Value',
      layoutProps: {
        horizontalform: false,
      },
    },
  };
}

/**
 * This function returns the submit button for formCreator.
 * @returns {Object} Returns the submit button for formCreator.
 */
function submit(text) {
  return {
    gridProps: {
      className: 'modal-footer-btns',
    },
    addUser: {
      'type': 'submit',
      'value': text,
      'name': text.toLowerCase(),
      'passProps': {
        color: 'isPrimary',
      },
      layoutProps: {
        style: {
          textAlign: 'center',
        },
      },
    },
  };
}

module.exports = {
  variable,
  value,
  submit,
};

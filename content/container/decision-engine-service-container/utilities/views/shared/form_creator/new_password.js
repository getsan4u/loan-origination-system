'use strict';

/** Form Creator for reset password page */

const { styles, } = require('../../constants');

/**
 * This function returns text for formCreator.
 * @params {String} str String to display as text in the form.
 * @returns {Object} Returns text for formCreator.
 */
function text(str) {
  return {
    text: {
      'type': 'layout',
      value: {
        component: 'div',
        children: str,
      },
    },
  };
}

/**
 * This function returns the password object for formCreator.
 * @returns {Object} Returns the password object for formCreator.
 */
function password() {
  return {
    validations: {
      password: [{
        constraint: 'presence',
        message: '^Your password is required.',
      }, {
        constraint: 'format',
        pattern: '((?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,30})',
        message: '^Password does not meet requirements (8+ characters in length, at least 1 uppercase letter, at least 1 lowercase letter, and at least 1 number).',
      },
      ],
    },
    password: {
      type: 'password',
      name: 'password',
      placeholder: 'Password',
      submitOnEnter: true,
      hasValidations: true,
      errorIcon: 'fa fa-exclamation',
    },
  };
}

/**
 * This function returns the verify submit button for formCreator.
 * @returns {Object} Returns the verify submit button for formCreator.
 */
function resetPassword() {
  return {
    'gridProps': {
      style: {
        'justifyContent': 'center',
      },
      isMultiline: false,
      responsive: 'isMobile',
    },
    verify: {
      'type': 'submit',
      'value': 'Reset Password',
      name: 'resetPassword',
      'passProps': {
        color: 'isPrimary',
        style: {
          width: '100%',
        }
      },
      'layoutProps': {
      },
    },
  };
}


module.exports = {
  text,
  password,
  resetPassword,
}
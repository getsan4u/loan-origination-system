'use strict';

/** Form Creator for My Account modals */

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
        component: 'p',
        props: {
          style: {
            marginBottom: '1rem',
          },
        },
        children: str,
      },
    },
  };
}


/**
 * This function returns the email object for formCreator.
 * @returns {Object} Returns the email object for formCreator.
 */
function email() {
  return {
    validations: {
      username: [{
        constraint: 'email',
        message: '^A valid email address is required.',
      }, {
        constraint: 'presence',
        message: '^Your email is required.',
      }, {
        constraint: 'length',
        maximum: 100,
      },
      ],
    },
    username: {
      type: 'text',
      name: 'username',
      submitOnEnter: true,
      hasValidations: true,
      errorIcon: 'fa fa-exclamation',
      label: 'Email Address',
      layoutProps: {
        horizontalform: false,
      }
    },
  };
}


/**
 * This function returns the code object for formCreator.
 * @returns {Object} Returns the code object for formCreator.
 */
function code() {
  return {
    validations: {
      code: [{
        constraint: 'presence',
        message: '^Your code is required.',
      },
      ],
    },
    code: {
      type: 'text',
      name: 'code',
      hasValidations: true,
      submitOnEnter: true,
      errorIcon: 'fa fa-exclamation',
      label: 'Code',
      layoutProps: {
        horizontalform: false,
      }
    },
  };
}

/**
 * This function returns the phone object for formCreator.
 * @param {Object} copyText Object contains the text for the phone input.
 * @param {Object} constants Object contains the styling.
 * @returns {Object} Returns the phone object for formCreator.
 */
function phone() {
  return {
    validations: {
      phone: [{
        constraint: 'presence',
        message: '^Your phone number is required.',
      }, {
        constraint: 'length',
        is: 14,
        message: '^Your phone number must be 10 digits.',
      },
      ],
    },
    phone: {
      type: 'maskedinput',
      name: 'phone',
      submitOnEnter: true,
      label: 'Phone Number',
      passProps: {
        guide: false,
        mask: 'func:window.phoneNumberFormatter',
        autoComplete: 'off',
        autoCorrect: 'off',
        autoCapitalize: 'off',
        spellCheck: false,
      },
      layoutProps: {
        horizontalform: false,
      },
      hasValidations: true,
      errorIcon: 'fa fa-exclamation',
    },
  };
}

/**
 * This function returns the verify submit button for formCreator.
 * @returns {Object} Returns the verify submit button for formCreator.
 */
function continueButton() {
  return {
    'gridProps': {
      className: 'modal-footer-btns',
      style: {
        'justifyContent': 'center',
      },
      isMultiline: false,
      responsive: 'isMobile',
    },
    verify: {
      'type': 'submit',
      'value': 'CONTINUE',
      name: 'continue',
      'passProps': {
        color: 'isPrimary'
      },
      'layoutProps': {
        style: {
          textAlign: 'center',
        }
      },
    },
  };
}

module.exports = {
  text,
  email,
  code,
  phone,
  continueButton,
};
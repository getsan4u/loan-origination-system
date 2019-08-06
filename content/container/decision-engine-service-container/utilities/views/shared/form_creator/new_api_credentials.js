'use strict';

/** Form Creator for API Credentials page */

const { styles, } = require('../../constants');

/**
 * This function returns text for formCreator.
 * @params {String} str String to display as text in the form.
 * @returns {Object} Returns text for formCreator.
 */
function text(str1, str2) {
  return {
    gridProps: {
      style: {
        marginBottom: '1.5rem',
      },
    },
    text: {
      'type': 'layout',
      value: {
        component: 'div',
        children: [{
          component: 'span',
          props: {
            style: {
              textDecoration: 'underline',
            },
          },
          children: str2,
        }, {
          component: 'span',
          children: str1,
        },
        ],
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
        constraint: 'length',
        maximum: 30,
      },
      ],
    },
    password: {
      type: 'password',
      name: 'password',
      submitOnEnter: true,
      hasValidations: true,
      errorIcon: 'fa fa-exclamation',
      label: 'Password',
      layoutProps: {
        horizontalform: false,
      }
    },
  };
}

/**
 * This function returns the verify submit button for formCreator.
 * @returns {Object} Returns the verify submit button for formCreator.
 */
function verify() {
  return {
    'gridProps': {
      className: 'modal-footer-btns',
      isMultiline: false,
      responsive: 'isMobile',
    },
    verify: {
      'type': 'submit', 
      'value': 'VERIFY',
      name: 'verify',
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

/**
 * This function returns the confirm submit button for formCreator.
 * @returns {Object} Returns the confirm submit button for formCreator.
 */
function confirm() {
  return {
    'gridProps': {
      style: {
        'justifyContent': 'center',
      },
      isMultiline: false,
      responsive: 'isMobile',
    },
    confirm: {
      'type': 'submit',
      'value': 'Confirm',
      'name': 'confirm',
      'passProps': {
        color: 'isSuccess'
      },
      layoutProps: {
        size: 'isNarrow',
        style: {
          margin: '5px',
        }
      },
    },
  };
}

/**
 * This function returns the cancel button for formCreator.
 * @returns {Object} Returns the cancel button for formCreator.
 */
function cancel() {
  return {
    'gridProps': {
      style: {
        'justifyContent': 'center',
      },
      isMultiline: false,
      responsive: 'isMobile',
    },
    cancel: {
      type: 'layout',
      layoutProps: {
        size: 'isNarrow',
        style: {
          margin: '5px',
        }
      },
      value: {
        'component': 'ResponsiveButton',
        'children': 'Cancel',
        props: {
          onClick: 'func:this.props.hideModal',
          onclickProps: 'last',
          buttonProps: {
            color:'isDanger',
          },
        },
      },
    },
  };
}

module.exports = {
  text,
  password,
  verify,
  confirm,
  cancel,
}
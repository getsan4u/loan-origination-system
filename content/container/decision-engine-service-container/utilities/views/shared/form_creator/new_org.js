'use strict';

/** Form Creator for creating new organization and sign in page */

const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const { styles, } = require('../../constants');

const hiddenFields = [
];

/**
 * This function returns the name object for formCreator.
 * @returns {Object} Returns the name object for formCreator.
 */
function name() {
  return {
    validations: {
      first_name: [{
        constraint: 'presence',
        message: '^Your first name is required.',
      }, {
        constraint: 'length',
        message: '^Your first name must be under 30 characters.',
        maximum: 30,
      },
      ],
      last_name: [{
        constraint: 'presence',
        message: '^Your last name is required.',
      }, {
        constraint: 'length',
        message: '^Your last name must be under 30 characters.',
        maximum: 30,
      },
      ],
    },
    name: {
      type: 'group',
      groupElements: [
        {
          type: 'text',
          name: 'first_name',
          validateOnKeyup: false,
          placeholder: 'First Name',
          submitOnEnter: true,
          hasValidations: true,
          innerRow: true,
          errorIcon: 'fa fa-exclamation',

          keyUp: 'func:window.nameOnChange',
        },
        {
          type: 'text',
          name: 'last_name',
          submitOnEnter: true,
          validateOnKeyup: false,
          placeholder: 'Last Name',
          hasValidations: true,
          innerRow: true,
          errorIcon: 'fa fa-exclamation',
          keyUp: 'func:window.nameOnChange',
        },
      ],
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
        maximum: 60,
        message: '^Your email must be under 60 characters.',
      },
      ],
    },
    username: {
      type: 'text',
      name: 'username',
      submitOnEnter: true,
      keyUp: 'func:window.emailFormat',
      placeholder: 'Email',
      hasValidations: true,
      errorIcon: 'fa fa-exclamation',
    },
  };
}

/**
 * This function returns the email object for formCreator.
 * @returns {Object} Returns the email object for formCreator.
 */
function phone() {
  return {
    validations: {
      phone_number: [{
        constraint: 'presence',
        message: '^Your phone is required.',
      },
      {
        constraint: 'format',
        pattern: '((?=(.*\\d){10}).{14})',
        message: '^A valid phone is required.',
      },
      ],
    },
    phone_number: {
      type: 'maskedinput',
      passProps: {
        mask: 'func:window.phoneNumberFormatter',
        guid: false,
        placeholderChar: '\u2000',
      },
      name: 'phone_number',
      submitOnEnter: true,
      placeholder: 'Phone',
      hasValidations: true,
      errorIcon: 'fa fa-exclamation',
    },
  };
}

/**
 * This function returns the organization object for formCreator.
 * @returns {Object} Returns the organization object for formCreator.
 */
function organization() {
  return {
    validations: {
      name: [{
        constraint: 'presence',
        message: '^Your organization is required.',
      }, {
        constraint: 'length',
        maximum: 50,
        message: '^Your organization name must be under 50 characters.',
      },
      ],
    },
    name: {
      type: 'text',
      name: 'name',
      keyUp: 'func:window.organizationFormat',
      placeholder: 'Organization Name',
      submitOnEnter: true,
      hasValidations: true,
      errorIcon: 'fa fa-exclamation',
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
 * This function returns the create account button for formCreator.
 * @returns {Object} Returns the create account button for formCreator.
 */
function createAccount() {
  return {
    gridProps: {
      className: 'submit-wrapper',
    },
    createAccount: {
      'type': 'submit',
      'value': 'Create Account',
      'name': 'createAccount',
      'passProps': {
        color: 'isPrimary',
        style: {
          width: '100%',
        },
      },
      'layoutProps': {
        style: {
          textAlign: 'center',
        },
      },
    },
  };
}

/**
 * This function returns the sign in button for formCreator.
 * @returns {Object} Returns the sign in button for formCreator.
 */
function signIn() {
  return {
    gridProps: {
      style: {
        justifyContent: 'center',
      },
    },
    signIn: {
      'type': 'layout',
      'value': {
        component: 'ResponsiveLink',
        props: {
          location: '/auth/sign-in',
        },
        children: 'Sign In',
      },
      layoutProps: {
        size: 'isNarrow',
        style: {
          padding: '10px 3px',
        },
      },
    },
  };
}

/**
 * This function returns the sign in submit button for formCreator.
 * @returns {Object} Returns the sign in submit button for formCreator.
 */
function signInSubmit() {
  return {
    'gridProps': {
      style: {
      },
    },
    signInSubmit: {
      'type': 'submit',
      'value': 'Sign In',
      'name': 'signin',
      'passProps': {
        size: 'isMedium',
        color: 'isPrimary',
        style: {
          width: '100%',
        },
      },
      'layoutProps': {

      },
    },
  };
}

/**
 * This function returns the create account link for formCreator.
 * @returns {Object} Returns the create account link for formCreator.
 */
function createAccountLink() {
  return {
    gridProps: {
      style: {
        textAlign: 'center',
      },
    },
    createAccountLink: {
      'type': 'layout',
      'value': {
        component: 'ResponsiveLink',
        props: {
          location: '/auth/create-account',
        },
        children: 'Create Account',
      },
      'name': 'register',
      'layoutProps': {
        style: {
          color: styles.colors.primary,
        },
      },
    },
  };
}

/**
 * This function returns the reset password link for formCreator.
 * @returns {Object} Returns the reset password link for formCreator.
 */
function resetPassword() {
  return {
    'gridProps': {
      style: {
        textAlign: 'center',
      },
    },
    resetPassword: {
      'type': 'layout',
      value: {
        component: 'ResponsiveLink',
        props: {
          location: '/auth/password-reset',
        },
        children: 'Reset Password',
      },
      'layoutProps': {
      },
    },
  };
}

/**
 * This function returns the consent box object for formCreator.
 * @returns {Object} Returns the consent box object for formCreator.
 */
function consentBox() {
  return {
    gridProps: {
      responsive: 'isMobile',
      style: {},
    },
    validations: {
      consents: [{
        constraint: 'presence',
        message: '^Please check the box to continue.',
      }, {
        constraint: 'inclusion',
        'within': ['on', ],
        'message': '^Please check the box to continue.',
      }, ],
    },
    consentBox: {
      type: 'group',
      groupElements: [{
        type: 'Semantic.checkbox',
        name: 'consents',
        validateOnChange: true,
      },
      {
        type: 'layout',
        layoutProps: {
          style: {
            marginTop: '-3px',
          }
        },
        value: {
          component: 'div',
          children: [{
            component: 'span',
            children: 'I agree to the ',
          },
          {
            component: 'span',
            children: [{
              component: 'a',
              props: {
                href: 'https://digifi.io/legal/terms-and-conditions',
                target: '_blank',
                style: {
                  textDecoration: 'none',
                },
              },
              children: `${THEMESETTINGS.company_name} Platform Terms and Conditions`,
            }, {
              component: 'span',
              children: ', ',
            }, {
              component: 'a',
              props: {
                href: 'https://digifi.io/legal/website-terms-of-service',
                target: '_blank',
                style: {
                  textDecoration: 'none',
                },
              },
              children: 'Website Terms of Service ',
            }, {
              component: 'span',
              children: 'and ',
            }, {
              component: 'a',
              props: {
                href: 'https://digifi.io/legal/privacy-policy',
                target: '_blank',
                style: {
                  textDecoration: 'none',
                },
              },
              children: 'Privacy Policy',
            }, ],
          }, ], 
        },
      },
      ],
      customErrorProps: {
        fontSize: styles.fontSizes.contentSmall.fontSize,
      },
      layoutProps: {
        className: 'consent-check-wrapper',
      },
    },

  };
}

/**
 * This function returns text for formCreator.
 * @param {string} text text for formCreator.
 * @returns {Object} Returns text for formCreator.
 */
function text(text) {
  return {
    gridProps: {
      style: {
        'justifyContent': 'center',
      },
    },
    text: {
      'type': 'layout',
      layoutProps: {
        size: 'isNarrow',
        style: {
          padding: '10px 3px',
        },
      },
      value: {
        component: 'div',
        children: text,
      },
    },
  };
}

/**
 * This function returns text for formCreator.
 * @param {string} text text for formCreator.
 * @returns {Object} Returns text for formCreator.
 */
function fullText(text) {
  return {
    gridProps: {
    },
    text: {
      'type': 'layout',
      value: {
        component: 'p',
        children: text,
      },
    },
  };
}

module.exports = {
  hiddenFields,
  name,
  email,
  organization,
  phone,
  password,
  createAccount,
  signIn,
  createAccountLink,
  signInSubmit,
  resetPassword,
  consentBox,
  text,
  fullText,
};

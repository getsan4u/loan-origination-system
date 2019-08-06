'use strict';

/** Form Creator for creating new organization and sign in page */

const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const { styles, } = require('../../constants');

const hiddenFields = [
];

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
      keyUp: 'func:window.emailFormat',
      submitOnEnter: true,
      placeholder: 'Email',
      hasValidations: true,
      errorIcon: 'fa fa-exclamation',
      label: '',
    },
  };
}

/**
 * This function returns the organization object for formCreator.
 * @returns {Object} Returns the organization object for formCreator.
 */
function organization(organizationName) {
  return {
    validations: {
      name: [{
        constraint: 'presence',
        message: '^Your organization is required.',
      },
      ],
    },
    organization: {
      type: 'text',
      name: 'name',
      keyUp: 'func:window.organizationFormat',
      submitOnEnter: true,
      value: (organizationName) ? organizationName : '',
      placeholder: 'Organization',
      hasValidations: true,
      errorIcon: 'fa fa-exclamation',
      label: '',
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
      label: '',
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
        'justifyContent': 'center',
        marginBottom: 0,
      },
    },
    resetPassword: {
      'type': 'layout',
      layoutProps: {
        size: 'isNarrow',
        style: {
          padding: '10px 3px',
        }
      },
      value: {
        component: 'ResponsiveLink',
        props: {
          location: '/auth/password-reset',
        },
        children: 'Reset Password',
      },
    },
  };
}

/**
 * This function returns the reset password link for formCreator.
 * @returns {Object} Returns the reset password link for formCreator.
 */
function recoverOrganization() {
  return {
    'gridProps': {
      style: {
        'justifyContent': 'center',
        marginBottom: 0,
      },
    },
    recoverOrganization: {
      'type': 'layout',
      layoutProps: {
        size: 'isNarrow',
        style: {
          padding: '10px 3px',
        }
      },
      value: {
        component: 'ResponsiveLink',
        props: {
          location: '/auth/organization-recovery',
        },
        children: 'Recover Organization',
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
        }
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
        justifyContent: 'center',
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
      layoutProps: {
        size: 'isNarrow',
        style: {
          padding: '10px 3px',
        }
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
        marginBottom: 0,
      },
    },
    text: {
      'type': 'layout',
      layoutProps: {
        size: 'isNarrow',
        style: {
          padding: '10px 3px',
        }
      },
      value: {
        component: 'div',
        children: text,
      },
    },
  };
}

module.exports = {
  hiddenFields,
  email,
  organization,
  password,
  resetPassword,
  recoverOrganization,
  signInSubmit,
  createAccountLink,
  text,
};

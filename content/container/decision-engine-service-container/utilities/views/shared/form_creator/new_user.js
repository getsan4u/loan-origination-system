'use strict';

/** Form Creator for adding new users modal */

const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const { styles, } = require('../../constants');

/**
 * This function returns the firstname object for formCreator.
 * @returns {Object} Returns the firstname object for formCreator.
 */
function firstname() {
  return {
    validations: {
      first_name: [{
        constraint: 'presence',
        message: '^First Name is required.',
      }, {
        constraint: 'length',
        message: '^First Name is required.',
        maximum: 30,
      },
      ],
    },
    firstname: {
      type: 'text',
      name: 'first_name',
      submitOnEnter: true,
      hasValidations: true,
      errorIcon: 'fa fa-exclamation',
      label: 'First Name',
      layoutProps: {
        horizontalform: false,
      }
    },
  };
}

/**
 * This function returns the lastname object for formCreator.
 * @returns {Object} Returns the lastname object for formCreator.
 */
function lastname() {
  return {
    validations: {
      last_name: [{
        constraint: 'presence',
        message: '^Last Name is required.',
      }, {
        constraint: 'length',
        message: '^Last Name is required.',
        maximum: 30,
      },
      ],
    },
    lastname: {
      type: 'text',
      name: 'last_name',
      submitOnEnter: true,
      hasValidations: true,
      errorIcon: 'fa fa-exclamation',
      label: 'Last Name',
      layoutProps: {
        horizontalform: false,
      }
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
        message: '^Email Address is required.',
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
      },
    },
  };
}

/**
 * This function returns the type dropdown object for formCreator.
 * @returns {Object} Returns the type dropdown object for formCreator.
 */
function type() {
  return {
    validations: {
      type: [{
        constraint: 'exclusion',
        within: ['Type', ],
        message: '^Permissions Type is required.',
      }, {
        constraint: 'length',
        maximum: 30,
      },
      ],
    },
    type: {
      type: 'dropdown',
      label: 'Permissions Type',
      name: 'type',
      value: 'Type',
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      layoutProps: {
        horizontalform: false,
      },
      passProps: {
        className: '__select_initial',
        fluid: true,
        selection: true,
      },
      options: [{
        label: ' ',
        value: 'Type',
        disabled: true,
      }, {
        label: 'Owner',
        value: 'owner',
      }, {
        label: 'Admin',
        value: 'admin',
      }, {
        label: 'User',
        value: 'user',
      },
      ],
    },
  };
}

/**
 * This function returns the add user button for formCreator.
 * @returns {Object} Returns the add user button for formCreator.
 */
function addUser() {
  return {
    gridProps: {
      className: 'modal-footer-btns',
    },
    addUser: {
      'type': 'submit',
      'value': 'ADD USER',
      'name': 'addUser',
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
  firstname,
  lastname,
  email,
  type,
  addUser,
};

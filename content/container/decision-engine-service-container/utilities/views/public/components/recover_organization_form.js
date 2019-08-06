'use strict';
const hrline = require('./hrline');
const { styles, } = require('../../constants');
module.exports = {
  'component': 'ResponsiveForm',
  'props': {
    onSubmit: {
      url: '/auth/recover_organization',
      // url: `${reactadmin.manifest_prefix}auth/forgot`,
      options: {
        method: 'POST',
      },
      success: {
        notification: {
          text: 'Your organization name was sent to your email address',
          timeout: 10000,
          type: 'success',
        },
      },
      successCallback: 'func:this.props.refresh',
    },
    hiddenFields: [
      {
        form_name: 'entitytype',
        form_static_val: 'user',
      },
    ],
    'validations': [
      {
        'name': 'username',
        'constraints': {
          'username': {
            presence: {
              message: '^Your email is required.',
            },
            'email': {
              message: '^A valid email address is required.',
            },
            'length': {
              'minimum': 3,
              'maxinum': 60,
              'message': '^Your email is required.',
            },
          },
        },
      },
    ],
    'formgroups': [
      {
        'gridProps': {},
        'formElements': [{
          type: 'layout',
          value: {
            component: 'div',
            children: 'Please enter your email address and we’ll send the name of your organization to you by email.',
          },
        },
        ],
      },
      {
        'gridProps': {},
        'formElements': [{
          type: 'text',
          label: '',
          name: 'username',
          placeholder: 'Email',
          errorIconRight: true,
          errorIcon: 'fa fa-exclamation',
          keyUp: 'func:window.emailFormat',
          onBlur: true,
          validateOnBlu: true,
          hasValidations: true,    
          submitOnEnter: true,
          // passProps: {
          //   type: 'email',
          // },
        },
        ],
      },
      // hrline,
      {
        'gridProps': {
          style: {
            justifyContent: 'center',
            alignItems: 'center',
          },
        },
        'formElements': [
          {
            'type': 'submit',
            'value': 'Recover Organization',
            // "placeholder": "Remember Me",
            'name': 'recoverorganization',
            'passProps': {
              color: 'isPrimary',
              style: {
                width: '100%',
              }
            },
            'layoutProps': {
            },
          },
        ],
      },
      {
        'gridProps': {
          style: {
            justifyContent: 'center',
            alignItems: 'center',
          },
        },
        'formElements': [
            {
            'type': 'layout',
            'value': {
              component: 'ResponsiveLink',
              props: {
                location:'/auth/sign-in',
              },
              children:'Sign In',
            },
            'layoutProps': {
              style: {
                textAlign: 'center',
              }
            },
          },
        ],
      },
    ],
  },
};
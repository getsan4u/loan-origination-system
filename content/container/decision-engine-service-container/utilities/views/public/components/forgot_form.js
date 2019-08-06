'use strict';
const hrline = require('./hrline');
const { styles, } = require('../../constants');
module.exports = {
  'component': 'ResponsiveForm',
  'props': {
    // 'cardForm': true,
    // // cardFormTitle:'Sign In',
    // 'cardFormProps': {
    //   'isFullwidth': true,
    // },
    onSubmit: {
      url: '/auth/forgot_password',
      // url: `${reactadmin.manifest_prefix}auth/forgot`,
      options: {
        method: 'POST',
      },
      success: {
        notification: {
          text: 'Password reset instructions were sent to your email address',
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
              'message': '^Your email is required.',
            },
          },
        },
      }, {
        'name': 'name',
        'constraints': {
          'name': {
            presence: {
              message: '^Your organization is required.',
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
            children: 'Please enter your organization and email address, and we’ll send you a link to reset your password.',
          },
        },
        ],
      },
      {
        'gridProps': {},
        'formElements': [{
          'type': 'text',
          'label': '',
          'name': 'name',
          'placeholder': 'Organization',
          'errorIconRight': true,
          'errorIcon': 'fa fa-exclamation',
          keyUp: 'func:window.organizationFormat',
          onBlur: true,
          validateOnBlur: true,
          'submitOnEnter': true,
          // 'passProps': {
          //   'type': 'organization',
          // },
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
            'value': 'Reset Password',
            // "placeholder": "Remember Me",
            'name': 'recoverpassword',
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
            'justifyContent': 'center',
            marginBottom: 0,
          },
        },
        'formElements': [{
          'type': 'layout',
          layoutProps: {
            size: 'isNarrow',
            style: {
              padding: '10px 3px',
            }
          },
          value: {
            component: 'div',
            children: 'Forgot Organization?',
          },
        }, {
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
        },]
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
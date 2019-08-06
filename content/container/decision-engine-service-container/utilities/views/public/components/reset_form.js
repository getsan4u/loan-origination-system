'use strict';
const { styles, } = require('../../constants');
module.exports ={
  'component': 'ResponsiveForm',
  asyncprops: {
    formdata: [ 'tokendata', 'data', 'user' ]
  },
  'props': {
    // "cardForm": true,
    // // cardFormTitle:'Register',
    // "cardFormProps": {
    //   "isFullwidth": true,
    // },
    onSubmit: {
      url: '/auth/reset/:token',
      params: [
        {
          key: ':token',
          val: 'token',
        },
      ],
      options: {
        method: 'POST',
      },
      success: {
        notification: {
          text: 'Password reset successfully',
          timeout: 10000,
          type: 'success',
        },
      },
      successCallback: 'func:this.props.reduxRouter.push',
      successProps: '/auth/login',
    },
    hiddenFields: [
      {
        form_name: 'token',
        form_val: 'token',
      },
      {
        form_name: 'entitytype',
        form_static_val: 'account',
      },
    ],
    'validations': [
      {
        'name': 'password',
        'constraints': {
          'password': {
            presence: {
              message: '^Your username is required',
            },
            'length': {
              'minimum': 8,
              'message': '^Your password is too short',
            },
          },
        },
      },
    ],
    'formgroups': [
      {
        'gridProps': {},
        'formElements': [{
          'type': 'text',
          'label': 'Email',
          'name': 'email',
          disabled: true,
          // "submitOnEnter": true,
          'passProps': {
            'type': 'email',
            state: 'isDisabled',
          },
        }, ],
      },
      {
        'gridProps': {},
        'formElements': [{
          'type': 'text',
          'label': 'Password',
          'name': 'password',
          // "submitOnEnter": true,
          'passProps': {
            'type': 'password',
          },
        }, ],
      },
      {
        'gridProps': {},
        'formElements': [{
          'type': 'text',
          'label': 'Confirm password',
          'name': 'passwordconfirm',
          'submitOnEnter': true,
          'passProps': {
            'type': 'password',
          },
        }, ],
      },
      // hrline,
      {
        'gridProps': {
          style: {
            justifyContent: 'center',
          },
        },
        'formElements': [
          {
            'type': 'submit',
            'value': 'Reset',
            // "placeholder": "Remember Me",
            'name': 'reset',
            'passProps': {
              size: 'isLarge',
              style: styles.buttons.approve,
            },
            'layoutProps': {
              formItemStyle: {
                justifyContent: 'center',
              },
            },
          },
          {
            'type': 'layout',
            'value': {
              component: 'ResponsiveLink',
              props: {
                location:'/auth/login',
              },
              children:'Login',
            },
            'layoutProps': {
              style: {
                alignSelf:'center',
                textAlign:'center',
              },
            },
          },
        ],
      },
    ],
  },
};
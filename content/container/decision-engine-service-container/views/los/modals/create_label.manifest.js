'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/applicationlabels/new': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          props: {
            // blockPageUI: true,
            // blockPageUILayout: styles.modalBlockPageUILayout,
            flattenFormData: true,
            footergroups: false,
            'onSubmit': {
              url: '/los/api/applicationlabels?format=json',
              options: {
                method: 'POST',
              },
              successCallback: 'func:window.closeModalAndCreateNotification',
              successProps: {
                text: 'Changes saved successfully!',
                timeout: 10000,
                type: 'success',
              },
              responseCallback: 'func:this.props.refresh',
            },
            validations: [ {
              'name': 'name',
              'constraints': {
                'name': {
                  'presence': {
                    'message': '^Label Name is required.',
                  },
                },
              },
            }, {
              'name': 'color',
              'constraints': {
                'color': {
                  'presence': {
                    'message': '^Color is required.',
                  },
                },
              },
            }, ],
            formgroups: [ {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'name',
                label: 'Label Name',
                errorIconRight: true,
                validateOnBlur: true,
                onBlur: true,
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'color',
                value: '#007aff',
                type: 'colorpicker',
                label: 'Color',
                errorIconRight: true,
                validateOnBlur: true,
                onBlur: true,
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'submit',
                value: 'CREATE LABEL',
                passProps: {
                  color: 'isSuccess',
                },
                layoutProps: {},
              }, ],
            },
            ],
          },
          asyncprops: {},
        },
        ],
      },
      'resources': {
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: [ 'func:window.redirect', ],
            onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      callbacks: [ 'func:window.setHeaders', ],
      'onFinish': 'render',
    },
  },
};
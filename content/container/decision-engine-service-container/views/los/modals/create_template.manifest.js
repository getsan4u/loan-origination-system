'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/templates/new': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          props: {
            blockPageUI: true,
            blockPageUILayout: styles.modalBlockPageUILayout,
            flattenFormData: true,
            footergroups: false,
            'onSubmit': {
              url: '/los/api/templates?format=json',
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
                    'message': '^Document Template Name is required.',
                  },
                },
              },
            }, ],
            formgroups: [ {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                type: 'file',
                label: 'Please Select PDF Template File (Fillable PDF Only)',
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'name',
                label: 'Document Template Name',
                errorIconRight: true,
                validateOnBlur: true,
                onBlur: true,
              }, ],
            }, /*{
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: 'Description',
                  }, {
                    component: 'span',
                    children: 'Optional',
                    props: {
                      style: {
                        fontStyle: 'italic',
                        marginLeft: '2px',
                        fontWeight: 'normal',
                        color: '#969696',
                      },
                    },
                  }, ],
                },
                name: 'description',
                type: 'textarea',
                errorIconRight: true,
                errorIcon: 'fa fa-exclamation',
              }, ],
            }, */{
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'layout',
                value: {
                  component: 'ResponsiveButton',
                  children: 'DOWNLOAD SAMPLE FILE',
                  props: {
                    'onclickBaseUrl': '/los/api/download_sample_template',
                    aProps: {
                      className: '__re-bulma_button __re-bulma_is-primary',
                      token: true,
                    },
                  },
                },
              }, {
                type: 'submit',
                value: 'CREATE TEMPLATE',
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
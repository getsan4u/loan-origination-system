'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/products/new': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          props: {
            flattenFormData: true,
            footergroups: false,
            setInitialValues: false,
            'onSubmit': {
              url: '/los/api/products?format=json',
              options: {
                method: 'POST',
              },
              successCallback: 'func:window.closeModalAndCreateNotification',
              successProps: {
                text: 'Changes saved successfully!',
                timeout: 10000,
                type: 'success',
              },
              responseCallback: 'func:this.props.reduxRouter.push',
            },
            validations: [{
              'name': 'name',
              'constraints': {
                'name': {
                  'presence': {
                    'message': '^Product Name is required.',
                  },
                },
              },
            }, {
              'name': 'customer_type',
              'constraints': {
                'customer_type': {
                  'presence': {
                    'message': '^Customer Type is required.',
                  },
                },
              },
            },],
            formgroups: [ {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'name',
                label: 'Product Name',
                errorIconRight: true,
                validateOnBlur: true,
                onBlur: true,
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'customer_type',
                label: 'Customer Type',
                type: 'dropdown',
                errorIconRight: true,
                validateOnChange: true,
                errorIcon: 'fa fa-exclamation',
                validIcon: 'fa fa-check',
                passProps: {
                  selection: true,
                  fluid: true,
                  search: false,
                  selectOnBlur: false,
                },
                options: [ {
                  label: 'Person',
                  value: 'person',
                }, {
                  label: 'Company',
                  value: 'company',
                } ]
              }, ],
            }, {
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
            }, {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'submit',
                value: 'CREATE PRODUCT',
                passProps: {
                  color: 'isPrimary',
                },
                layoutProps: {},
              },
              ],
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
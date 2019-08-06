'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/customer_templates/:id/add_template_item': {
      layout: {
        privileges: [ 101, 102, 103, ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: [ 'urldata', ],
          },
          props: {
            flattenFormData: true,
            footergroups: false,
            setInitialValues: false,
            'onSubmit': {
              url: '/los/api/customer_templates/:id?format=json&type=patch_template_item',
              options: {
                method: 'PUT',
              },
              params: [ { key: ':id', val: '_id', }, ],
              successCallback: 'func:window.closeModalAndCreateNotification',
              successProps: {
                text: 'Changes saved successfully!',
                timeout: 10000,
                type: 'success',
              },
              responseCallback: 'func:this.props.refresh',
            },
            validations: [
              {
                'name': 'name',
                'constraints': {
                  'name': {
                    'presence': {
                      'message': '^Description is required.',
                    },
                  },
                },
              },
              {
                'name': 'value_type',
                'constraints': {
                  'value_type': {
                    'presence': {
                      'message': '^Data Type is required.',
                    },
                  },
                },
              },
            ],
            formgroups: [ {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'name',
                label: 'Description',
                errorIconRight: true,
                validateOnBlur: true,
                onBlur: true,
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                type: 'dropdown',
                name: 'value_type',
                label: 'Data Type',
                errorIconRight: true,
                validateOnChange: true,
                errorIcon: 'fa fa-exclamation',
                validIcon: 'fa fa-check',
                passProps: {
                  selection: true,
                  fluid: true,
                  selectOnBlur: false,
                },
                options: [ {
                  label: 'Text',
                  value: 'text',
                }, {
                  label: 'Monetary',
                  value: 'monetary',
                }, {
                  label: 'Percentage',
                  value: 'percentage',
                }, {
                  label: 'Number',
                  value: 'number',
                }, {
                  label: 'Date',
                  value: 'date',
                }, {
                  label: 'True/False',
                  value: 'boolean',
                } ],
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'submit',
                value: 'ADD ITEM',
                passProps: {
                  color: 'isPrimary',
                },
                layoutProps: {},
              },
              ],
            },
            ],
          },
        },
        ],
      },
      'resources': {
        urldata: '/los/api/customer_templates/:id/getTemplateId',
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
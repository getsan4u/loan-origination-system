'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/customer_templates/:id/edit_template_item/:idx': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: [ 'templatedata', 'data', ],
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
            validations: [],
            formgroups: [ {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'name',
                label: 'Description',
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                type: 'dropdown',
                name: 'value_type',
                label: 'Data Type',
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
                value: 'SAVE CHANGES',
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
        templatedata: '/los/api/customer_templates/:id/template/:idx',
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
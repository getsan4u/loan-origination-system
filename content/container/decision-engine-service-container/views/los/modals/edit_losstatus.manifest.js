'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/statuses/:id': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: [ 'statusdata', 'losstatus' ],
          },
          props: {
            flattenFormData: true,
            footergroups: false,
            setInitialValues: false,
            useFormOptions: true,
            'onSubmit': {
              url: '/los/api/statuses/:id',
              options: {
                headers: {},
                method: 'PUT',
              },
              params: [ {
                key: ':id',
                val: '_id',
              } ],
              responseCallback: 'func:window.setHeaders',
              successCallback: [ 'func:window.closeModalAndCreateNotification', 'func:this.props.refresh' ],
              successProps: [ {
                text: 'Changes saved successfully!',
                timeout: 10000,
                type: 'success',
              }, {} ]
            },
            validations: [],
            formgroups: [ {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'name',
                label: 'Status Name',
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
        statusdata: '/los/api/statuses/:id?',
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
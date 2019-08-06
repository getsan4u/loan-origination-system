'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    [ '/los/people/:id/rename' ]: {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: [ 'peopledata', 'person' ],
          },
          props: {
            flattenFormData: true,
            footergroups: false,
            onSubmit: {
              url: '/los/api/customers/people/:id',
              params: [ { key: ':id', val: '_id', }, ],
              'options': {
                'method': 'PUT',
              },
              successCallback: [ 'func:this.props.hideModal', 'func:this.props.createNotification', ],
              successProps: [ 'last', {
                type: 'success',
                text: 'Changes saved successfully!',
                timeout: 10000,
              },
              ],
              responseCallback: 'func:this.props.refresh',
            },
            validations: [],
            formgroups: [ {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                label: 'Name',
                name: 'name',
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
        peopledata: '/los/api/customers/people/:id',
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
    [ '/los/companies/:id/rename' ]: {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: [ 'companydata', 'company' ],
          },
          props: {
            flattenFormData: true,
            footergroups: false,
            onSubmit: {
              url: '/los/api/customers/companies/:id',
              params: [ { key: ':id', val: '_id', }, ],
              'options': {
                'method': 'PUT',
              },
              successCallback: [ 'func:this.props.hideModal', 'func:this.props.createNotification', ],
              successProps: [ 'last', {
                type: 'success',
                text: 'Changes saved successfully!',
                timeout: 10000,
              },
              ],
              responseCallback: 'func:this.props.refresh',
            },
            validations: [],
            formgroups: [ {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                label: 'Name',
                name: 'name',
              } ],
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
        companydata: '/los/api/customers/companies/:id',
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
    [ '/los/intermediaries/:id/rename' ]: {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: [ 'intermediarydata', 'intermediary' ],
          },
          props: {
            flattenFormData: true,
            footergroups: false,
            onSubmit: {
              url: '/los/api/intermediaries/:id',
              params: [ { key: ':id', val: '_id', }, ],
              'options': {
                'method': 'PUT',
              },
              successCallback: [ 'func:this.props.hideModal', 'func:this.props.createNotification', ],
              successProps: [ 'last', {
                type: 'success',
                text: 'Changes saved successfully!',
                timeout: 10000,
              },
              ],
              responseCallback: 'func:this.props.refresh',
            },
            validations: [],
            formgroups: [ {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                label: 'Name',
                name: 'name',
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
        intermediarydata: '/los/api/intermediaries/:id',
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
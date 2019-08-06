'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/applications/:id/close_loan_application': {
      layout: {
        privileges: [ 101, 102, 103, ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: ['pagedata'],
          },
          props: {
            flattenFormData: true,
            footergroups: false,
            'onSubmit': {
              url: '/los/api/applications/:id?status=reject',
              params: [ { key: ':id', val: '_id', }, ],
              options: {
                method: 'PUT',
              },
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
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: 'Reason',
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
                name: 'reason',
                type: 'dropdown',
                passProps: {
                  selection: true,
                  fluid: true,
                  search: false,
                  selectOnBlur: false,
                },
                options: [ {
                  label: '',
                  value: '',
                }, {
                  label: 'The application was rejected',
                  value: 'rejected',
                }, {
                  label: 'The customer did not respond',
                  value: 'no_response',
                }, {
                  label: 'The customer declined the offer',
                  value: 'declined_offer',
                }, {
                  label: 'Unable to verify required information',
                  value: 'not_verified',
                }, {
                  label: 'Other reason',
                  value: 'other',
                }]
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
                    children: 'Comments',
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
                name: 'comments',
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
                value: 'REJECT LOAN APPLICATION',
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
        pagedata: '/los/api/get_parsed_url?parsed_id=2',
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
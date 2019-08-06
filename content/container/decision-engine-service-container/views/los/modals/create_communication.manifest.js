'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/communications/new': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: [ 'communicationdata', 'formdata' ],
            __formOptions: [ 'communicationdata', 'formoptions' ],
          },
          props: {
            setInitialValues: false,
            flattenFormData: false,
            footergroups: false,
            'onSubmit': {
              url: '/los/api/communications',
              options: {
                method: 'POST',
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
            validations: [ {
              'name': 'type',
              'constraints': {
                'type': {
                  'presence': {
                    'message': '^Type is required.',
                  },
                },
              },
            }, ],
            formgroups: [ {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'type',
                type: 'dropdown',
                label: 'Type',
                updateIconOnChange: true,
                validateOnChange: true,
                errorIconRight: true,
                passProps: {
                  selection: true,
                  fluid: true,
                  search: false,
                  selectOnBlur: false,
                },
                options: [{
                  value: 'phone',
                  label: 'Phone Call',
                  icon: 'phone rotated'
                }, {
                  value: 'email',
                  label: 'Email',
                  icon: 'envelope outline',
                }, {
                  value: 'meeting',
                  label: 'Meeting',
                  icon: 'users'
                }, {
                  value: 'other',
                  label: 'Other',
                  icon: 'ellipsis horizontal'
                }, ],
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                type: 'singleDatePicker',
                name: 'date',
                leftIcon: 'fas fa-calendar-alt',
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: 'Date',
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
                passProps: {
                  placeholder: '',
                  hideKeyboardShortcutsPanel: true,
                },
              },
              ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'team_members',
                type: 'dropdown',
                leftIcon: 'fas fa-users',
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: 'Team Members',
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
                passProps: {
                  multiple: true,
                  selection: true,
                  fluid: true,
                  search: true,
                },
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
                    children: 'People',
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
                name: 'people',
                type: 'dropdown',
                leftIcon: 'fas fa-user',
                passProps: {
                  selection: true,
                  multiple: true,
                  fluid: true,
                  search: true,
                },
              },
              ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: 'Subject',
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
                name: 'subject',
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
                type: 'textarea'
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'submit',
                value: 'ADD COMMUNICATION',
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
        communicationdata: '/los/api/communications/new?action_type=create',
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
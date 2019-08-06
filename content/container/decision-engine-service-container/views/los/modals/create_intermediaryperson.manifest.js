'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/intermediaries/:id/new/new_person': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            __formOptions: [ 'intermediarydata', 'formoptions', ],
            formdata: [ 'intermediarydata', 'formdata', ],
          },
          props: {
            setInitialValues: false,
            flattenFormData: true,
            footergroups: false,
            useFormOptions: true,
            'onSubmit': {
              url: '/los/api/customers',
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
                    'message': '^Name is required.',
                  },
                },
              },
            }, {
              'name': 'intermediary',
              'constraints': {
                'intermediary': {
                  'presence': {
                    'message': '^Intermediary is required.',
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
                label: 'Name',
                errorIconRight: true,
                validateOnBlur: true,
                onBlur: true,
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'intermediary',
                label: 'Intermediary',
                type: 'dropdown',
                errorIconRight: true,
                validateOnChange: true,
                errorIcon: 'fa fa-exclamation',
                validIcon: 'fa fa-check',
                passProps: {
                  selection: true,
                  fluid: true,
                  search: true,
                  selectOnBlur: false,
                },
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'job_title',
                type: 'text',
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: 'Job Title',
                  }, {
                    component: 'span',
                    children: 'Optional',
                    props: {
                      style: {
                        fontStyle: 'italic',
                        marginLeft: '2px',
                        fontWeight: 'normal',
                        color: styles.colors.regGreyText,
                      },
                    },
                  }, ],
                },
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [
                {
                  type: 'maskedinput',
                  name: 'phone',
                  customLabel: {
                    component: 'span',
                    children: [ {
                      component: 'span',
                      children: 'Phone Number',
                    }, {
                      component: 'span',
                      children: 'Optional',
                      props: {
                        style: {
                          fontStyle: 'italic',
                          marginLeft: '2px',
                          fontWeight: 'normal',
                          color: styles.colors.regGreyText,
                        },
                      },
                    }, ],
                  },
                  passProps: {
                    guide: false,
                    mask: 'func:window.phoneNumberFormatter',
                    autoComplete: 'off',
                    autoCorrect: 'off',
                    autoCapitalize: 'off',
                    spellCheck: false,
                  },
                },
              ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'email',
                type: 'text',
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: 'Email Address',
                  }, {
                    component: 'span',
                    children: 'Optional',
                    props: {
                      style: {
                        fontStyle: 'italic',
                        marginLeft: '2px',
                        fontWeight: 'normal',
                        color: styles.colors.regGreyText,
                      },
                    },
                  }, ],
                },
              }, ],
            }, {
              gridProps: { key: randomKey(), style: { textAlign: 'right', }, },
              formElements:
                [ {
                  type: 'Semantic.checkbox',
                  label: 'Set as intermediary primary contact',
                  passProps: { className: 'reverse-label', },
                  layoutProps: { style: {}, },
                  name: 'is_intermediary_primary_contact',
                }, ],
            }, {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'submit',
                value: 'ADD PERSON',
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
        intermediarydata: '/los/api/intermediaries/:id/add_person?type=new',
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
    '/los/intermediaries/:id/new/existing_person': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            __formOptions: [ 'intermediarydata', 'formoptions', ],
            formdata: [ 'intermediarydata', 'formdata', ],
          },
          props: {
            setInitialValues: false,
            flattenFormData: true,
            footergroups: false,
            useFormOptions: true,
            'onSubmit': {
              url: '/los/api/customers/people/:id',
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
            validations: [ {
              'name': 'person',
              'constraints': {
                'person': {
                  'presence': {
                    'message': '^Name is required.',
                  },
                },
              },
            }, {
              'name': 'intermediary',
              'constraints': {
                'intermediary': {
                  'presence': {
                    'message': '^Intermediary is required.',
                  },
                },
              },
            }, ],
            formgroups: [ {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'person',
                label: 'Name',
                type: 'dropdown',
                errorIconRight: true,
                validateOnChange: true,
                errorIcon: 'fa fa-exclamation',
                validIcon: 'fa fa-check',
                passProps: {
                  selection: true,
                  fluid: true,
                  search: true,
                  selectOnBlur: false,
                },
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'intermediary',
                label: 'Intermediary',
                type: 'dropdown',
                errorIconRight: true,
                validateOnChange: true,
                errorIcon: 'fa fa-exclamation',
                validIcon: 'fa fa-check',
                passProps: {
                  selection: true,
                  fluid: true,
                  search: true,
                  selectOnBlur: false,
                },
              }, ],
            }, {
              gridProps: { key: randomKey(), style: { textAlign: 'right', }, },
              formElements:
                [ {
                  type: 'Semantic.checkbox',
                  label: 'Set as intermediary primary contact',
                  passProps: { className: 'reverse-label', },
                  layoutProps: { style: {}, },
                  name: 'is_intermediary_primary_contact',
                }, ],
            }, {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'submit',
                value: 'ADD PERSON',
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
        intermediarydata: '/los/api/intermediaries/:id/add_person?type=existing',
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
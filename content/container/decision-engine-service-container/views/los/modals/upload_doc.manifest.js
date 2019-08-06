'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/upload_doc/application': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: [ 'docdata', 'formdata' ],
            __formOptions: [ 'docdata', 'formoptions' ],
          },
          props: {
            blockPageUI: true,
            blockPageUILayout: styles.modalBlockPageUILayout,
            flattenFormData: true,
            footergroups: false,
            setInitialValues: false,
            useFormOptions: true,
            'onSubmit': {
              url: '/los/api/docs?upload=true&association=application',
              options: {
                headers: {},
                method: 'POST',
              },
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
                label: 'File Selection',
                type: 'file',
                name: 'selected_file',
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'application',
                type: 'dropdown',
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: 'Application',
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
                name: 'name',
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: 'Document Name',
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
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'submit',
                value: 'UPLOAD DOCUMENT',
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
        docdata: '/los/api/docs/new?action_type=create&association=application',
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
    '/los/upload_doc/company': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: [ 'docdata', 'formdata' ],
            __formOptions: [ 'docdata', 'formoptions' ],
          },
          props: {
            blockPageUI: true,
            blockPageUILayout: styles.modalBlockPageUILayout,
            flattenFormData: true,
            footergroups: false,
            setInitialValues: false,
            useFormOptions: true,
            'onSubmit': {
              url: '/los/api/docs?upload=true&association=company',
              options: {
                headers: {},
                method: 'POST',
              },
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
                label: 'File Selection',
                type: 'file',
                name: 'selected_file',
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'company',
                type: 'dropdown',
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: 'Company',
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
                name: 'name',
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: 'Document Name',
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
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'submit',
                value: 'UPLOAD DOCUMENT',
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
        docdata: '/los/api/docs/new?action_type=create&association=company&prepopulate=true',
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
    '/los/upload_doc/person': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: [ 'docdata', 'formdata' ],
            __formOptions: [ 'docdata', 'formoptions' ],
          },
          props: {
            blockPageUI: true,
            blockPageUILayout: styles.modalBlockPageUILayout,
            flattenFormData: true,
            footergroups: false,
            setInitialValues: false,
            useFormOptions: true,
            'onSubmit': {
              url: '/los/api/docs?upload=true&association=person',
              options: {
                headers: {},
                method: 'POST',
              },
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
                label: 'File Selection',
                type: 'file',
                name: 'selected_file',
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'person',
                type: 'dropdown',
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: 'Person',
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
                name: 'name',
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: 'Document Name',
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
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'submit',
                value: 'UPLOAD DOCUMENT',
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
        docdata: '/los/api/docs/new?action_type=create&association=person&prepopulate=true',
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
    '/los/upload_doc/intermediary': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: [ 'docdata', 'formdata' ],
            __formOptions: [ 'docdata', 'formoptions' ],
          },
          props: {
            blockPageUI: true,
            blockPageUILayout: styles.modalBlockPageUILayout,
            flattenFormData: true,
            footergroups: false,
            setInitialValues: false,
            useFormOptions: true,
            'onSubmit': {
              url: '/los/api/docs?upload=true&association=intermediary',
              options: {
                headers: {},
                method: 'POST',
              },
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
                label: 'File Selection',
                type: 'file',
                name: 'selected_file',
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'intermediary',
                type: 'dropdown',
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: 'Intermediary',
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
                name: 'name',
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: 'Document Name',
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
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'submit',
                value: 'UPLOAD DOCUMENT',
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
        docdata: '/los/api/docs/new?action_type=create&association=intermediary&prepopulate=true',
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
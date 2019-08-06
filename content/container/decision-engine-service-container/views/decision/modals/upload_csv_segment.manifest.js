'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/modal/decision/upload_csv_segment/outputs': {
      layout: {
        privileges: [101, 102, 103],
        component: 'Container',
        props: {},
        children: [{
          component: 'ResponsiveForm',
          props: {
            blockPageUI: true,
            blockPageUILayout: styles.modalBlockPageUILayout,
            flattenFormData: true,
            footergroups: false,
            'onSubmit': {
              url: '/decision/api/upload_csv_segment?format=json&unflatten=true&handleupload=true&bulk=true',
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
            formgroups: [
              {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  label: 'Rules Upload File',
                  type: 'file',
                  name: 'segment',
                  thisprops: {},
                },
                ],
              }, 
              {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [{
                  type: 'layout',
                  value: {
                    component: 'ResponsiveButton',
                    children: 'DOWNLOAD TEMPLATE',
                    thisprops: {},
                    props: {
                      'onclickBaseUrl': '/decision/api/download_standard_rules_template?type=outputs&format=json&export_format=csv',
                      onClick: 'func:window.hideModal',
                      aProps: {
                        className: '__re-bulma_button __re-bulma_is-primary',
                      },
                    },
                  },
                }, 
                {
                  type: 'submit',
                  value: 'UPLOAD FILE',
                  passProps: {
                    color: 'isSuccess',
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
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      callbacks: ['func:window.setHeaders', 'func:window.filterDataSourceFile',],
      'onFinish': 'render',
    },
    '/modal/decision/upload_csv_segment/requirements': {
      layout: {
        privileges: [101, 102, 103],
        component: 'Container',
        props: {},
        children: [{
          component: 'ResponsiveForm',
          props: {
            blockPageUI: true,
            blockPageUILayout: styles.modalBlockPageUILayout,
            flattenFormData: true,
            footergroups: false,
            'onSubmit': {
              url: '/decision/api/upload_csv_segment?format=json&unflatten=true&handleupload=true&bulk=true',
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
            formgroups: [
              {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  label: 'Rules Upload File',
                  type: 'file',
                  name: 'segment',
                  thisprops: {},
                },
                ],
              }, 
              {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [{
                  type: 'layout',
                  value: {
                    component: 'ResponsiveButton',
                    children: 'DOWNLOAD TEMPLATE',
                    thisprops: {},
                    props: {
                      'onclickBaseUrl': '/decision/api/download_standard_rules_template?type=requirements&format=json&export_format=csv',
                      onClick: 'func:window.hideModal',
                      aProps: {
                        className: '__re-bulma_button __re-bulma_is-primary',
                      },
                    },
                  },
                }, 
                {
                  type: 'submit',
                  value: 'UPLOAD FILE',
                  passProps: {
                    color: 'isSuccess',
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
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      callbacks: ['func:window.setHeaders', 'func:window.filterDataSourceFile',],
      'onFinish': 'render',
    },
    '/modal/decision/upload_csv_segment/scorecard': {
      layout: {
        privileges: [101, 102, 103],
        component: 'Container',
        props: {},
        children: [{
          component: 'ResponsiveForm',
          props: {
            blockPageUI: true,
            blockPageUILayout: styles.modalBlockPageUILayout,
            flattenFormData: true,
            footergroups: false,
            'onSubmit': {
              url: '/decision/api/upload_csv_segment?format=json&unflatten=true&handleupload=true&bulk=true',
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
            formgroups: [
              {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  label: 'Rules Upload File',
                  type: 'file',
                  name: 'segment',
                  thisprops: {},
                },
                ],
              }, 
              {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [{
                  type: 'layout',
                  value: {
                    component: 'ResponsiveButton',
                    children: 'DOWNLOAD TEMPLATE',
                    thisprops: {},
                    props: {
                      'onclickBaseUrl': '/decision/api/download_standard_rules_template?type=scorecard&format=json&export_format=csv',
                      onClick: 'func:window.hideModal',
                      aProps: {
                        className: '__re-bulma_button __re-bulma_is-primary',
                      },
                    },
                  },
                }, 
                {
                  type: 'submit',
                  value: 'UPLOAD FILE',
                  passProps: {
                    color: 'isSuccess',
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
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      callbacks: ['func:window.setHeaders', 'func:window.filterDataSourceFile',],
      'onFinish': 'render',
    },
    '/modal/decision/upload_csv_segment/assignments': {
      layout: {
        privileges: [101, 102, 103],
        component: 'Container',
        props: {},
        children: [{
          component: 'ResponsiveForm',
          props: {
            blockPageUI: true,
            blockPageUILayout: styles.modalBlockPageUILayout,
            flattenFormData: true,
            footergroups: false,
            'onSubmit': {
              url: '/decision/api/upload_csv_segment?format=json&unflatten=true&handleupload=true&bulk=true',
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
            formgroups: [
              {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  label: 'Rules Upload File',
                  type: 'file',
                  name: 'segment',
                  thisprops: {},
                },
                ],
              }, 
              {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [{
                  type: 'layout',
                  value: {
                    component: 'ResponsiveButton',
                    children: 'DOWNLOAD TEMPLATE',
                    thisprops: {},
                    props: {
                      'onclickBaseUrl': '/decision/api/download_standard_rules_template?type=assignments&format=json&export_format=csv',
                      onClick: 'func:window.hideModal',
                      aProps: {
                        className: '__re-bulma_button __re-bulma_is-primary',
                      },
                    },
                  },
                }, 
                {
                  type: 'submit',
                  value: 'UPLOAD FILE',
                  passProps: {
                    color: 'isSuccess',
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
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      callbacks: ['func:window.setHeaders', 'func:window.filterDataSourceFile',],
      'onFinish': 'render',
    },
    '/modal/decision/upload_csv_segment/calculations': {
      layout: {
        privileges: [101, 102, 103],
        component: 'Container',
        props: {},
        children: [{
          component: 'ResponsiveForm',
          props: {
            blockPageUI: true,
            blockPageUILayout: styles.modalBlockPageUILayout,
            flattenFormData: true,
            footergroups: false,
            'onSubmit': {
              url: '/decision/api/upload_csv_segment?format=json&unflatten=true&handleupload=true&bulk=true',
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
            formgroups: [
              {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  label: 'Rules Upload File',
                  type: 'file',
                  name: 'segment',
                  thisprops: {},
                },
                ],
              }, 
              {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [{
                  type: 'layout',
                  value: {
                    component: 'ResponsiveButton',
                    children: 'DOWNLOAD TEMPLATE',
                    thisprops: {},
                    props: {
                      'onclickBaseUrl': '/decision/api/download_standard_rules_template?type=calculations&format=json&export_format=csv',
                      onClick: 'func:window.hideModal',
                      aProps: {
                        className: '__re-bulma_button __re-bulma_is-primary',
                      },
                    },
                  },
                }, 
                {
                  type: 'submit',
                  value: 'UPLOAD FILE',
                  passProps: {
                    color: 'isSuccess',
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
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      callbacks: ['func:window.setHeaders', 'func:window.filterDataSourceFile',],
      'onFinish': 'render',
    },
    '/modal/decision/upload_csv_segment/population': {
      layout: {
        privileges: [101, 102, 103],
        component: 'Container',
        props: {},
        children: [{
          component: 'ResponsiveForm',
          props: {
            blockPageUI: true,
            blockPageUILayout: styles.modalBlockPageUILayout,
            flattenFormData: true,
            footergroups: false,
            'onSubmit': {
              url: '/decision/api/upload_csv_segment?type=population&format=json&unflatten=true&handleupload=true&bulk=true',
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
            formgroups: [
              {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  label: 'Rules Upload File',
                  type: 'file',
                  name: 'segment',
                  thisprops: {},
                },
                ],
              }, 
              {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [{
                  type: 'layout',
                  value: {
                    component: 'ResponsiveButton',
                    children: 'DOWNLOAD TEMPLATE',
                    thisprops: {},
                    props: {
                      'onclickBaseUrl': '/decision/api/download_standard_rules_template?type=population&format=json&export_format=csv',
                      onClick: 'func:window.hideModal',
                      aProps: {
                        className: '__re-bulma_button __re-bulma_is-primary',
                      },
                    },
                  },
                }, 
                {
                  type: 'submit',
                  value: 'UPLOAD FILE',
                  passProps: {
                    color: 'isSuccess',
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
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      callbacks: ['func:window.setHeaders', 'func:window.filterDataSourceFile',],
      'onFinish': 'render',
    },
  },
};
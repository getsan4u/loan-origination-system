'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/optimization/create_data_source': {
      layout: {
        privileges: [101, 102,],
        component: 'Container',
        props: {},
        children: [{
          component: 'ResponsiveForm',
          hasWindowFunc: true,
          props: {
            ref: 'func:window.addRef',
            blockPageUI: true,
            blockPageUILayout: styles.modalBlockPageUILayout,
            flattenFormData: true,
            footergroups: false,
            'onSubmit': {
              url: '/optimization/api/data_source?format=json&unflatten=true&handleupload=true&upload=true&export_format=csv',
              options: {
                method: 'POST',
                timeout: 500000,
              },
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
                "name": "data_source_name",
                "constraints": {
                  "data_source_name": {
                    "presence": {
                      "message": "^Data Source Name is required."
                    }
                  }
                }
              },
            ],
            formgroups: [{
                gridProps: {
                  key: randomKey(),
                },
                formElements: [{
                  label: 'Data Source Upload File',
                  type: 'file',
                  name: 'data_source',
                  passProps: {
                    accept: '.csv',
                  },
                  layoutProps: {
                    style: {
                      textAlign: 'center',
                      padding: 0,
                    },
                  },
                  thisprops: {},
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [
                {
                  label: 'Data Source Name',
                  name: 'data_source_name',
                  onBlur: true,
                  validateOnBlur: true,
                  errorIconRight: true,
                  layoutProps: {
                    style: {
                      textAlign: 'center',
                      padding: 0,
                    },
                  },
                },
                ],
              }, {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns'
                },
                formElements: [{
                  type: 'layout',
                  value: {
                    component: 'ResponsiveButton',
                    children: 'DOWNLOAD TEMPLATE',
                    thisprops: {},
                    props: {
                      'onclickBaseUrl': '/optimization/api/download_data_source_template?format=json&export_format=csv',
                      onClick: 'func:window.hideModal',
                      aProps: {
                        className: '__re-bulma_button __re-bulma_is-primary',
                        token: true,
                      },
                    },
                  },
                }, {
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
              onSuccess: [ 'func:window.redirect', ],
              onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
              blocking: true, 
              renderOnError: false,
            },
          },
      },
      callbacks: ['func:window.setHeaders', 'func:window.filterDataSourceFile'],
      'onFinish': 'render',
    },
  },
};
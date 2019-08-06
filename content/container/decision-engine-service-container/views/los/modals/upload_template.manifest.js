'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/templates/:id/upload': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: [ 'urldata' ],
          },
          props: {
            blockPageUI: true,
            blockPageUILayout: styles.modalBlockPageUILayout,
            flattenFormData: true,
            footergroups: false,
            'onSubmit': {
              url: '/los/api/templates/:id/upload_template?format=json&type=upload_template',
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
                type: 'file',
                label: 'Please Select PDF Template File (Fillable PDF Only)',
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                type: 'layout',
                value: {
                  component: 'p',
                  children: 'Warning: This file will replace your existing template.  Please confirm before proceeding.'
                },
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'submit',
                value: 'YES, UPLOAD',
                passProps: {
                  color: 'isSuccess',
                },
                layoutProps: {},
              }, {
                type: 'layout',
                value: {
                  component: 'ResponsiveButton',
                  children: 'NO, GO BACK',
                  props: {
                    onClick: 'func:this.props.hideModal',
                    onclickProps: 'last',
                    buttonProps: {
                      color: 'isPrimary',
                    },
                  },
                },
              },
              ],
            },
            ],
          },
        },
        ],
      },
      'resources': {
        urldata: '/los/api/get_parsed_url?parsed_id=3',
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
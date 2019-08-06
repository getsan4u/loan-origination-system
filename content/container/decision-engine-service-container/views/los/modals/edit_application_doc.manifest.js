'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/docs/:id/edit_file/:application_id': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: [ 'docdata', 'doc', ],
            __formOptions: [ 'docdata', 'formoptions' ],
          },
          props: {
            flattenFormData: true,
            footergroups: false,
            setInitialValues: false,
            useFormOptions: true,
            'onSubmit': {
              url: '/los/api/docs/:id/edit_file?format=json&type=patch_file_name_and_location',
              options: {
                method: 'PUT',
              },
              params: [ { key: ':id', val: '_id', } ],
              successCallback: 'func:window.closeModalAndCreateNotification',
              successProps: {
                text: 'Changes saved successfully!',
                timeout: 10000,
                type: 'success',
              },
              responseCallback: 'func:this.props.reduxRouter.push',
            },
            validations: [
              {
                'name': 'name',
                'constraints': {
                  'name': {
                    'presence': {
                      'message': '^File Name is required.',
                    },
                  },
                },
              },
            ],
            hiddenFields: [ {
              'form_name': 'id',
              'form_val': '_id',
            }, {
              'form_name': 'doc_type',
              'form_val': 'doc_type',
            }, ],
            formgroups: [ {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'name',
                label: 'File Name',
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                type: 'dropdown',
                name: 'parent_directory',
                passProps: {
                  selection: true,
                  fluid: true,
                  search: true,
                  selectOnBlur: false,
                },
                customLabel: {
                  component: 'span',
                  children: [ {
                    component: 'span',
                    children: 'File Folder',
                  }, {
                    component: 'span',
                    children: 'Optional',
                    props: {
                      style: {
                        fontStyle: 'italic',
                        marginLeft: '2px',
                        fontWeight: 'normal',
                        color: styles.colors.regGreyText,
                      }
                    }
                  } ]
                },
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
        docdata: '/los/api/docs/:id/edit_file/:application_id',
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
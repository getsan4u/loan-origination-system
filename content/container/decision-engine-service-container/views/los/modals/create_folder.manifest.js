'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/applications/:id/create_folder': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: [ 'applicationdata', 'application' ],
            __formOptions: ['applicationdata', 'formoptions',],
          },
          props: {
            flattenFormData: true,
            footergroups: false,
            setInitialValues: false,
            useFormOptions: true,
            'onSubmit': {
              url: '/los/api/applications/:id/docs/new_folder',
              params: [ { key: ':id', val: '_id', }, ],
              options: {
                headers: {},
                method: 'POST',
              },
              responseCallback: 'func:window.setHeaders',
              successCallback: ['func:window.closeModalAndCreateNotification', 'func:this.props.refresh'],
              successProps: [{
                text: 'Changes saved successfully!',
                timeout: 10000,
                type: 'success',
              }, {}]
            },
            validations: [
              {
                'name': 'name',
                'constraints': {
                  'name': {
                    'presence': {
                      'message': '^Folder Name is required.',
                    },
                  },
                },
              },
            ],
            formgroups: [ {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                label: 'Name',
                type: 'text',
                name: 'name',
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'parent_directory',
                type: 'dropdown',
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
                        color: '#969696',
                      },
                    },
                  }, ],
                },
                passProps: {
                  selection: true,
                  fluid: true,
                  search: true,
                  selectOnBlur: false,
                },
              },],
            }, {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'submit',
                value: 'CREATE FOLDER',
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
        applicationdata: '/los/api/applications/:id/docs/new',
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
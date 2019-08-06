'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/applications/:id/select_template': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: [ 'docdata', 'formdata', ],
            __formOptions: [ 'docdata', 'formoptions' ],
          },
          props: {
            flattenFormData: true,
            footergroups: false,
            setInitialValues: false,
            useFormOptions: true,
            'onSubmit': {
              url: '/los/api/applications/:id/select_template?',
              options: {
                method: 'POST',
              },
              params: [ { key: ':id', val: '_id', } ],
              successCallback: 'func:this.props.createNotification',
              successProps: {
                text: 'Changes saved successfully!',
                timeout: 10000,
                type: 'success',
              },
              responseCallback: 'func:window.closeModalAndCreateNewModal',
            },
            validations: [{
              'name': 'template',
              'constraints': {
                'template': {
                  'presence': {
                    'message': '^Template is required.',
                  },
                },
              },
            },],
            formgroups: [ {
              gridProps: {
                key: randomKey(),
              },
              formElements: [  {
                name: 'template',
                label: 'Select Template',
                type: 'dropdown',
                validateOnChange: true,
                errorIconRight: true,
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
                value: 'CONTINUE',
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
        docdata: '/los/api/applications/:id/select_template',
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
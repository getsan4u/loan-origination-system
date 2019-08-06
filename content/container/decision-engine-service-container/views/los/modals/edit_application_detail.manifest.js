'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/applications/edit/:id': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [{
          component: 'ResponsiveForm',
          asyncprops: {
            formdata: ['applicationdata', 'application', ],
            __formOptions: ['applicationdata', 'formoptions', ],
          },
          props: {
            flattenFormData: true,
            footergroups: false,
            onSubmit: {
              url: '/los/api/applications/:id',
              'options': {
                'method': 'PUT',
              },
              params: [{
                key: ':id',
                val: '_id',
              }, ],
              successCallback: ['func:this.props.refresh', 'func:window.closeModalAndCreateNotification'],
              successProps: [null, {
                type: 'success',
                text: 'Changes saved successfully!',
                timeout: 10000,
              }, ],
            },
            validations: [{
              'name': 'title',
              'constraints': {
                'title': {
                  'presence': {
                    'message': '^Title is required.',
                  },
                },
              },
            }, ],
            formgroups: [{
              gridProps: {
                key: randomKey(),
              },
              formElements: [
                {
                  type: 'text',
                  name: 'title',
                  leftIcon: 'fas fa-file-alt',
                  placeholder: undefined,
                  label: 'Title',
                  passProps: {},
                },
              ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                label: 'Labels',
                name: 'labels',
                type: 'dropdown',
                leftIcon: 'fas fa-tags',
                passProps: {
                  selection: true,
                  multiple: true,
                  fluid: true,
                  search: true,
                },
              },
              ],
            },
            {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [{
                type: 'submit',
                value: 'SAVE',
                passProps: {
                  color: 'isPrimary',
                },
                layoutProps: {},
              }, ],
            },
            ],
          },
        },
        ],
      },
      'resources': {
        applicationdata: '/los/api/applications/:id?action_type=edit',
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
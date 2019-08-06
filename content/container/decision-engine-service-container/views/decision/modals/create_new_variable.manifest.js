'use strict';

const moment = require('moment');
const utilities = require('../../../utilities');
const randomKey = Math.random;
const pluralize = require('pluralize');
const styles = utilities.views.constants.styles;
const util = require('util');
const getRadioButtonGroup = utilities.views.decision.shared.components.radioButtonGroup;

module.exports = {
  'containers': {
    [ `/decision/variables/create` ]: {
      layout: {
        component: 'Hero',
        children: [ {
          component: 'ResponsiveForm',
          props: {
            flattenFormData: true,
            footergroups: false,
            useFormOptions: true,
            onChange: 'func:window.checkVariableSystemName',
            onSubmit: {
              url: `/decision/api/standard_variables`,
              options: {
                headers: {
                  'Content-Type': 'application/json',
                },
                method: 'POST',
              },
              successProps: ['last', {
                type: 'success',
                text: 'Changes saved successfully!',
                timeout: 10000,
              },
              ],
              successCallback: ['func:this.props.hideModal', 'func:this.props.createNotification', ],
              responseCallback: 'func:this.props.refresh',
            },
            formgroups: [ {
              gridProps: { key: randomKey() },
              formElements:
                [ {
                  name: 'name',
                  label: 'Variable Display Name',
                  validateOnBlur: true,
                  keyUp: 'func:window.variableNameOnChange',
                  onBlur: true,
                  errorIconRight: true,
                  errorIcon: 'fa fa-exclamation',
                  layoutProps: {}
                }]
            },
            {
              gridProps: { key: randomKey() },
              formElements:
                [ {
                  name: 'type',
                  label: 'Variable Type',
                  type: 'dropdown',
                  value: '',
                  validateOnChange: true,
                  passProps: { selection: true, fluid: true },
                  errorIconRight: true,
                  errorIcon: 'fa fa-exclamation',
                  layoutProps: {},
                  options:
                    [ { label: ' ', value: '' },
                    { label: 'Input', value: 'Input' },
                    { label: 'Output', value: 'Output' }]
                }],
            },
            {
              gridProps: { key: randomKey() },
              formElements:
                [ {
                  name: 'data_type',
                  label: 'Data Type',
                  type: 'dropdown',
                  value: '',
                  validateOnChange: true,
                  passProps: { selection: true, fluid: true },
                  errorIconRight: true,
                  errorIcon: 'fa fa-exclamation',
                  layoutProps: {},
                  options:
                    [ { label: ' ', value: '' },
                    { label: 'Number', value: 'Number' },
                    { label: 'String', value: 'String' },
                    { label: 'Boolean', value: 'Boolean' },
                    { label: 'Date', value: 'Date' }]
                }]
            },
            {
              gridProps: { key: randomKey() },
              formElements:
                [ {
                  name: 'description',
                  label: 'Description',
                  type: 'textarea',
                  validateOnBlur: true,
                  onBlur: true,
                  errorIconRight: true,
                  errorIcon: 'fa fa-exclamation',
                  placeholder: ' ',
                  layoutProps: {}
                }]
            },
            {
              gridProps: { key: randomKey(), style: { textAlign: 'right' } },
              formElements:
                [ {
                  type: 'Semantic.checkbox',
                  label: 'Set a variable system name',
                  passProps: { className: 'reverse-label' },
                  layoutProps: { style: {} },
                  name: 'has_variable_system_name'
                }]
            },
            {
              gridProps: { key: randomKey(), className: 'variable_system_name' },
              formElements:
                [ {
                  label: 'Variable System Name (Automatically generated if left blank)',
                  name: 'variable_system_name',
                  onChangeFilter: 'func:window.cleanVariableSystemName',
                  passProps: { color: 'isPrimary' },
                  layoutProps: { style: { textAlign: 'center', padding: 0 } }
                }]
            },
            {
              gridProps: { key: randomKey(), className: 'modal-footer-btns' },
              formElements:
                [ {
                  type: 'submit',
                  value: 'CREATE VARIABLE',
                  passProps: { color: 'isPrimary' },
                  layoutProps: { style: { textAlign: 'center', padding: 0 } }
                }]
            }]
          },
          asyncprops: {
          },
        }, ],
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
      'callbacks': ['func:window.globalBarSaveBtn', 'func:window.hideVariableSystemName'],
      'pageData': {
        // 'title': `${options.title}`,
        'navLabel': 'Decision Engine',
      },
      'onFinish': 'render',
    },
  },
};
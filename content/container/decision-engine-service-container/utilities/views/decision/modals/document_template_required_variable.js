'use strict';

const moment = require('moment');
const shared_utilities = require('../shared');
const styles = require('../../constants').styles;
const randomKey = Math.random;
const formConfig = shared_utilities.components.formConfigs;
const pluralize = require('pluralize');

function createModal(options) {
  let { inputs, strategy, variable_dropdown, fileurl, filename, } = options;
  let form = {
    'component': 'ResponsiveForm',
    'thisprops': {},
    'asyncprops': {},
    hasWindowFunc: true,
    'props': {
      'onSubmit': {
        'url': `/decision/api/standard_strategies/${strategy._id.toString()}/edit_documentcreation_variables?variables=required&variable_type=input`,
        'errorCallback': 'func:this.props.createNotification',
        'options': {
          'method': 'PUT',
        },
        successCallback: [ 'func:this.props.refresh', 'func:this.props.hideModal', 'func:this.props.createNotification', ],
        successProps: [ null, 'last', {
          type: 'success',
          text: 'Changes saved successfully!',
          timeout: 10000,
        },
        ],
      },
      formdata: inputs.reduce((acc, curr, idx) => {
        acc[ `variables.${idx}.input_variable` ] = curr.input_variable ? curr.input_variable : '';
        acc[ `variables.${idx}.input_type` ] = curr.input_type ? curr.input_type : 'variable';
        return acc;
      }, {}),
      hiddenFields: Array.prototype.concat.apply([], [inputs.map((input, idx) => ({
        form_name: `variables.${idx}.display_name`,
        form_static_val: input.display_name,
      })), inputs.map((input, idx) => ({
        form_name: `variables.${idx}.field_type`,
        form_static_val: input.field_type,
      })), [{
        form_name: 'fileurl',
        form_static_val: fileurl,
      }, {
        form_name: 'filename',
        form_static_val: filename,
      }]]),
      'formgroups': inputs.map((input, idx) => {
        return {
          'gridProps': {
            'key': randomKey(),
          },
          'formElements': [ {
            'layoutProps': {
              style: {
                display: [ 'variable', undefined, ].indexOf(input.input_type) !== -1 ? 'block' : 'none',
              },
            },
            'type': 'dropdown',
            'name': `variables.${idx}.input_variable`,
            customLabel: {
              component: 'span',
              children: [ {
                component: 'div',
                children: [ {
                  component: 'span',
                  children: input.display_name,
                }, {
                  component: 'span',
                  props: {
                    style: {
                      fontStyle: 'italic',
                      fontWeight: 'normal',
                      color: '#ccc',
                      marginLeft: '7px',
                    },
                  },
                  children: input.data_type,
                },
                ],
              }, {
                component: 'div',
                props: {
                  style: {
                    fontWeight: 'normal',
                  },
                },
                children: input.description,
              }, {
                component: 'div',
                props: {
                  style: {
                    fontWeight: 'normal',
                  },
                },
                children: input.example ? `e.g. ${input.example}` : '',
              },
              ],
            },
            'passProps': {
              'className': input.display_name.toLowerCase().replace(/[\W]+/g, '_'),
              selection: true,
              fluid: true,
              search: true,
            },
            'options': variable_dropdown,
          },
          input.data_type === 'Boolean'
            ? {
              'layoutProps': {
                style: {
                  display: [ 'value', ].indexOf(input.input_type) !== -1 ? 'block' : 'none',
                },
              },
              'type': 'dropdown',
              'name': `variables.${idx}.input_variable`,
              customLabel: {
                component: 'span',
                children: [ {
                  component: 'div',
                  children: [ {
                    component: 'span',
                    children: input.display_name,
                  }, {
                    component: 'span',
                    props: {
                      style: {
                        fontStyle: 'italic',
                        fontWeight: 'normal',
                        color: '#ccc',
                        marginLeft: '7px',
                      },
                    },
                    children: input.data_type,
                  },
                  ],
                }, {
                  component: 'div',
                  props: {
                    style: {
                      fontWeight: 'normal',
                    },
                  },
                  children: input.description,
                },
                ],
              },
              'passProps': {
                'className': input.display_name.toLowerCase().replace(/[\W]+/g, '_'),
                'fluid': true,
                'selection': true,
                search: true,
              },
              'options': [ { 'label': ' ', 'value': '', }, { 'label': 'true', 'value': 'true', }, { 'label': 'false', 'value': 'false', }, ],
            }
            : {
              'type': 'text',
              'name': `variables.${idx}.input_variable`,
              customLabel: {
                component: 'span',
                children: [ {
                  component: 'div',
                  children: [ {
                    component: 'span',
                    children: input.display_name,
                  }, {
                    component: 'span',
                    props: {
                      style: {
                        fontStyle: 'italic',
                        fontWeight: 'normal',
                        color: '#ccc',
                        marginLeft: '7px',
                      },
                    },
                    children: input.data_type,
                  },
                  ],
                }, {
                  component: 'div',
                  props: {
                    style: {
                      fontWeight: 'normal',
                    },
                  },
                  children: input.description,
                },
                ],
              },
              'layoutProps': {
                style: {
                  display: input.input_type === 'value' ? 'block' : 'none',
                },
              },
              passProps: {
                'className': input.display_name.toLowerCase().replace(/[\W]+/g, '_'),
              },
            },
          {
            'layoutProps': {
              size: 'is4',
              style: {
                marginLeft: '7px',
                display: 'flex',
                flexDirection: 'column',
                alignSelf: 'flex-end',
                fontWeight: 'normal',
              },
            },
            customOnChange: 'func:window.requiredVariablesModal',
            'type': 'dropdown',
            customLabel: (idx === 0)
              ? {
                component: 'ResponsiveButton',
                props: {
                  onClick: 'func:window.closeModalAndCreateNewModal',
                  onclickProps: {
                    title: 'Create New Variable',
                    pathname: '/decision/variables/create',
                  },
                },
                children: 'Create New Variable',
              }
              : 'Input Type',
            labelProps: (idx === 0)
              ? {
                style: {
                  textAlign: 'right',
                  fontWeight: 'normal',
                },
              }
              : {
                style: {
                  visibility: 'hidden',
                },
              },
            'name': `variables.${idx}.input_type`,
            'passProps': {
              'className': input.display_name.toLowerCase().replace(/[\W]+/g, '_'),
              'fluid': true,
              'selection': true,
            },
            'options': [ {
              'label': 'Variable',
              'value': 'variable',
            },
            {
              'label': 'Value',
              'value': 'value',
            },
            ],
          },
          ],
        };
      }).concat([ {
        'gridProps': {
          'key': randomKey(),
          'className': 'modal-footer-btns',
        },
        'formElements': [ {
          'name': 'saveRequiredVariables',
          'type': 'submit',
          'value': 'SAVE CHANGES',
          'passProps': {
            'color': 'isPrimary',
          },
          'layoutProps': {
            'style': {
              'textAlign': 'center',
            },
          },
        }, ],
      }, ]),
    },
  };

  return {
    component: 'Hero',
    props: {
    },
    children: [ form, ],
  }
}

module.exports = createModal;
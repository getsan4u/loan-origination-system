'use strict';
const capitalize = require('capitalize');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const formConfigs = require('../../../utilities/views/decision/shared/components/formConfigs');
const decisionTabs = require('../../../utilities/views/decision/shared/components/decisionTabs');
const collectionDetailTabs = require('../../../utilities/views/decision/shared/components/collectionDetailTabs');
const detailAsyncHeaderTitle = require('../../../utilities/views/shared/component/layoutComponents').detailAsyncHeaderTitle;
const detailHeaderButtons = require('../../../utilities/views/decision/shared/components/detailHeaderButtons');
const styles = require('../../../utilities/views/constants/styles');
const CONSTANTS = require('../../../utilities/views/decision/constants');
const cardprops = require('../../../utilities/views/decision/shared/components/cardProps');
const formElements = require('../../../utilities/views/decision/shared/components/formElements');
const COMPARATOR_DROPDOWN = CONSTANTS.COMPARATOR_DROPDOWN;
const randomKey = Math.random;
const settings = {
  title: 'Rule Detail',
  type: 'rule',
  location: 'detail',
};

function getRuleFormElement(options) {
  let { prop, index } = options;
  let ruleFormElements = {
    name: {
      name: 'name',
      label: 'Rule Name',
      type: 'text',
      validateOnBlur: true,
      passProps: {
        state: 'isDisabled'
      },
      onBlur: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      layoutProps: {
        style: {
          width: '50%',
          paddingRight: '7px',
        }
      },
    },
    rule_type: {
      name: 'rule_type',
      label: 'Rule Type',
      type: 'dropdown',
      layoutProps: {
        style: {
          width: '50%',
        }
      },
      value: '',
      passProps: {
        selection: true,
        fluid: true,
        disabled: true,
      },
      options: [ {
        label: ' ',
        value: '',
      }, {
        label: 'Simple Rule',
        value: 'simple',
      }, {
        label: 'Combination Rule: AND',
        value: 'AND',
      }, {
        label: 'Combination Rule: OR',
        value: 'OR',
      }, ],
      validateOnChange: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
    },
    description: {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      placeholder: ' ',
      layoutProps: {
      },
    },
    state_property_attribute: {
      name: `rule*${index}*state_property_attribute`,
      value: '',
      errorIconRight: true,
      label: 'Variable',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      type: 'remote_dropdown',
      passProps: {
        emptyQuery: true,
        search: true,
        multiple: false,
        debounce: 250,
        searchProps: {
          baseUrl: '/decision/api/variable_dropdown?',
          limit: 100,
          sort: 'display_title',
          response_field: 'variable_dropdown',
        },
      },
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
        }
      },
    },
    variable_type: {
      type: 'layout',
      name: `rule*${index}*variable_type`,
      passProps: {
        className: '__re-bulma_column',
      },
      layoutProps: {
        style: {
          width: '30%',
        }
      },
      value: {
        component: 'div',
        props: {
          className: '__re-bulma_control __form_element_has_value',
        },
        children: [{
          component: 'label',
          props: {
            className: '__re-bulma_label',
            style: {
              textAlign: 'right',
            }
          },
          children: [{
            component: 'ResponsiveButton',
            children: 'Create New Variable',
            props: {
              onClick: 'func:window.closeModalAndCreateNewModal',
              onclickProps: {
                title: 'Create New Variable',
                pathname: '/decision/variables/create',
              },
              style: {
                display: 'inline-block',
                lineHeight: 1,
                fontWeight: 'normal',
                cursor: 'pointer',
                border: 'transparent',
              },
            },
          },]
        },
        {
          component: 'Input',
          props: {
            readOnly: true,
            value: '',
          }
        }]
      }
    },
    state_property_attribute_value_comparison: {
      name: `rule*${index}*state_property_attribute_value_comparison`,
      validateOnBlur: true,
      onBlur: true,
      errorIcon: 'fa fa-exclamation',
      errorIconRight: true,
      label: 'Value',
      type: 'text',
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
    },
    state_property_attribute_value_comparison_type: {
      name: `rule*${index}*state_property_attribute_value_comparison_type`,
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      value: 'value',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      errorIconRight: true,
      options: [ {
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      }],
      label: 'Value type',
      labelProps: {
        style: {
          visibility: 'hidden',
          whiteSpace: 'nowrap',
        }
      },
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
    },
    state_property_attribute_value_minimum: {
      name: `rule*${index}*state_property_attribute_value_minimum`,
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      createNumberMask: true,
      value: '',
      passProps: {
        mask: 'func:window.numberMaskTwo',
        guid: false,
        placeholderChar: '\u2000',
      },
      label: 'Minimum',
      type: 'text',
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
        }
      },
    },
    state_property_attribute_value_minimum_type: {
      name: `rule*${index}*state_property_attribute_value_minimum_type`,
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      value: 'value',
      validateOnChange: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      options: [ {
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      }],
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
      label: 'Minimum Type',
      labelProps: {
        style: {
          visibility: 'hidden',
          whiteSpace: 'nowrap',
        }
      },
    },
    state_property_attribute_value_maximum: {
      name: `rule*${index}*state_property_attribute_value_maximum`,
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      createNumberMask: true,
      errorIcon: 'fa fa-exclamation',
      value: '',
      passProps: {
        mask: 'func:window.numberMaskTwo',
        guid: false,
        placeholderChar: '\u2000',
      },
      label: 'Maximum',
      type: 'text',
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
        }
      },
    },
    state_property_attribute_value_maximum_type: {
      name: `rule*${index}*state_property_attribute_value_maximum_type`,
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      value: 'value',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      errorIconRight: true,
      options: [ {
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      }],
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      },
      label: 'Maximum Type',
      labelProps: {
        style: {
          visibility: 'hidden',
          whiteSpace: 'nowrap',
        }
      },
    },
    condition_operation: {
      name: 'condition_operation',
      label: 'Operator',
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      value: 'AND',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      errorIconRight: true,
      options: [ {
        'label': 'AND',
        'value': 'AND',
      }, {
        'label': 'OR',
        'value': 'OR',
      }],
      layoutProps: {
      },
    },
    condition_group_id: {
      name: 'condition_group_id',
      label: 'OR Group ID',
      type: 'text',
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      layoutProps: {
      },
    },
    condition_test: {
      label: 'Comparison',
      name: `rule*${index}*condition_test`,
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      value: '',
      validateOnChange: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      // layoutProps: {
      // },
      options: COMPARATOR_DROPDOWN,
    },
    'rule_separator': {
      name: `rule*${index}*rule_separator`,
      type: 'layout',
      value: {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            margin: '10px 0',
            position: 'relative',
          }
        },
        children: [
          {
            component: 'hr',
            props: {
              style: {
                border: 'none',
                borderBottom: '1px dashed #bbb',
                width: '100%',
              }
            }
          },
          {
            component: 'span',
            props: {
              style: {
                padding: '0 20px',
                background: 'white',
                position: 'absolute',
                color: '#bbb',
                fontWeight: 900,
                fontSize: '13px',
              }
            },
            children: 'AND'
          }
        ]
      }
    },
    add_button: {
      name: 'plus_counter',
      label: ' ',
      type: 'button',
      max: 10,
      passProps: {
        children: 'ADD CONDITION',
        color: 'isPrimary',
      },
      layoutProps: {
        style: {
          width: 'auto',
          margin: '1rem 5px',
        }
      },
      onClick: 'func:window.plusCounterOnClick',
      value: 0,
    },
    delete_button: {
      label: ' ',
      name: 'minus_counter',
      type: 'button',
      onClick: 'func:window.minusCounterOnClick',
      value: 0,
      layoutProps: {
        style: {
          width: 'auto',
          margin: '1rem 5px',
        }
      },
      passProps: {
        children: 'DELETE CONDITION',
        color: 'isDanger',
      },
    },
    ruleHeader: {
      name: 'ruleHeader',
      type: 'layout',
      layoutProps: {
        className: 'modal-full-width-section'
      },
      value: {
        component: 'p',
        props: {
          style: {
            fontWeight: 700,
          }
        },
        children: 'Rule',
      }
    },
    formheader: {
      name: 'formheader',
      type: 'layout',
      value: {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            margin: '10px 0',
            position: 'relative',
          }
        },
        children: [
          {
            component: 'hr',
            props: {
              style: {
                border: 'none',
                borderBottom: '1px dashed #bbb',
                width: '100%',
              }
            }
          },
          {
            component: 'span',
            props: {
              style: {
                padding: '0 20px',
                background: 'white',
                position: 'absolute',
                color: '#bbb',
                fontWeight: 900,
                fontSize: '13px',
              }
            },
            children: 'RULE PASSES IF'
          }
        ]
      }
    },
    outputheader: {
      name: 'outputheader',
      type: 'layout',
      layoutProps: {
        className: 'modal-full-width-section'
      },
      value: {
        component: 'p',
        props: {
          style: {
            fontWeight: 700,
          }
        },
        children: 'Result',
      }
    },
    'condition_output.variable': {
      name: `condition_output*${index}*variable`,
      value: '',
      errorIconRight: true,
      label: 'Output Variable',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      type: 'remote_dropdown',
      passProps: {
        emptyQuery: true,
        search: true,
        multiple: false,
        debounce: 250,
        searchProps: {
          baseUrl: '/decision/api/variable_dropdown?type=Output',
          limit: 100,
          sort: 'display_title',
          response_field: 'variable_dropdown',
        },
      },
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
        }
      },
    },
    'condition_output.variable_type': {
      type: 'layout',
      name: `condition_output*${index}*variable_type`,
      passProps: {
        className: '__re-bulma_column',
      },
      layoutProps: {
        style: {
          width: '30%',
        }
      },
      value: {
        component: 'div',
        props: {
          className: '__re-bulma_control __form_element_has_value',
        },
        children: [ {
          component: 'label',
          props: {
            className: '__re-bulma_label',
            style: {
              visibility: 'hidden',
              whiteSpace: 'nowrap',
            }
          },
          children: 'Output Variable Type',
        },
        {
          component: 'Input',
          props: {
            readOnly: true,
            value: '',
          }
        }]
      }
    },
    'condition_output.value': {
      name: `condition_output*${index}*value`,
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      label: 'Output Value',
      type: 'text',
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
        }
      },
    },
    'condition_output.value_type': {
      name: `condition_output*${index}*value_type`,
      type: 'dropdown',
      label: 'Output Value Type',
      labelProps: {
        style: {
          visibility: 'hidden',
          whiteSpace: 'nowrap',
        }
      },
      passProps: {
        selection: true,
        fluid: true,
      },
      layoutProps: {
        style: {
          width: '30%',
        }
      },
      value: 'value',
      validateOnChange: true,
      errorIcon: 'fa fa-exclamation',
      errorIconRight: true,
      options: [ {
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      }],
    },
    'output_separator': {
      name: `output_separator*${index}`,
      type: 'layout',
      value: {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            margin: '10px 0',
            position: 'relative',
          }
        },
        children: [
          {
            component: 'hr',
            props: {
              style: {
                border: 'none',
                borderBottom: '1px dashed #bbb',
                width: '100%',
              }
            }
          },
          {
            component: 'span',
            props: {
              style: {
                padding: '0 20px',
                background: 'white',
                position: 'absolute',
                color: '#bbb',
                fontWeight: 900,
                fontSize: '13px',
              }
            },
            children: `RESULT ${index + 1} (ASSIGNED IF RULE PASSES)`
          }
        ]
      }
    },
    add_output_button: {
      name: 'plus_output_counter',
      label: ' ',
      type: 'button',
      max: 10,
      passProps: {
        children: 'ADD RESULT',
        color: 'isSuccess',
      },
      layoutProps: {
        style: {
          width: 'auto',
          margin: '1rem 5px',
        }
      },
      onClick: 'func:window.plusOutputCounterOnClick',
      value: 0,
    },
    delete_output_button: {
      label: ' ',
      name: 'minus_output_counter',
      type: 'button',
      onClick: 'func:window.minusOutputCounterOnClick',
      value: 0,
      layoutProps: {
        style: {
          width: 'auto',
          margin: '1rem 5px',
        }
      },
      passProps: {
        children: 'DELETE RESULT',
        color: 'isDanger',
      },
    },
  };
  return Object.assign({}, ruleFormElements[ prop ]);
}

function getRuleFormValidations(index) {
  const ruleValidations = {
    [ `rule*${index}*state_property_attribute` ]: {
      'name': `rule*${index}*state_property_attribute`,
      'constraints': {
        [ `rule*${index}*state_property_attribute` ]: {
          'presence': { 'message': '^Variable is required.' },
        },
      },
    },
    [ `rule*${index}*condition_test` ]: {
      'name': [ `rule*${index}*condition_test` ],
      'constraints': {
        [ `rule*${index}*condition_test` ]: {
          'presence': { 'message': '^Comparator is required.' },
        },
      },
    },
    [ `rule*${index}*state_property_attribute_value_minimum` ]: {
      'name': `rule*${index}*state_property_attribute_value_minimum`,
      'constraints': {
        [ `rule*${index}*state_property_attribute_value_minimum` ]: {
          'presence': { 'message': '^Minimum is required.' },
        },
      },
    },
    [ `rule*${index}*state_property_attribute_value_maximum` ]: {
      'name': `rule*${index}*state_property_attribute_value_maximum`,
      'constraints': {
        [ `rule*${index}*state_property_attribute_value_maximum` ]: {
          'presence': { 'message': '^Maximum is required.', }
        },
      },
    },
    [ `rule*${index}*state_property_attribute_value_comparison` ]: {
      'name': `rule*${index}*state_property_attribute_value_comparison`,
      'constraints': {
        [ `rule*${index}*state_property_attribute_value_comparison` ]: {
          'presence': { 'message': '^Value is required.', }
        },
      },
    },
    [ `rule*${index}*condition_test` ]: {
      'name': `rule*${index}*condition_test`,
      'constraints': {
        [ `rule*${index}*condition_test` ]: {
          'presence': { 'message': '^Comparator is required.', },
        },
      },
    },
  };
  return ruleValidations;
}

let filterFunc = {
  'condition_test': 'func:window.comparatorFilterTwo',
  'state_property_attribute_value_minimum': 'func:window.minimumFilterTwo',
  'state_property_attribute_value_maximum': 'func:window.maximumFilterTwo',
  'state_property_attribute_value_minimum_type': 'func:window.minMaxTypeFilter',
  'state_property_attribute_value_maximum_type': 'func:window.minMaxTypeFilter',
  'state_property_attribute_value_comparison': 'func:window.valueFilterTwo',
  'state_property_attribute_value_comparison_type': 'func:window.valueTypeFilter',
  'variable_type': 'func:window.variableTypeFilterTwo',
  'state_property_attribute': 'func:window.variableDropdownFilter',
  'rule_separator': 'func:window.ruleSeparaterFilter',
  'add_button': 'func:window.modalPlusCounterFilter',
  'delete_button': 'func:window.minusCounterFilter',
  'output_separator': 'func:window.outputSeparaterFilter',
  'condition_output.variable': 'func:window.conditionOutputVariableFilter',
  'condition_output.variable_type': 'func:window.conditionOutputVariableTypeFilter',
  'condition_output.value': 'func:window.conditionOutputValueFilter',
  'condition_output.value_type': 'func:window.conditionOutputValueTypeFilter',
};

function getStandardFields(idx, reducer) {
  let standardFields = [
    `state_property_attribute`,
    `variable_type`,
    `condition_test`,
    `state_property_attribute_value_comparison`,
    `state_property_attribute_value_comparison_type`,
    `state_property_attribute_value_minimum`,
    `state_property_attribute_value_minimum_type`,
    `state_property_attribute_value_maximum`,
    `state_property_attribute_value_maximum_type`, ];
  return (reducer) ?
    standardFields.reduce((reduced, element) => reducer({ reduced, element, idx, standard: true }), undefined)
    : standardFields;
}

function getStandardOutputFields(idx, reducer) {
  let standardFields = [
    `output_separator`,
    `condition_output.variable`,
    `condition_output.variable_type`,
    `condition_output.value`,
    `condition_output.value_type`,
  ];
  return (reducer) ?
    standardFields.reduce((reduced, element) => reducer({ reduced, element, idx }), undefined)
    : standardFields;
}

let standardFilterReducer = (options) => {
  let { element, reduced, idx } = options;
  if (typeof reduced === 'undefined') {
    reduced = {};
  }
  let prop;
  if (options.standard) {
    prop = `rule*${idx}*${element}`;
  } else {
    prop = element.replace('.', `*${idx}*`);
    prop = prop.replace('output_separator', `output_separator*${idx}`);
  }
  reduced[ prop ] = filterFunc[ element ];
  return reduced;
}

let standardOrderReducer = (options) => {
  let { element, reduced, idx, } = options;
  if (typeof reduced === 'undefined') {
    reduced = [];
  }
  let prop;
  if (options.standard) {
    prop = `rule*${idx}*${element}`;
  } else {
    prop = element.replace('condition_output.', `condition_output*${idx}*`);
    prop = prop.replace('output_separator', `output_separator*${idx}`);
  }
  reduced.push(prop);
  return reduced;
};

let standardFormElementsReducer = (options) => {
  let { element, reduced, idx } = options;
  if (typeof reduced === 'undefined') {
    reduced = [];
  }
  reduced.push(getRuleFormElement({ prop: element, index: idx }));
  return reduced;
}

let { validations, hiddenFields, formgroups, additionalComponents } = formConfigs[ settings.type ].edit;
let pluralizedType = pluralize(settings.type);
let url = `/decision/api/standard_${pluralizedType}/:id?format=json`;
let headerButtons = detailHeaderButtons({ type: settings.type, location: settings.location });
module.exports = {
  'containers': {
    [ `/decision/rules/output/:id` ]: {
      layout: {
        privileges: [101, 102, 103],
        component: 'div',
        children: [
          {
            component: 'Container',
            children: [
              {
                component: 'ResponsiveFormContainer',
                asyncprops: {
                  formdata: [ 'ruledata', 'data' ],
                  __formOptions: [ 'ruledata', 'formoptions' ],
                },
                props: {
                  validations: Object.assign({}, getRuleFormValidations(0), getRuleFormValidations(1), getRuleFormValidations(2), getRuleFormValidations(3), getRuleFormValidations(4), getRuleFormValidations(5), getRuleFormValidations(6), getRuleFormValidations(7), getRuleFormValidations(8), getRuleFormValidations(9)),
                  formgroups: [ {
                    gridProps: {
                      key: randomKey(),
                      className: '__dynamic_form_elements',
                      style: {
                        display: 'flex',
                        justifyContent: 'center',
                      }
                    },
                    formElements: [
                      getRuleFormElement({ prop: 'formheader' }),
                      getRuleFormElement({ prop: 'add_button' }),
                      getRuleFormElement({ prop: 'delete_button' }),
                      ...getStandardFields(0, standardFormElementsReducer),
                      getRuleFormElement({ prop: 'rule_separator', index: 1, }),
                      ...getStandardFields(1, standardFormElementsReducer),
                      getRuleFormElement({ prop: 'rule_separator', index: 2 }),
                      ...getStandardFields(2, standardFormElementsReducer),
                      getRuleFormElement({ prop: 'rule_separator', index: 3, }),
                      ...getStandardFields(3, standardFormElementsReducer),
                      getRuleFormElement({ prop: 'rule_separator', index: 4, }),
                      ...getStandardFields(4, standardFormElementsReducer),
                      getRuleFormElement({ prop: 'rule_separator', index: 5, }),
                      ...getStandardFields(5, standardFormElementsReducer),
                      getRuleFormElement({ prop: 'rule_separator', index: 6, }),
                      ...getStandardFields(6, standardFormElementsReducer),
                      getRuleFormElement({ prop: 'rule_separator', index: 7, }),
                      ...getStandardFields(7, standardFormElementsReducer),
                      getRuleFormElement({ prop: 'rule_separator', index: 8, }),
                      ...getStandardFields(8, standardFormElementsReducer),
                      getRuleFormElement({ prop: 'rule_separator', index: 9, }),
                      ...getStandardFields(9, standardFormElementsReducer),
                      getRuleFormElement({ prop: 'outputheader' }),
                      ...getStandardOutputFields(0, standardFormElementsReducer),
                      ...getStandardOutputFields(1, standardFormElementsReducer),
                      ...getStandardOutputFields(2, standardFormElementsReducer),
                      ...getStandardOutputFields(3, standardFormElementsReducer),
                      ...getStandardOutputFields(4, standardFormElementsReducer),
                      ...getStandardOutputFields(5, standardFormElementsReducer),
                      ...getStandardOutputFields(6, standardFormElementsReducer),
                      ...getStandardOutputFields(7, standardFormElementsReducer),
                      ...getStandardOutputFields(8, standardFormElementsReducer),
                      ...getStandardOutputFields(9, standardFormElementsReducer),
                      getRuleFormElement({ prop: 'add_output_button' }),
                      getRuleFormElement({ prop: 'delete_output_button' }),
                    ],
                    order: [
                      'formheader',
                      ...getStandardFields(0, standardOrderReducer),
                      'rule*1*rule_separator',
                      ...getStandardFields(1, standardOrderReducer),
                      'rule*2*rule_separator',
                      ...getStandardFields(2, standardOrderReducer),
                      'rule*3*rule_separator',
                      ...getStandardFields(3, standardOrderReducer),
                      'rule*4*rule_separator',
                      ...getStandardFields(4, standardOrderReducer),
                      'rule*5*rule_separator',
                      ...getStandardFields(5, standardOrderReducer),
                      'rule*6*rule_separator',
                      ...getStandardFields(6, standardOrderReducer),
                      'rule*7*rule_separator',
                      ...getStandardFields(7, standardOrderReducer),
                      'rule*8*rule_separator',
                      ...getStandardFields(8, standardOrderReducer),
                      'rule*9*rule_separator',
                      ...getStandardFields(9, standardOrderReducer),
                      'plus_counter',
                      'minus_counter',
                      'outputheader',
                      'condition_output*weight',
                      'condition_output*weight_type',
                      ...getStandardOutputFields(0, standardOrderReducer),
                      ...getStandardOutputFields(1, standardOrderReducer),
                      ...getStandardOutputFields(2, standardOrderReducer),
                      ...getStandardOutputFields(3, standardOrderReducer),
                      ...getStandardOutputFields(4, standardOrderReducer),
                      ...getStandardOutputFields(5, standardOrderReducer),
                      ...getStandardOutputFields(6, standardOrderReducer),
                      ...getStandardOutputFields(7, standardOrderReducer),
                      ...getStandardOutputFields(8, standardOrderReducer),
                      ...getStandardOutputFields(9, standardOrderReducer),
                      'plus_output_counter',
                      'minus_output_counter',
                    ]
                  }, {
                    gridProps: {
                      key: randomKey(),
                      className: 'modal-footer-btns',
                    },
                    order: [ 'submit' ],
                    formElements: [ {
                      type: 'submit',
                      name: 'submit',
                      value: 'SAVE',
                      passProps: {
                        color: 'isPrimary',
                      },
                      layoutProps: {
                        style: {
                          textAlign: 'center',
                        }
                      },
                    }, ]
                  }, ],
                  renderFormElements: Object.assign({},
                    getStandardFields(0, standardFilterReducer), getStandardFields(1, standardFilterReducer), getStandardFields(2, standardFilterReducer), getStandardFields(3, standardFilterReducer),
                    getStandardFields(4, standardFilterReducer), getStandardFields(5, standardFilterReducer), getStandardFields(6, standardFilterReducer), getStandardFields(7, standardFilterReducer), getStandardFields(8, standardFilterReducer), getStandardFields(9, standardFilterReducer),
                    getStandardOutputFields(0, standardFilterReducer),
                    getStandardOutputFields(1, standardFilterReducer),
                    getStandardOutputFields(2, standardFilterReducer),
                    getStandardOutputFields(3, standardFilterReducer),
                    getStandardOutputFields(4, standardFilterReducer),
                    getStandardOutputFields(5, standardFilterReducer),
                    getStandardOutputFields(6, standardFilterReducer),
                    getStandardOutputFields(7, standardFilterReducer),
                    getStandardOutputFields(8, standardFilterReducer),
                    getStandardOutputFields(9, standardFilterReducer),
                    {
                      'rule*1*rule_separator': 'func:window.ruleSeparaterFilter',
                      'rule*2*rule_separator': 'func:window.ruleSeparaterFilter',
                      'rule*3*rule_separator': 'func:window.ruleSeparaterFilter',
                      'rule*4*rule_separator': 'func:window.ruleSeparaterFilter',
                      'rule*5*rule_separator': 'func:window.ruleSeparaterFilter',
                      'rule*6*rule_separator': 'func:window.ruleSeparaterFilter',
                      'rule*7*rule_separator': 'func:window.ruleSeparaterFilter',
                      'rule*8*rule_separator': 'func:window.ruleSeparaterFilter',
                      'rule*9*rule_separator': 'func:window.ruleSeparaterFilter',
                      'plus_counter': 'func:window.modalPlusCounterFilter',
                      'minus_counter': 'func:window.minusCounterFilter',
                      'plus_output_counter': 'func:window.plusOutputCounterFilter',
                      'minus_output_counter': 'func:window.minusOutputCounterFilter',
                    }),
                  form: {
                    "cardForm": false,
                    cardFormTitle: 'Rule Detail',
                    "cardFormProps": styles.cardFormProps,
                    flattenFormData: true,
                    footergroups: false,
                    useFormOptions: true,
                    onSubmit: {
                      url: `/decision/api/standard_rules/:id?format=json&method=editRule&collection=rules`,
                      params: [
                        { 'key': ':id', 'val': '_id' },
                      ],
                      options: {
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        method: 'PUT',
                      },
                      successProps: {
                        type: 'success',
                        text: 'Changes saved successfully!',
                        timeout: 10000,
                      },
                      successCallback: 'func:window.hideModalandCreateNotificationandRefresh',
                    },
                    validations: [],
                    hiddenFields: [{
                      form_name: '_id',
                      form_val: '_id',
                    }, {
                      form_name: 'type',
                      form_val: 'type',
                    }, {
                      form_name: 'rule_type',
                      form_val: 'rule_type',
                    }, {
                      form_name: 'name',
                      form_val: 'name',
                    }],
                  },
                }
              }
            ]
          }]
      },
      'resources': {
        [ `ruledata` ]: `/decision/api/standard_rules/:id?modal=true&format=json`,
        checkdata: {
          url: '/auth/run_checks',
          settings: {
            onSuccess: [ 'func:window.redirect', ],
            onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      'callbacks': [ 'func:window.dynamicModalHeight' ],
      'pageData': {
        'title': settings.title,
        'navLabel': 'Decision Product',
      },
      'onFinish': 'render',
    },
  },
};

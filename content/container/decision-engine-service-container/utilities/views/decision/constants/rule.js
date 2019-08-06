'use strict';

const randomKey = Math.random;

const COMPARATOR_DROPDOWN = [ {
  label: 'Select Comparator',
  value: '',
}, {
  label: '=',
  value: 'EQUAL',
}, {
  label: '!=',
  value: 'NOT EQUAL'
}, {
  label: '>=',
  value: 'FLOOR',
}, {
  label: '<=',
  value: 'CAP',
}, {
  label: '>',
  value: 'GT',
}, {
  label: '<',
  value: 'LT',
}, {
  label: 'RANGE',
  value: 'RANGE',
}, {
  label: 'IN',
  value: 'IN',
}, {
  label: 'NOT IN',
  value: 'NOT IN',
},
{
  label: 'IS NULL',
  value: 'IS NULL',
}, {
  label: 'IS NOT NULL',
  value: 'IS NOT NULL',
}
  //   {
  //   label: 'EXISTS',
  //   value: 'EXISTS',
  // }, {
  //   label: 'DOES NOT EXIST',
  //   value: 'NOT EXISTS',
  //   }
];

const ruleValidations = {
  name: {
    'name': 'name',
    'constraints': {
      'name': {
        'presence': { 'message': '^Name is required.' },
      },
    },
  },
  description: {
    'name': 'description',
    'constraints': {
      'description': {
        'presence': { 'message': '^Description is required.' },
      },
    },
  },
  state_property_attribute: {
    'name': 'state_property_attribute',
    'constraints': {
      'state_property_attribute': {
        'presence': { 'message': '^Variable is required.' },
      },
    },
  },
  condition_test: {
    'name': 'condition_test',
    'constraints': {
      'condition_test': {
        'presence': { 'message': '^Comparator is required.' },
      },
    },
  },
  state_property_attribute_value_minimum: {
    'name': 'state_property_attribute_value_minimum',
    'constraints': {
      'state_property_attribute_value_minimum': {
        'presence': { 'message': '^Minimum is required.' },
      },
    },
  },
  state_property_attribute_value_maximum: {
    'name': 'state_property_attribute_value_maximum',
    'constraints': {
      'state_property_attribute_value_maximum': {
        'presence': { 'message': '^Maximum is required.', }
      },
    },
  },
  state_property_attribute_value_comparison: {
    'name': 'state_property_attribute_value_comparison',
    'constraints': {
      'state_property_attribute_value_comparison': {
        'presence': { 'message': '^Value is required.', }
      },
    },
  },
  condition_group_id: {
    'name': 'condition_group_id',
    'constraints': {
      'condition_group_id': {
        'presence': { 'message': '^Or Group ID is required.', }
      },
    },
  },
  condition_test: {
    'name': 'condition_test',
    'constraints': {
      'condition_test': {
        'presence': { 'message': '^Comparator is required.', },
      },
    },
  },
  condition_operation: {
    'name': 'condition_operation',
    'constraints': {
      'condition_operation': {
        'presence': { 'message': '^Operator is required.', },
      },
    },
  },
};
const ruleCategoryCreateEditValidationMap = {
  'population': {
    name: ruleValidations.name,
    description: ruleValidations.description,
    state_property_attribute: ruleValidations.state_property_attribute,
    condition_test: ruleValidations.condition_test,
    state_property_attribute_value_minimum: ruleValidations.state_property_attribute_value_minimum,
    state_property_attribute_value_maximum: ruleValidations.state_property_attribute_value_maximum,
    state_property_attribute_value_comparison: ruleValidations.state_property_attribute_value_comparison,
    condition_operation: ruleValidations.condition_operation,
    condition_group_id: ruleValidations.condition_group_id,

  },
  'requirements': {
    name: ruleValidations.name,
    description: ruleValidations.description,
    state_property_attribute: ruleValidations.state_property_attribute,
    condition_test: ruleValidations.condition_test,
    state_property_attribute_value_minimum: ruleValidations.state_property_attribute_value_minimum,
    state_property_attribute_value_maximum: ruleValidations.state_property_attribute_value_maximum,
    state_property_attribute_value_comparison: ruleValidations.state_property_attribute_value_comparison,
    condition_operation: ruleValidations.condition_operation,
    condition_group_id: ruleValidations.condition_group_id,
  },
  'scorecard': {
    name: ruleValidations.name,
    description: ruleValidations.description,
    state_property_attribute: ruleValidations.state_property_attribute,
    condition_test: ruleValidations.condition_test,
    state_property_attribute_value_minimum: ruleValidations.state_property_attribute_value_minimum,
    state_property_attribute_value_maximum: ruleValidations.state_property_attribute_value_maximum,
    state_property_attribute_value_comparison: ruleValidations.state_property_attribute_value_comparison,
  },
  'output': {
    name: ruleValidations.name,
    description: ruleValidations.description,
    state_property_attribute: ruleValidations.state_property_attribute,
    condition_test: ruleValidations.condition_test,
    state_property_attribute_value_minimum: ruleValidations.state_property_attribute_value_minimum,
    state_property_attribute_value_maximum: ruleValidations.state_property_attribute_value_maximum,
    state_property_attribute_value_comparison: ruleValidations.state_property_attribute_value_comparison,
  },
  'limits': {
    name: ruleValidations.name,
    description: ruleValidations.description,
    state_property_attribute: ruleValidations.state_property_attribute,
    condition_test: ruleValidations.condition_test,
    state_property_attribute_value_minimum: ruleValidations.state_property_attribute_value_minimum,
    state_property_attribute_value_maximum: ruleValidations.state_property_attribute_value_maximum,
    state_property_attribute_value_comparison: ruleValidations.state_property_attribute_value_comparison,
  },
}

const ruleFormElements = {
  name: {
    name: 'name',
    label: 'Rule Name',
    type: 'text',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
    layoutProps: {
    },
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
    name: 'state_property_attribute',
    value: '',
    errorIconRight: true,
    label: 'Variable',
    type: 'dropdown',
    validateOnChange: true,
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
    passProps: {
      selection: true,
      fluid: true,
      search: true,
    },
    layoutProps: {
    },
  },
  variable_type: {
    type: 'layout',
    name: 'variable_type',
    passProps: {
      className: '__re-bulma_column',
    },
    value: {
      component: 'div',
      props: {
        className: '__re-bulma_control __form_element_has_value',
      },
      children: [ {
        component: 'label',
        props: {
          className: '__re-bulma_control-label',
        },
        children: 'Variable Type',
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
    name: 'state_property_attribute_value_comparison',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
    label: 'Value',
    type: 'text',
    layoutProps: {
    },
  },
  state_property_attribute_value_minimum: {
    name: 'state_property_attribute_value_minimum',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
    createNumberMask: true,
    passProps: {
      mask: 'func:window.numberMask',
      guid: false,
      placeholderChar: '\u2000',
    },
    label: 'Minimum',
    type: 'text',
    layoutProps: {
    },
  },
  state_property_attribute_value_maximum: {
    name: 'state_property_attribute_value_maximum',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
    createNumberMask: true,
    passProps: {
      mask: 'func:window.numberMask',
      guid: false,
      placeholderChar: '\u2000',
    },
    label: 'Maximum',
    type: 'text',
    layoutProps: {
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
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
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
    name: 'condition_test',
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
  'condition_adverse_codes': {
    name: 'condition_adverse_codes',
    label: 'Decline Reason',
    keyUp: 'func:window.nameOnChange',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
    type: 'text',
    // layoutProps: {
    // },
  },
  'condition_output.weight': {
    name: 'condition_output.weight',
    label: 'Weight',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
    type: 'maskedinput',
    passProps: {
      mask: 'func:window.numberMask',
      guid: false,
      placeholderChar: '\u2000',
    },
    createNumberMask: true,
    // layoutProps: {
    // },
  },
  'condition_output.annual_interest_rate': {
    name: 'condition_output.annual_interest_rate',
    label: 'Interest Rate (Fixed)',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    type: 'maskedinput',
    passProps: {
      mask: 'func:window.numberMask',
      guid: false,
      placeholderChar: '\u2000',
    },
    createNumberMask: true,
    // layoutProps: {
    // },
  },
  'condition_output.variable_interest_rate': {
    name: 'condition_output.variable_interest_rate',
    label: 'Interest Rate (Variable - Index)',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    type: 'maskedinput',
    passProps: {
      mask: 'func:window.numberMask',
      guid: false,
      placeholderChar: '\u2000',
    },
    createNumberMask: true,
    // layoutProps: {
    // },
  },
  'condition_output.marginal_interest_rate': {
    name: 'condition_output.marginal_interest_rate',
    label: 'Interest Rate (Variable - Margin)',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    type: 'maskedinput',
    passProps: {
      mask: 'func:window.numberMask',
      guid: false,
      placeholderChar: '\u2000',
    },
    createNumberMask: true,
    // layoutProps: {
    // },
  },
  'condition_output.origination_fee_rate': {
    name: 'condition_output.origination_fee_rate',
    label: 'Origination Fee',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    type: 'maskedinput',
    passProps: {
      mask: 'func:window.numberMask',
      guid: false,
      placeholderChar: '\u2000',
    },
    createNumberMask: true,
    // layoutProps: {
    // },
  },
  'condition_output.apr': {
    name: 'condition_output.apr',
    label: 'APR',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    type: 'maskedinput',
    passProps: {
      mask: 'func:window.numberMask',
      guid: false,
      placeholderChar: '\u2000',
    },
    createNumberMask: true,
    // layoutProps: {
    // },
  },
  'condition_output.term': {
    name: 'condition_output.term',
    label: 'Loan Term',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    type: 'maskedinput',
    passProps: {
      mask: 'func:window.numberMask',
      guid: false,
      placeholderChar: '\u2000',
    },
    createNumberMask: true,
    // layoutProps: {
    // },
  },
  'condition_output.other_conditions': {
    name: 'condition_output.other_conditions',
    label: 'Other Conditions',
    type: 'text',
    // layoutProps: {
    // },
  },
  'and_group_id': {
    name: 'and_group_id',
    label: 'AND Group ID',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    type: 'text',
    // layoutProps: {
    // },
  },
  'or_group_id': {
    name: 'or_group_id',
    label: 'OR Group ID',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    type: 'text',
    // layoutProps: {
    // },
  },
};

function ruleCategoryCreateEditModalMap({ submitDisplay, COMPARATOR_DROPDOWN }) {
  return {
    'population': [ {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements.name, ]
    }, {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ {
        name: 'type',
        label: 'Rule Type',
        type: 'text',
        value: 'Population',
        layoutProps: {
  
        },
        passProps: {
          'state': 'isDisabled',
        },
      }]
    },
    {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements.description, ]
    }, {
      gridProps: {
        key: randomKey(),
        className: '__dynamic_form_elements',
      },
      formElements: [ ruleFormElements.state_property_attribute, ruleFormElements.variable_type, ]
    }, {
      gridProps: {
        key: randomKey(),
        className: '__dynamic_form_elements',
      },
      formElements: [
        ruleFormElements.condition_test,
        ruleFormElements.state_property_attribute_value_comparison, ruleFormElements.state_property_attribute_value_minimum, ruleFormElements.state_property_attribute_value_maximum,
      ]
    }, {
      gridProps: {
        key: randomKey(),
        className: '__dynamic_form_elements',
      },
      formElements: [ ruleFormElements.condition_operation, ruleFormElements.condition_group_id, ]
    }, {
      gridProps: {
        key: randomKey(),
        style: {
          margin: '20px 0 0 0',
        }
      },
      formElements: [ {
        type: 'submit',
        value: submitDisplay,
        passProps: {
          color: 'isPrimary',
        },
        layoutProps: {
          style: {
            alignSelf: 'flex-end',
            textAlign: 'right',
            padding: 0,
          },
        },
      }, ]
    }, ],
    'requirements': [ {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements.name, ]
    }, {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ {
        name: 'type',
        label: 'Rule Type',
        type: 'text',
        value: 'Minimum Requirement',
        layoutProps: {
  
        },
        passProps: {
          'state': 'isDisabled',
        },
      }]
    },
    {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements.description, ]
    }, {
      gridProps: {
        key: randomKey(),
        className: '__dynamic_form_elements',
      },
      formElements: [
        ruleFormElements.state_property_attribute,
        ruleFormElements.variable_type,
      ],
    }, {
      gridProps: {
        key: randomKey(),
        className: '__dynamic_form_elements'
      },
      formElements: [
        ruleFormElements.condition_test, ruleFormElements.state_property_attribute_value_comparison, ruleFormElements.state_property_attribute_value_minimum, ruleFormElements.state_property_attribute_value_maximum,
      ]
    }, {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements.condition_adverse_codes ],
    }, {
      gridProps: {
        key: randomKey(),
        className: '__dynamic_form_elements',
      },
      formElements: [
        ruleFormElements.condition_operation,
        ruleFormElements.condition_group_id,
      ],
    }, {
      gridProps: {
        key: randomKey(),
        style: {
          margin: '20px 0 0 0',
        }
      },
      formElements: [ {
        type: 'submit',
        value: submitDisplay,
        passProps: {
          color: 'isPrimary',
        },
        layoutProps: {
          style: {
            alignSelf: 'flex-end',
            textAlign: 'right',
            padding: 0,
          },
        },
      }, ]
    }, ],
    'scorecard': [ {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements.name, ]
    }, {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ {
        name: 'type',
        label: 'Rule Type',
        type: 'text',
        value: 'Scorecard',
        layoutProps: {
  
        },
        passProps: {
          'state': 'isDisabled',
        },
      }]
    },
    {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements.description, ]
    }, {
      gridProps: {
        key: randomKey(),
        className: '__dynamic_form_elements',
      },
      formElements: [
        ruleFormElements.state_property_attribute,
        ruleFormElements.variable_type,
      ]
    }, {
      gridProps: {
        key: randomKey(),
        className: '__dynamic_form_elements'
      },
      formElements: [ ruleFormElements.condition_test, ruleFormElements.state_property_attribute_value_comparison, ruleFormElements.state_property_attribute_value_minimum, ruleFormElements.state_property_attribute_value_maximum, ]
    }, {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements[ 'condition_output.weight' ], ],
    }, {
      gridProps: {
        key: randomKey(),
        style: {
          margin: '20px 0 0 0',
        }
      },
      formElements: [ {
        type: 'submit',
        value: submitDisplay,
        passProps: {
          color: 'isPrimary',
        },
        layoutProps: {
          style: {
            alignSelf: 'flex-end',
            textAlign: 'right',
            padding: 0,
          },
        },
      }, ]
    }, ],
    'output': [ {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements.name, ]
    }, {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ {
        name: 'type',
        label: 'Rule Type',
        type: 'text',
        value: 'Output',
        layoutProps: {
  
        },
        passProps: {
          'state': 'isDisabled',
        },
      }]
    },
    {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements.description, ]
    }, {
      gridProps: {
        key: randomKey(),
        className: '__dynamic_form_elements',
      },
      formElements: [ ruleFormElements.state_property_attribute, ruleFormElements.variable_type, ]
    }, {
      gridProps: {
        key: randomKey(),
        className: '__dynamic_form_elements'
      },
      formElements: [ ruleFormElements.condition_test, ruleFormElements.state_property_attribute_value_comparison, ruleFormElements.state_property_attribute_value_minimum, ruleFormElements.state_property_attribute_value_maximum, ]
    }, {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements[ 'condition_output.annual_interest_rate' ], ],
    }, {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements[ 'condition_output.variable_interest_rate' ], ],
    }, {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements[ 'condition_output.marginal_interest_rate' ], ],
    }, {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements[ 'condition_output.origination_fee_rate' ], ],
    }, {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements[ 'condition_output.apr' ], ],
    }, {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements[ 'condition_output.term' ], ],
    }, {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements[ 'condition_output.other_conditions' ], ],
    }, {
      gridProps: {
        key: randomKey(),
        style: {
          margin: '20px 0 0 0',
        }
      },
      formElements: [ {
        type: 'submit',
        value: submitDisplay,
        passProps: {
          color: 'isPrimary',
        },
        layoutProps: {
          style: {
            alignSelf: 'flex-end',
            textAlign: 'right',
            padding: 0,
          },
        },
      }, ]
    }, ],
    'limits': [ {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements.name, ]
    }, {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ {
        name: 'type',
        label: 'Rule Type',
        type: 'text',
        value: 'Limits',
        layoutProps: {
  
        },
        passProps: {
          'state': 'isDisabled',
        },
      }]
    },
    {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements.description, ]
    }, {
      gridProps: {
        key: randomKey(),
        className: '__dynamic_form_elements',
      },
      formElements: [
        ruleFormElements.state_property_attribute,
        ruleFormElements.variable_type
      ],
    }, {
      gridProps: {
        key: randomKey(),
        className: '__dynamic_form_elements'
      },
      formElements: [
        ruleFormElements.condition_test, ruleFormElements.state_property_attribute_value_comparison, ruleFormElements.state_property_attribute_value_minimum, ruleFormElements.state_property_attribute_value_maximum,
      ],
    }, {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements[ 'and_group_id' ], ]
    }, {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ ruleFormElements[ 'or_group_id' ], ],
    }, {
      gridProps: {
        key: randomKey(),
        style: {
          margin: '20px 0 0 0',
        }
      },
      formElements: [ {
        type: 'submit',
        value: submitDisplay,
        passProps: {
          color: 'isPrimary',
        },
        layoutProps: {
          style: {
            alignSelf: 'flex-end',
            textAlign: 'right',
            padding: 0,
          },
        },
      }, ]
    }, ]
  }
}

const ruleLeftConfigs = {
  population: [ {
    label: 'Variable Name',
    name: 'before.state_property_attribute'
  }, {
    label: 'Variable Version',
    name: 'before.variable_version'
  }, {
    label: 'Comparison',
    name: 'before.condition_test'
  }, {
    label: 'Value',
    name: 'before.state_property_attribute_value_comparison'
  }, {
    label: 'Minimum',
    name: 'before.state_property_attribute_value_minimum'
  }, {
    label: 'Maximum',
    name: 'before.state_property_attribute_value_maximum'
  }, {
    label: 'Operator',
    name: 'before.condition_operation'
  }, {
    label: 'OR Group ID',
    name: 'before.condition_group_id'
  }],
  requirements: [ {
    label: 'Variable Name',
    name: 'before.state_property_attribute'
  }, {
    label: 'Variable Version',
    name: 'before.variable_version'
  }, {
    label: 'Comparison',
    name: 'before.condition_test'
  }, {
    label: 'Value',
    name: 'before.state_property_attribute_value_comparison'
  }, {
    label: 'Minimum',
    name: 'before.state_property_attribute_value_minimum'
  }, {
    label: 'Maximum',
    name: 'before.state_property_attribute_value_maximum'
  }, {
    label: 'Operator',
    name: 'before.condition_operation'
  }, {
    label: 'OR Group ID',
    name: 'before.condition_group_id'
  }, {
    label: 'Decline Reason',
    name: 'before.condition_adverse_codes'
  }],
  scorecard: [ {
    label: 'Variable Name',
    name: 'before.state_property_attribute'
  }, {
    label: 'Variable Version',
    name: 'before.variable_version'
  }, {
    label: 'Comparison',
    name: 'before.condition_test'
  }, {
    label: 'Value',
    name: 'before.state_property_attribute_value_comparison'
  }, {
    label: 'Minimum',
    name: 'before.state_property_attribute_value_minimum'
  }, {
    label: 'Maximum',
    name: 'before.state_property_attribute_value_maximum'
  }, {
    label: 'Weight',
    name: 'before.condition_output.weight'
  }],
  output: [ {
    label: 'Variable Name',
    name: 'before.state_property_attribute'
  }, {
    label: 'Variable Version',
    name: 'before.variable_version'
  }, {
    label: 'Comparison',
    name: 'before.condition_test'
  }, {
    label: 'Value',
    name: 'before.state_property_attribute_value_comparison'
  }, {
    label: 'Minimum',
    name: 'before.state_property_attribute_value_minimum'
  }, {
    label: 'Maximum',
    name: 'before.state_property_attribute_value_maximum'
  }, {
    label: 'Interest Rate (Fixed)',
    name: 'before.condition_output.annual_interest_rate'
  }, {
    label: 'Interest Rate (Variable - Index)',
    name: 'before.condition_output.variable_interest_rate'
  }, {
    label: 'Interest Rate (Variable - Maring)',
    name: 'before.condition_output.marginal_interest_rate'
  }, {
    label: 'Origination Fee',
    name: 'before.condition_output.origination_fee_rate'
  }, {
    label: 'APR',
    name: 'before.condition_output.apr'
  }, {
    label: 'Loan Term',
    name: 'before.condition_output.term'
  }, {
    label: 'Other Conditions',
    name: 'before.condition_output.other_conditions'
  }],
  limits: [ {
    label: 'Variable Name',
    name: 'before.state_property_attribute'
  }, {
    label: 'Variable Version',
    name: 'before.variable_version'
  }, {
    label: 'Comparison',
    name: 'before.condition_test'
  }, {
    label: 'Value',
    name: 'before.state_property_attribute_value_comparison'
  }, {
    label: 'Minimum',
    name: 'before.state_property_attribute_value_minimum'
  }, {
    label: 'Maximum',
    name: 'before.state_property_attribute_value_maximum'
  }, {
    label: 'AND Group ID',
    name: 'before.and_group_id'
  }, {
    label: 'OR Group ID',
    name: 'before.or_group_id'
  }],
}

const ruleRightConfigs = {
  population: [ {
    label: 'Variable Name',
    name: 'after.state_property_attribute'
  }, {
    label: 'Variable Version',
    name: 'after.variable_version'
  }, {
    label: 'Comparison',
    name: 'after.condition_test'
  }, {
    label: 'Value',
    name: 'after.state_property_attribute_value_comparison'
  }, {
    label: 'Minimum',
    name: 'after.state_property_attribute_value_minimum'
  }, {
    label: 'Maximum',
    name: 'after.state_property_attribute_value_maximum'
  }, {
    label: 'Operator',
    name: 'after.condition_operation'
  }, {
    label: 'OR Group ID',
    name: 'after.condition_group_id'
  }],
  requirements: [ {
    label: 'Variable Name',
    name: 'after.state_property_attribute'
  }, {
    label: 'Variable Version',
    name: 'after.variable_version'
  }, {
    label: 'Comparison',
    name: 'after.condition_test'
  }, {
    label: 'Value',
    name: 'after.state_property_attribute_value_comparison'
  }, {
    label: 'Minimum',
    name: 'after.state_property_attribute_value_minimum'
  }, {
    label: 'Maximum',
    name: 'after.state_property_attribute_value_maximum'
  }, {
    label: 'Operator',
    name: 'after.condition_operation'
  }, {
    label: 'OR Group ID',
    name: 'after.condition_group_id'
  }, {
    label: 'Decline Reason',
    name: 'after.condition_adverse_codes'
  }],
  scorecard: [ {
    label: 'Variable Name',
    name: 'after.state_property_attribute'
  }, {
    label: 'Variable Version',
    name: 'after.variable_version'
  }, {
    label: 'Comparison',
    name: 'after.condition_test'
  }, {
    label: 'Value',
    name: 'after.state_property_attribute_value_comparison'
  }, {
    label: 'Minimum',
    name: 'after.state_property_attribute_value_minimum'
  }, {
    label: 'Maximum',
    name: 'after.state_property_attribute_value_maximum'
  }, {
    label: 'Weight',
    name: 'after.condition_output.weight'
  }],
  output: [ {
    label: 'Variable Name',
    name: 'after.state_property_attribute'
  }, {
    label: 'Variable Version',
    name: 'after.variable_version'
  }, {
    label: 'Comparison',
    name: 'after.condition_test'
  }, {
    label: 'Value',
    name: 'after.state_property_attribute_value_comparison'
  }, {
    label: 'Minimum',
    name: 'after.state_property_attribute_value_minimum'
  }, {
    label: 'Maximum',
    name: 'after.state_property_attribute_value_maximum'
  }, {
    label: 'Interest Rate (Fixed)',
    name: 'after.condition_output.annual_interest_rate'
  }, {
    label: 'Interest Rate (Variable - Index)',
    name: 'after.condition_output.variable_interest_rate'
  }, {
    label: 'Interest Rate (Variable - Maring)',
    name: 'after.condition_output.marginal_interest_rate'
  }, {
    label: 'Origination Fee',
    name: 'after.condition_output.origination_fee_rate'
  }, {
    label: 'APR',
    name: 'after.condition_output.apr'
  }, {
    label: 'Loan Term',
    name: 'after.condition_output.term'
  }, {
    label: 'Other Conditions',
    name: 'after.condition_output.other_conditions'
  }],
  limits: [ {
    label: 'Variable Name',
    name: 'after.state_property_attribute'
  }, {
    label: 'Variable Version',
    name: 'after.variable_version'
  }, {
    label: 'Comparison',
    name: 'after.condition_test'
  }, {
    label: 'Value',
    name: 'after.state_property_attribute_value_comparison'
  }, {
    label: 'Minimum',
    name: 'after.state_property_attribute_value_minimum'
  }, {
    label: 'Maximum',
    name: 'after.state_property_attribute_value_maximum'
  }, {
    label: 'AND Group ID',
    name: 'after.and_group_id'
  }, {
    label: 'OR Group ID',
    name: 'after.or_group_id'
  }],
};

module.exports = {
  COMPARATOR_DROPDOWN,
  ruleValidations,
  ruleFormElements,
  ruleCategoryCreateEditModalMap,
  ruleCategoryCreateEditValidationMap,
  ruleLeftConfigs, 
  ruleRightConfigs,
}
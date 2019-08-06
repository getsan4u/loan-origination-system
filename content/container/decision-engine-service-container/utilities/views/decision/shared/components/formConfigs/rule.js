'use strict';
const moment = require('moment');
const styles = require('../../../../constants').styles;
const capitalize = require('capitalize');
const randomKey = Math.random;
const cardprops = require('../cardProps');
const formElements = require('../formElements');
const CONSTANTS = require('../../../constants');
const CATEGORIES = CONSTANTS.SEGMENT_TYPES;
const COMPARATOR_DROPDOWN = CONSTANTS.COMPARATOR_DROPDOWN;
const COLLECTION_TABS = CONSTANTS.COLLECTION_TABS;
const SEGMENT_TYPES_DROPDOWN = CONSTANTS.SEGMENT_TYPES_DROPDOWN;
const COLLECTION_DETAIL_CONFIGS = require('../collectionDetailConfigs');
const ruleCategoryCreateEditModalMap = CONSTANTS.rule.ruleCategoryCreateEditModalMap({ submitDisplay: 'Create Rule', COMPARATOR_DROPDOWN });
const ruleCategoryCreateEditValidationMap = CONSTANTS.rule.ruleCategoryCreateEditValidationMap;
const updateOverview = require('../updateOverview');
const commentsModal = require('../../../modals/comment');
const ruleValidations = CONSTANTS.rule.ruleValidations;
const ruleFormElements = CONSTANTS.rule.ruleFormElements;

let createHiddenFields = {};
let createValidations = {};
let createFormgroups = {};
let editValidations = {};
let editHiddenFields = {};
let editFormgroups = {};
let newEditFormgroups = {};
let newEditValidations = {};
const ruleOverviewArr = [ {
  label: 'Rule Name',
  name: 'title',
  passProps: {
    state: 'isDisabled',
  },
}, {
  label: 'Version',
  name: 'version',
  passProps: {
    state: 'isDisabled',
  },
}, {
  label: 'Type',
  name: 'displaytype',
  passProps: {
    state: 'isDisabled',
  },
}, {
  name: 'status',
  label: 'Status',
  passProps: {
    state: 'isDisabled',
  }
}, {
  label: 'Created',
  name: 'formattedCreatedAt',
  passProps: {
    state: 'isDisabled',
  },
}, {
  label: 'Updated',
  name: 'formattedUpdatedAt',
  passProps: {
    state: 'isDisabled',
  },
}, {
  label: 'Description',
  name: 'description',
  type: 'textarea',
  sortable: false,
  headerColumnProps: {
    style: {
      whiteSpace: 'normal',
    },
  },
}, ];

CATEGORIES.forEach(category => {
  newEditFormgroups[ category ] = ruleCategoryCreateEditModalMap[ category ]
  newEditValidations[ category ] = ruleCategoryCreateEditValidationMap[ category ]
})

createHiddenFields = [ {
  form_name: 'createdat',
  form_static_val: moment(new Date()).format('MM/DD/YYYY'),
}]

createValidations = [
  {
    name: 'name',
    constraints: {
      name: {
        presence: {
          message: '^Name is required.',
        },
      },
    },
  }, {
    name: 'type',
    constraints: {
      type: {
        presence: {
          message: '^Category is required.',
        },
      },
    },
  },
];

createFormgroups = [ {
  gridProps: {
    key: randomKey(),
  },
  formElements: [ {
    name: 'name',
    label: 'Rule Name',
    keyUp: 'func:window.nameOnChange',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
  }, ]
}, {
  gridProps: {
    key: randomKey(),
  },
  formElements: [ {
    name: 'type',
    label: 'Module Type',
    type: 'dropdown',
    value: '',
    passProps: {
      selection: true,
      fluid: true,
    },
    options: SEGMENT_TYPES_DROPDOWN,
    validateOnChange: true,
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
  }]
},
{
  gridProps: {
    key: randomKey(),
  },
  formElements: [ {
    name: 'rule_type',
    label: 'Rule Type',
    type: 'dropdown',
    value: '',
    passProps: {
      selection: true,
      fluid: true,
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
  }]
},
{
  gridProps: {
    key: randomKey(),
  },
  formElements: [ {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
    placeholder: ' ',
  }, ]
}, {
  gridProps: {
    key: randomKey(),
    className: 'modal-footer-btns',
  },
  formElements: [ {
    type: 'submit',
    value: 'CREATE RULE',
    passProps: {
      color: 'isPrimary'
    },
    layoutProps: {
      style: {
        textAlign: 'center',
        padding: 0,
      },
    },
  }, ]
}, ]

editHiddenFields = [ {
  form_name: '_id',
  form_val: '_id',
}, {
  form_name: 'type',
  form_val: 'type',
}, {
  form_name: 'name',
  form_val: 'name',
}];

COLLECTION_TABS[ 'rule' ].forEach(tab => {
  editFormgroups[ tab.location ] = COLLECTION_DETAIL_CONFIGS[ tab.location ][ 'rule' ];
})

let population_form = {
  component: 'ResponsiveFormContainer',
  comparisonprops: [ {
    'left': [ 'formdata', 'type' ],
    'operation': 'eq',
    'right': 'population'
  }],
  asyncprops: {
    formdata: [ 'ruledata', 'data' ],
    __formOptions: [ 'ruledata', 'formoptions' ],
  },
  props: {
    validations: {
      state_property_attribute: ruleValidations.state_property_attribute,
      condition_test: ruleValidations.condition_test,
      state_property_attribute_value_minimum: ruleValidations.state_property_attribute_value_minimum,
      state_property_attribute_value_maximum: ruleValidations.state_property_attribute_value_maximum,
      state_property_attribute_value_comparison: ruleValidations.state_property_attribute_value_comparison,
      condition_operation: ruleValidations.condition_operation,
      condition_group_id: ruleValidations.condition_group_id,
    },
    formgroups: [ {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ {
        type: 'submit',
        value: 'SAVE',
        passProps: {
          color: 'isPrimary',
        },
        layoutProps: {
          className: 'global-button-save',
        }
      }, ]
    }, {
      gridProps: {
        key: randomKey(),
        // className: '__dynamic_form_elements',
      },
      card: {
        doubleCard: true,
        leftDoubleCardColumn: {
          style: {
            display: 'flex',
          },
        },
        rightDoubleCardColumn: {
          style: {
            display: 'flex',
          },
        },
        leftCardProps: cardprops({
          cardTitle: 'Overview',
          cardStyle: {
            marginBottom: 0,
          },
        }),
        rightCardProps: cardprops({
          cardTitle: 'Rule',
          cardStyle: {
            marginBottom: 0,
          },
        }),
      },
      formElements: [ formElements({
        twoColumns: true,
        doubleCard: true,
        left: ruleOverviewArr,
        right: [
          ruleFormElements.state_property_attribute,
          ruleFormElements.variable_type,
          ruleFormElements.condition_test,
          ruleFormElements.state_property_attribute_value_comparison,
          ruleFormElements.state_property_attribute_value_minimum, ruleFormElements.state_property_attribute_value_maximum,
          ruleFormElements.condition_operation,
          ruleFormElements.condition_group_id,
        ],
        rightOrder: [
          'state_property_attribute',
          'variable_type',
          'condition_test',
          'state_property_attribute_value_comparison',
          'state_property_attribute_value_minimum',
          'state_property_attribute_value_maximum',
          'condition_operation',
          'condition_group_id',
        ]
      })
      ]
    },
    ].concat(COLLECTION_DETAIL_CONFIGS.dependencies.rule),
    renderFormElements: {
      condition_test: 'func:window.comparatorFilter',
      state_property_attribute_value_minimum: 'func:window.minimumFilter',
      state_property_attribute_value_maximum: 'func:window.maximumFilter',
      state_property_attribute_value_comparison: 'func:window.valueFilter',
      condition_operation: 'func:window.operatorFilter',
      condition_group_id: 'func:window.orGroupFilter',
      variable_type: 'func:window.variableTypeFilter',
    },
    form: {
      flattenFormData: true,
      footergroups: false,
      useFormOptions: true,
      "cardForm": false,
      cardFormProps: styles.cardFormProps,
      cardFormTitle: 'Rule Detail',
      onSubmit: {
        url: `/decision/api/standard_rules/:id?format=json`,
        params: [
          { 'key': ':id', 'val': '_id', },
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
        successCallback: 'func:window.editFormSuccessCallback',
      },
      validations: [],
      hiddenFields: editHiddenFields,
    },
  }
};

let requirements_form = {
  component: 'ResponsiveFormContainer',
  comparisonprops: [ {
    'left': [ 'formdata', 'type' ],
    'operation': 'eq',
    'right': 'requirements'
  }],
  asyncprops: {
    formdata: [ 'ruledata', 'data' ],
    __formOptions: [ 'ruledata', 'formoptions' ],
  },
  props: {
    validations: {
      state_property_attribute: ruleValidations.state_property_attribute,
      condition_test: ruleValidations.condition_test,
      state_property_attribute_value_minimum: ruleValidations.state_property_attribute_value_minimum,
      state_property_attribute_value_maximum: ruleValidations.state_property_attribute_value_maximum,
      state_property_attribute_value_comparison: ruleValidations.state_property_attribute_value_comparison,
      condition_operation: ruleValidations.condition_operation,
      condition_group_id: ruleValidations.condition_group_id,
    },
    formgroups: [ {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ {
        type: 'submit',
        value: 'SAVE',
        passProps: {
          color: 'isPrimary',
        },
        layoutProps: {
          className: 'global-button-save',
        }
      }, ]
    }, {
      gridProps: {
        key: randomKey(),
        // className: '__dynamic_form_elements',
      },
      card: {
        doubleCard: true,
        leftDoubleCardColumn: {
          style: {
            display: 'flex',
          },
        },
        rightDoubleCardColumn: {
          style: {
            display: 'flex',
          },
        },
        leftCardProps: cardprops({
          cardTitle: 'Overview',
          cardStyle: {
            marginBottom: 0,
          },
        }),
        rightCardProps: cardprops({
          cardTitle: 'Rule',
          cardStyle: {
            marginBottom: 0,
          },
        }),
      },
      formElements: [ formElements({
        twoColumns: true,
        doubleCard: true,
        left: ruleOverviewArr,
        right: [
          ruleFormElements.state_property_attribute,
          ruleFormElements.variable_type,
          ruleFormElements.state_property_attribute_value_comparison,
          ruleFormElements.state_property_attribute_value_minimum,
          ruleFormElements.state_property_attribute_value_maximum,
          ruleFormElements.condition_test,
          ruleFormElements[ 'condition_adverse_codes' ],
          ruleFormElements.condition_operation,
          ruleFormElements.condition_group_id,
        ],
        rightOrder: [
          'state_property_attribute',
          'variable_type',
          'condition_test',
          'state_property_attribute_value_comparison',
          'state_property_attribute_value_minimum',
          'state_property_attribute_value_maximum',
          'condition_adverse_codes',
          'condition_operation',
          'condition_group_id'
        ],
      })
      ]
    }, ].concat(COLLECTION_DETAIL_CONFIGS.dependencies.rule),
    renderFormElements: {
      condition_test: 'func:window.comparatorFilter',
      state_property_attribute_value_minimum: 'func:window.minimumFilter',
      state_property_attribute_value_maximum: 'func:window.maximumFilter',
      state_property_attribute_value_comparison: 'func:window.valueFilter',
      condition_operation: 'func:window.operatorFilter',
      condition_group_id: 'func:window.orGroupFilter',
      variable_type: 'func:window.variableTypeFilter',
    },
    form: {
      "cardForm": false,
      cardFormTitle: 'Rule Detail',
      "cardFormProps": styles.cardFormProps,
      flattenFormData: true,
      footergroups: false,
      useFormOptions: true,
      onSubmit: {
        url: `/decision/api/standard_rules/:id?format=json`,
        params: [
          { 'key': ':id', 'val': '_id', },
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
        successCallback: 'func:window.editFormSuccessCallback',
      },
      validations: [],
      hiddenFields: editHiddenFields,
    },
  }
};

let scorecard_form = {
  component: 'ResponsiveFormContainer',
  comparisonprops: [ {
    'left': [ 'formdata', 'type' ],
    'operation': 'eq',
    'right': 'scorecard'
  }],
  asyncprops: {
    formdata: [ 'ruledata', 'data' ],
    __formOptions: [ 'ruledata', 'formoptions' ],
  },
  props: {
    validations: {
      state_property_attribute: ruleValidations.state_property_attribute,
      condition_test: ruleValidations.condition_test,
      state_property_attribute_value_minimum: ruleValidations.state_property_attribute_value_minimum,
      state_property_attribute_value_maximum: ruleValidations.state_property_attribute_value_maximum,
      state_property_attribute_value_comparison: ruleValidations.state_property_attribute_value_comparison,
    },
    formgroups: [ {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ {
        type: 'submit',
        value: 'SAVE',
        passProps: {
          color: 'isPrimary',
        },
        layoutProps: {
          className: 'global-button-save',
        }
      }, ]
    }, {
      gridProps: {
        key: randomKey(),
        // className: '__dynamic_form_elements',
      },
      card: {
        doubleCard: true,
        leftDoubleCardColumn: {
          style: {
            display: 'flex',
          },
        },
        rightDoubleCardColumn: {
          style: {
            display: 'flex',
          },
        },
        leftCardProps: cardprops({
          cardTitle: 'Overview',
          cardStyle: {
            marginBottom: 0,
          },
        }),
        rightCardProps: cardprops({
          cardTitle: 'Rule',
          cardStyle: {
            marginBottom: 0,
          },
        }),
      },
      formElements: [ formElements({
        twoColumns: true,
        doubleCard: true,
        left: ruleOverviewArr,
        right: [
          ruleFormElements.state_property_attribute,
          ruleFormElements.variable_type,
          ruleFormElements.condition_test,
          ruleFormElements.state_property_attribute_value_comparison,
          ruleFormElements.state_property_attribute_value_minimum,
          ruleFormElements.state_property_attribute_value_maximum,
          ruleFormElements[ 'condition_output.weight' ]
        ],
        rightOrder: [
          'state_property_attribute',
          'variable_type',
          'condition_test',
          'state_property_attribute_value_comparison',
          'state_property_attribute_value_minimum',
          'state_property_attribute_value_maximum',
          'condition_output.weight',
        ]
      })
      ]
    }, ].concat(COLLECTION_DETAIL_CONFIGS.dependencies.rule),
    renderFormElements: {
      condition_test: 'func:window.comparatorFilter',
      state_property_attribute_value_minimum: 'func:window.minimumFilter',
      state_property_attribute_value_maximum: 'func:window.maximumFilter',
      state_property_attribute_value_comparison: 'func:window.valueFilter',
      condition_operation: 'func:window.operatorFilter',
      condition_group_id: 'func:window.orGroupFilter',
      variable_type: 'func:window.variableTypeFilter',
    },
    form: {
      "cardForm": false,
      cardFormTitle: 'Rule Detail',
      "cardFormProps": styles.cardFormProps,
      flattenFormData: true,
      footergroups: false,
      useFormOptions: true,
      onSubmit: {
        url: `/decision/api/standard_rules/:id?format=json`,
        params: [
          { 'key': ':id', 'val': '_id', },
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
        successCallback: 'func:window.editFormSuccessCallback',
      },
      validations: [],
      hiddenFields: editHiddenFields,
    },
  }
};

let output_form = {
  component: 'ResponsiveFormContainer',
  comparisonprops: [ {
    'left': [ 'formdata', 'type' ],
    'operation': 'eq',
    'right': 'output'
  }],
  asyncprops: {
    formdata: [ 'ruledata', 'data' ],
    __formOptions: [ 'ruledata', 'formoptions' ],
  },
  props: {
    validations: {
      state_property_attribute: ruleValidations.state_property_attribute,
      condition_test: ruleValidations.condition_test,
      state_property_attribute_value_minimum: ruleValidations.state_property_attribute_value_minimum,
      state_property_attribute_value_maximum: ruleValidations.state_property_attribute_value_maximum,
      state_property_attribute_value_comparison: ruleValidations.state_property_attribute_value_comparison,
    },
    formgroups: [ {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ {
        type: 'submit',
        value: 'SAVE',
        passProps: {
          color: 'isPrimary',
        },
        layoutProps: {
          className: 'global-button-save',
        }
      }, ]
    }, {
      gridProps: {
        key: randomKey(),
        // className: '__dynamic_form_elements',
      },
      card: {
        doubleCard: true,
        leftDoubleCardColumn: {
          style: {
            display: 'flex',
          },
        },
        rightDoubleCardColumn: {
          style: {
            display: 'flex',
          },
        },
        leftCardProps: cardprops({
          cardTitle: 'Overview',
          cardStyle: {
            marginBottom: 0,
          },
        }),
        rightCardProps: cardprops({
          cardTitle: 'Rule',
          cardStyle: {
            marginBottom: 0,
          },
        }),
      },
      formElements: [ formElements({
        twoColumns: true,
        doubleCard: true,
        left: ruleOverviewArr,
        right: [
          ruleFormElements.state_property_attribute,
          ruleFormElements.variable_type,
          ruleFormElements.condition_test,
          ruleFormElements.state_property_attribute_value_comparison,
          ruleFormElements.state_property_attribute_value_minimum,
          ruleFormElements.state_property_attribute_value_maximum,
          ruleFormElements[ 'condition_output.annual_interest_rate' ],
          ruleFormElements[ 'condition_output.variable_interest_rate' ],
          ruleFormElements[ 'condition_output.marginal_interest_rate' ],
          ruleFormElements[ 'condition_output.origination_fee_rate' ],
          ruleFormElements[ 'condition_output.apr' ],
          ruleFormElements[ 'condition_output.term' ],
          ruleFormElements[ 'condition_output.other_conditions' ],
        ],
        rightOrder: [
          'state_property_attribute',
          'variable_type',
          'condition_test',
          'state_property_attribute_value_comparison',
          'state_property_attribute_value_minimum',
          'state_property_attribute_value_maximum',
          'condition_output.annual_interest_rate',
          'condition_output.variable_interest_rate',
          'condition_output.marginal_interest_rate',
          'condition_output.origination_fee_rate',
          'condition_output.apr',
          'condition_output.term',
          'condition_output.other_conditions',
        ]
      })
      ]
    }, ].concat(COLLECTION_DETAIL_CONFIGS.dependencies.rule),
    renderFormElements: {
      condition_test: 'func:window.comparatorFilter',
      state_property_attribute_value_minimum: 'func:window.minimumFilter',
      state_property_attribute_value_maximum: 'func:window.maximumFilter',
      state_property_attribute_value_comparison: 'func:window.valueFilter',
      variable_type: 'func:window.variableTypeFilter',
    },
    form: {
      "cardForm": false,
      cardFormTitle: 'Rule Detail',
      "cardFormProps": styles.cardFormProps,
      flattenFormData: true,
      footergroups: false,
      useFormOptions: true,
      onSubmit: {
        url: `/decision/api/standard_rules/:id?format=json`,
        params: [
          { 'key': ':id', 'val': '_id', },
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
        successCallback: 'func:window.editFormSuccessCallback',
      },
      validations: [],
      hiddenFields: editHiddenFields,
    },
  }
};

let limits_form = {
  component: 'ResponsiveFormContainer',
  comparisonprops: [ {
    'left': [ 'formdata', 'type' ],
    'operation': 'eq',
    'right': 'limits'
  }],
  asyncprops: {
    formdata: [ 'ruledata', 'data' ],
    __formOptions: [ 'ruledata', 'formoptions' ],
  },
  props: {
    validations: {
      state_property_attribute: ruleValidations.state_property_attribute,
      condition_test: ruleValidations.condition_test,
      state_property_attribute_value_minimum: ruleValidations.state_property_attribute_value_minimum,
      state_property_attribute_value_maximum: ruleValidations.state_property_attribute_value_maximum,
      state_property_attribute_value_comparison: ruleValidations.state_property_attribute_value_comparison,
    },
    formgroups: [ {
      gridProps: {
        key: randomKey(),
      },
      formElements: [ {
        type: 'submit',
        value: 'SAVE',
        passProps: {
          color: 'isPrimary',
        },
        layoutProps: {
          className: 'global-button-save',
        }
      }, ]
    }, {
      gridProps: {
        key: randomKey(),
        // className: '__dynamic_form_elements',
      },
      card: {
        doubleCard: true,
        leftDoubleCardColumn: {
          style: {
            display: 'flex',
          },
        },
        rightDoubleCardColumn: {
          style: {
            display: 'flex',
          },
        },
        leftCardProps: cardprops({
          cardTitle: 'Overview',
          cardStyle: {
            marginBottom: 0,
          },
        }),
        rightCardProps: cardprops({
          cardTitle: 'Rule',
          cardStyle: {
            marginBottom: 0,
          },
        }),
      },
      formElements: [ formElements({
        twoColumns: true,
        doubleCard: true,
        left: ruleOverviewArr,
        right: [
          ruleFormElements.state_property_attribute,
          ruleFormElements.variable_type,
          ruleFormElements.condition_test, ruleFormElements.state_property_attribute_value_comparison, ruleFormElements.state_property_attribute_value_minimum, ruleFormElements.state_property_attribute_value_maximum,
          ruleFormElements[ 'and_group_id' ],
          ruleFormElements[ 'or_group_id' ],
        ],
        rightOrder: [
          'state_property_attribute',
          'variable_type',
          'condition_test',
          'state_property_attribute_value_comparison',
          'state_property_attribute_value_minimum',
          'state_property_attribute_value_maximum',
          'and_group_id',
          'or_group_id',
        ]
      })
      ]
    }, ].concat(COLLECTION_DETAIL_CONFIGS.dependencies.rule),
    renderFormElements: {
      condition_test: 'func:window.comparatorFilter',
      state_property_attribute_value_minimum: 'func:window.minimumFilter',
      state_property_attribute_value_maximum: 'func:window.maximumFilter',
      state_property_attribute_value_comparison: 'func:window.valueFilter',
      variable_type: 'func:window.variableTypeFilter',
    },
    form: {
      flattenFormData: true,
      footergroups: false,
      useFormOptions: true,
      "cardForm": false,
      cardFormTitle: 'Rule Detail',
      "cardFormProps": styles.cardFormProps,
      onSubmit: {
        url: `/decision/api/standard_rules/:id?format=json`,
        params: [
          { 'key': ':id', 'val': '_id', },
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
        successCallback: 'func:window.editFormSuccessCallback',
      },
      validations: [],
      hiddenFields: editHiddenFields,
    },
  }
};

let additionalComponents = [
  population_form,
  requirements_form,
  output_form,
  scorecard_form,
  limits_form,
];

let ruleLeftConfigs = {
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

let ruleRightConfigs = {
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
}

const createConfigs = { validations: createValidations, hiddenFields: createHiddenFields, formgroups: createFormgroups };
const editConfigs = { validations: newEditValidations, hiddenFields: editHiddenFields, formgroups: editFormgroups, additionalComponents };

module.exports = {
  create: createConfigs,
  edit: editConfigs,
}
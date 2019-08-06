'use strict';
const OPTIMIZATION = require('./optimization');
const ML = require('./ml');
const LOS = require('./los');

const DECISION_MODELS = [
  'standard_strategy',
  'standard_rule',
  'standard_variable',
];

const SIMULATION_MODELS = [
  'standard_testcase',
];

const PARENT_MAP = {
  'strategies': null,
  'variables': 'strategies',
};

const CHILD_MAP = {
  'strategies': 'variables',
};

const COMPARATOR_MAP = {
  'EQUAL': '=',
  'NOT EQUAL': '<>',
  'CAP': '<=',
  'FLOOR': '>=',
  'GT': '>',
  'LT': '<',
  'RANGE': 'Between',
  'IN': 'In',
  'NOT IN': 'Not In',
  'IS NULL': 'Is Null',
  'IS NOT NULL': 'Is Not Null',
};

const SEGMENT_TYPE_DB_MAP = {
  'requirements': 'requirements',
  'assignments': 'assignments',
  'population': 'population',
  'output': 'output',
  'scorecard': 'scorecard',
};

const SKIP_NUMERIC_COERCION = [
  'condition_adverse_codes',
  'condition_referral_codes',
];

const COMBINED_VALUE_COMPARISON_PROPERTY = {
  label: {
    component: 'Columns',
    children: [{
      component: 'Column',
      props: {
        size: 'is5',
      },
      children: 'Variable',
    }, {
      component: 'Column',
      props: {
        size: 'is3',
      },
      children: 'Comparison',
    }, {
      component: 'Column',
      props: {
        size: 'is4',
      },
      children: 'Value',
    },],
  },
  sortid: 'combined_value_comparison_property',
  sortable: false,
};

const UPDATE_HISTORY_HEADERS = {
  'textmessage': [{
    label: 'Variable',
    sortid: 'state_property_attribute',
    sortable: false,
  }, {
    label: 'Value',
    sortid: 'state_property_attribute_value_comparison',
    sortable: false,
  },],
  'dataintegration_input': [{
    label: 'Data Item Name',
    sortid: 'display_name',
    sortable: false,

  }, {
    label: 'Variable Used',
    sortid: 'input_variable',
    sortable: false,
  },],
  'dataintegration_output': [{
    label: 'Data Item Name',
    sortid: 'api_name',
    sortable: false,
  }, {
    label: 'Variable Assigned',
    sortid: 'output_variable',
    sortable: false,
  },],
  'artificialintelligence': [{
    label: 'Data Field',
    sortid: 'model_variable_name',
    sortable: false,
  }, {
    label: 'Data Type',
    sortid: 'data_type',
    sortable: false,
  }, {
    label: 'Variable Used',
    sortid: 'system_variable_id',
    sortable: false,
  },],
  'email': [{
    label: 'Variable',
    sortid: 'state_property_attribute',
    sortable: false,
  }, {
    label: 'Value',
    sortid: 'state_property_attribute_value_comparison',
    sortable: false,
  },],
  'assignments': [{
    label: 'Output Variable',
    sortid: 'state_property_attribute',
    sortable: false,
  }, {
    label: 'Result Assigned',
    sortid: 'state_property_attribute_value_comparison',
    sortable: false,
  },],
  'calculations': [{
    label: 'Output Variable',
    sortid: 'state_property_attribute',
    sortable: false,
  }, {
    label: 'Calculation Script',
    sortid: 'state_property_attribute_value_comparison',
    sortable: false,
  },],
  'requirements': [COMBINED_VALUE_COMPARISON_PROPERTY, {
    label: 'Decline Reason (If Rule Fails)',
    sortid: 'condition_output_display',
    sortable: false,
    headerColumnProps: {
      style: {
        width: '20%',
      },
    },
  },],
  'output': [COMBINED_VALUE_COMPARISON_PROPERTY, {
    label: 'Output',
    sortid: 'condition_output_display',
    sortable: false,
    headerColumnProps: {
      style: {
        width: '20%',
      },
    },
  },],
  'scorecard': [COMBINED_VALUE_COMPARISON_PROPERTY, {
    label: 'Weight',
    sortid: 'condition_output_display',
    sortable: false,
    headerColumnProps: {
      style: {
        width: '20%',
      },
    },
  },],
  'population': [COMBINED_VALUE_COMPARISON_PROPERTY, ],
  documentcreation: [{
    label: 'Data Item Name',
    sortid: 'display_name',
    sortable: false,
    headerColumnProps: {
      style: {
        width: '20%',
      },
    },
  }, {
    label: 'Variable Used',
    sortid: 'input_variable',
    sortable: false,
    headerColumnProps: {
      style: {
        width: '20%',
      },
    },
  }, ],
};

const RULES_TEMPLATE_DOWNLOAD_CONSTANTS = {
  assignments: {
    condition: {
      numColumns: 1,
      nestedHeaders: ['variable_system_name', 'value', 'value_type'],
    }
  },
  calculations: {
    condition: {
      numColumns: 1,
      nestedHeaders: ['variable_system_name', 'value'],
    },
    calculation_inputs: {
      numColumns: 5,
      nestedHeaders: ['variable_system_name'],
    },
    calculation_outputs: {
      numColumns: 5,
      nestedHeaders: ['variable_system_name'],
    }
  },
  output: {
    singleHeaders: ['rule_type'],
    output: {
      numColumns: 10,
      nestedHeaders: ['variable_system_name', 'value', 'value_type']
    },
    condition: {
      numColumns: 10,
      nestedHeaders: ['variable_system_name', 'type', 'value', 'value_type', 'minimum', 'minimum_type', 'maximum', 'maximum_type'],
    }
  },
  population: {
    singleHeaders: ['rule_type'],
    condition: {
      numColumns: 10,
      nestedHeaders: ['variable_system_name', 'type', 'value', 'value_type', 'minimum', 'minimum_type', 'maximum', 'maximum_type'],
    }
  },
  scorecard: {
    singleHeaders: ['rule_type'],
    output: {
      numColumns: 1,
      nestedHeaders: ['variable_system_name', 'value', 'value_type']
    },
    condition: {
      numColumns: 10,
      nestedHeaders: ['variable_system_name', 'type', 'value', 'value_type', 'minimum', 'minimum_type', 'maximum', 'maximum_type'],
    }
  },
  requirements: {
    singleHeaders: ['rule_type'],
    output: {
      numColumns: 1,
      nestedHeaders: ['variable_system_name', 'value', 'value_type']
    },
    condition: {
      numColumns: 10,
      nestedHeaders: ['variable_system_name', 'type', 'value', 'value_type', 'minimum', 'minimum_type', 'maximum', 'maximum_type'],
    }
  }
}

const RULES_TEMPLATE_COMPARATOR_MAP = {
  '=': 'EQUAL',
  '<>': 'NOT EQUAL',
  '<=': 'CAP',
  '>=': 'FLOOR',
  '>': 'GT',
  '<': 'LT',
  'Between': 'RANGE',
  'In': 'IN',
  'Not In': 'NOT IN',
  'Is Null': 'IS NULL',
  'Is Not Null': 'IS NOT NULL',
};

const CHART_COLORS = [ '#A166FF', '#70AD47', '#189fdd', '#2f5597', '#ff9900', '#7030a0', '#d64d5e', '#7D2E68', '#c55a11', '#E5BDBD', '#4B88A2', '#F90031', '#A100FF', '#759FBC', '#2F5377', '#251351', '#463730', '#436209', '#F2B216', '#00FF04', '#7EB51E', '#1F5673', '#A5FFD6', '#D1483E', '#90C3C8', '#3391C4', '#355553', '#FF5973', '#C97B84', '#DB7C00', '#1E87C7', '#41337A', '#FFF200', '#1B1C36', '#078053', '#B9B8D3', '#7FAD99', '#331E36', '#FFCFD2', '#6EA4BF', '#068EA0', '#2BD1FF', '#E66A46', '#FF3700', '#FF4300', '#00FFF6', '#003DB7', '#FFDF00', '#D3D4D9', '#F0A095', '#75DDDD', ];

const DIGIFI_COLOR = '#007aff';

module.exports = {
  score_analysis: require('./score_analysis'),
  input_analysis: require('./input_analysis'),
  documents: require('./documents'),
  CHILD_MAP,
  OPTIMIZATION,
  ML,
  LOS,
  COMPARATOR_MAP,
  DECISION_MODELS,
  SIMULATION_MODELS,
  PARENT_MAP,
  SEGMENT_TYPE_DB_MAP,
  SKIP_NUMERIC_COERCION,
  UPDATE_HISTORY_HEADERS,
  RULES_TEMPLATE_DOWNLOAD_CONSTANTS,
  RULES_TEMPLATE_COMPARATOR_MAP,
  CHART_COLORS,
  DIGIFI_COLOR,
};
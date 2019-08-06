'use strict';
const capitalize = require('capitalize');
const pluralize = require('pluralize');
const rule = require('./rule');
const ENTIRE_POPULATION_MONGO_ID = '5a74deb7256cb945e14cc6d5';
const MODELS = [
  'standard_strategy',
  'standard_rule',
  'standard_variable',
];
const TYPES = [ 'variable', 'rule', 'strategy', ];

const SEGMENT_TYPES = [ 'population', 'requirements', 'scorecard', 'output', 'assignments', 'calculations', 'email', 'textmessage' ];

const SEGMENT_TYPES_DROPDOWN = [ {
  label: ' ',
  value: '',
}, {
  label: 'Population',
  value: 'population',
}, {
  label: 'Requirements',
  value: 'requirements'
}, {
  label: 'Scorecard',
  value: 'scorecard'
}, {
  label: 'Output',
  value: 'output'
}, ];

const COMPARATOR_DROPDOWN = [ {
  label: ' ',
  value: '',
}, {
  label: '=',
  value: 'EQUAL',
}, {
  label: '<>',
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
  label: 'Between',
  value: 'RANGE',
}, {
  label: 'In',
  value: 'IN',
}, {
  label: 'Not In',
  value: 'NOT IN',
},
{
  label: 'Is Null',
  value: 'IS NULL',
}, {
  label: 'Is Not Null',
  value: 'IS NOT NULL',
}
  //   {
  //   label: 'EXISTS',
  //   value: 'EXISTS',
  // }, {
  //   label: 'DOES NOT EXIST',
  //   value: 'NOT EXISTS',
  //   }
]

const DATA_TYPES_DROPDOWN = [ {
  label: ' ',
  value: '',
}, {
  label: 'Number',
  value: 'Number',
}, {
  label: 'String',
  value: 'String'
}, {
  label: 'Boolean',
  value: 'Boolean'
}, {
  label: 'Date',
  value: 'Date'
}, ]

const VARIABLE_TYPES_DROPDOWN = [ {
  label: ' ',
  value: '',
}, {
  label: 'Input Variable',
  value: 'Input',
}, {
  label: 'Output Variable',
  value: 'Output'
} ]

const CUSTOM_COLLECTION_TABS = {
  strategy: [
    {
      label: `Process Flow`,
      location: 'overview',
    },
    {
      label: `Rules`,
      location: 'segment',
    }, {
      label: 'Update History Detail',
      location: 'update_history_detail',
    }, {
      label: 'Versions & Updates',
      location: 'versions',
    } ],
  rule: [
    {
      label: `Rule Detail`,
      location: 'detail',
    }, {
      label: 'Update History Detail',
      location: 'update_history_detail',
    }, {
      label: 'Versions & Updates',
      location: 'versions',
    } ],
  variable: [
    {
      label: `Variable Detail`,
      location: 'detail',
    }, {
      label: 'Update History Detail',
      location: 'update_history_detail',
    }, {
      label: 'Versions & Updates',
      location: 'versions',
    } ],
}

let COLLECTION_TABS = {};


TYPES.forEach(type => {
  COLLECTION_TABS[ type ] = CUSTOM_COLLECTION_TABS[ type ];
})

const ACTIVE_TABS = (options) => {
  options = options || {};
  if (options.isVariable) {
    return [ {
      label: `All Variables`,
      url: options.query ? `/input?${options.query}` : `/input`,
      name: 'all'
    }, {
      label: `Input Variables`,
      url: options.query ? `/input?${options.query}` : `/input`,
      name: 'input'
    }, {
      label: `Output Variables`,
      url: options.query ? `/output?${options.query}` : `/output`,
      name: 'output',
    }, ];
  } else {
    return [ {
      label: `All Versions`,
      url: options.query ? `/all?${options.query}` : `/all`,
      name: 'all'
    }, {
      label: `Active Versions`,
      url: options.query ? `/active?${options.query}` : `/active`,
      name: 'active',
    }, {
      label: `Testing Versions`,
      url: options.query ? `/test?${options.query}` : `/test`,
      name: 'testing',
    }, ];
  }
}

const FIND_TAB_CONFIGS = {
  variable: {
    outerTabs: ACTIVE_TABS({ isVariable: true }),
  },
  strategy: {
    outerTabs: ACTIVE_TABS(),
  },
};

const MODULE_TYPE_MAP = {
  'requirements': 'Requirements Rules',
  'calculations': 'Calculation Scripts',
  'dataintegration': 'Data Integration',
  'assignments': 'Simple Outputs',
  'output': 'Rule-Based Outputs',
  'scorecard': 'Scoring Model',
  'artificialintelligence': 'Artificial Intelligence',
  'email': 'Send Email',
  'textmessage': 'Send Text Message',
  'population': 'Population',
};

const STATIC_VARIABLE_LABEL_MAP = {
  email: {
    'to': 'To (Email Address)',
    'subject': 'Subject',
    'html': 'Email Content',
  },
  textmessage: {
    'to': 'To (Phone Number)',
    'body': 'Text Message',
  },
};

const SINGLE_RULE_MODULES = {
  'textmessage': true,
  'email': true,
};

const NON_STANDARD_MODULES = {
  'artificialintelligence': true,
  'dataintegration': true,
  'documentocr': true,
  'documentcreation': true,
};

const COMPANY_SETTINGS_TABS = (options) => {
  return [ {
    label: 'Billing',
    url: '/billing',
    name: 'billing'
  }, {
    label: 'Users',
    url: '/users',
    name: 'users',
  }, {
    label: 'Activity',
    url: '/activity',
    name: 'activity',
  }, ];
};


module.exports = {
  NON_STANDARD_MODULES,
  MODELS,
  TYPES,
  ENTIRE_POPULATION_MONGO_ID,
  SEGMENT_TYPES,
  SINGLE_RULE_MODULES,
  SEGMENT_TYPES_DROPDOWN,
  ACTIVE_TABS,
  COLLECTION_TABS,
  COMPARATOR_DROPDOWN,
  DATA_TYPES_DROPDOWN,
  FIND_TAB_CONFIGS,
  MODULE_TYPE_MAP,
  STATIC_VARIABLE_LABEL_MAP,
  VARIABLE_TYPES_DROPDOWN,
  COMPANY_SETTINGS_TABS,
  rule,
};
'use strict';
const moment = require('moment');
const styles = require('../../../../constants').styles;
const capitalize = require('capitalize');
const randomKey = Math.random;
const CONSTANTS = require('../../../constants');
const CATEGORIES = CONSTANTS.SEGMENT_TYPES;
const COLLECTION_TABS = CONSTANTS.COLLECTION_TABS;
const COLLECTION_DETAIL_CONFIGS = require('../collectionDetailConfigs');
const commentsModal = require('../../../modals/comment');
const cardprops = require('../cardProps');
const conditions = require('../conditions');

let editHiddenFields = {};
let editFormgroups = {};

const createValidations = [
  {
    name: 'name',
    constraints: {
      name: {
        presence: {
          message: '^Strategy Name is required.',
        },
      },
    },
  }, 
];

const editValidations = [
  {
    name: 'name',
    constraints: {
      name: {
        presence: {
          message: '^Name is required.',
        },
      },
    },
  }
];

let createHiddenFields = [];

let createFormgroups = [ {
  gridProps: {
    key: randomKey(),
  },
  formElements: [ {
    name: 'name',
    label: 'Strategy Name',
    validateOnBlur: true,
    keyUp: 'func:window.nameOnChange',
    onBlur: true,
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
    layoutProps: {
    },
  }, ]
},
{
  gridProps: {
    key: randomKey(),
  },
  formElements: [ {
    name: 'description',
    customLabel: {
      component: 'span',
      children: [{
        component: 'span',
        children: 'Description ',
      }, {
          component: 'span',
          children: 'Optional',
        props: {
          style: {
            fontStyle: 'italic',
            marginLeft: '2px',
            fontWeight: 'normal',
            color: styles.colors.gray
          }
        }
      }]
    },
    type: 'textarea',
    placeholder: ' ',
    validateOnBlur: true,
    onBlur: true,
    errorIconRight: true,
    errorIcon: 'fa fa-exclamation',
    layoutProps: {
    },
  }, ]
}, {
  gridProps: {
    key: randomKey(),
    className: 'modal-footer-btns',
  },
  formElements: [ {
    type: 'submit',
    value: 'CREATE STRATEGY',
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

COLLECTION_TABS[ 'strategy' ].forEach(tab => {
  if (tab.location !== 'segment') {
    editFormgroups[ tab.location ] = COLLECTION_DETAIL_CONFIGS[ tab.location ][ 'strategy' ];
  }
})

editHiddenFields = CATEGORIES.reduce((hidden, category) => {
  hidden[ category ] = [ {
    form_name: 'type',
    form_static_val: category
  }];
  return hidden;
}, {});

editFormgroups[ 'edit_modal' ] = {
  ruleset: [ {
    gridProps: {
      key: randomKey(),
      className: '__dynamic_form_elements'
    },
    formElements: [ {
      label: 'Rule Set Type',
      name: 'type',
      type: 'dropdown',
      validateOnChange: true,
      passProps: {
        selection: true,
        fluid: true,
      },
      value: 'requirements',
      options: [{
        'label': 'Requirements',
        'value': 'requirements',
      }, {
        'label': 'Scorecard',
        'value': 'scorecard',
      }, {
        'label': 'Output',
        'value': 'output',
      }, {
        'label': 'Limits',
        'value': 'limits',
      }, ],
    }, {
      name: 'ruleset',
      label: 'Select Rule Set',
      type: 'dropdown',
      validateOnChange: true,
      passProps: {
        selection: true,
        fluid: true,
        search: true,
      },
      layoutProps: {
      },
    }, {
      name: 'conditions_check',
      label: 'Applicable Population',
      type: 'dropdown',
      validateOnChange: true,
      passProps: {
        selection: true,
        fluid: true,
        search: true,
      },
      layoutProps: {
        },
      value: 'all',
      options: [{
        'label': 'Entire Population',
        'value': 'all',
      }, {
        'label': 'Specific Population Segment',
        'value': 'specific',
      }, ],
    }, {
      name: 'conditions',
      label: 'Select Population Rule Set',
      type: 'dropdown',
      validateOnChange: true,
      passProps: {
        selection: true,
        fluid: true,
        search: true,
      },
      layoutProps: {
      },
    }]
  }, {
    gridProps: {
      key: randomKey(),
      className: 'modal-footer-btns',
    },
    formElements: [ {
      value: 'ADD RULE SET TO STRATEGY',
      type: 'submit',
      passProps: {
        color: 'isPrimary'
      },
      'layoutProps': {
        style: {
          textAlign: 'center',
        }
      },
    }]
  }],
};

const createConfigs = { validations: createValidations, hiddenFields: createHiddenFields, formgroups: createFormgroups };
const editConfigs = { validations: [], hiddenFields: editHiddenFields, formgroups: editFormgroups };
module.exports = {
  create: createConfigs,
  edit: editConfigs,
}
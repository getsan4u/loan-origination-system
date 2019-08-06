'use strict';
const moment = require('moment');
const styles = require('../../../../constants').styles;
const capitalize = require('capitalize');
const randomKey = Math.random;
const cardprops = require('../cardProps');
const conditions = require('../conditions');
const formElements = require('../formElements');
const CONSTANTS = require('../../../constants');
const commentsModal = require('../../../modals/comment');
const DATA_TYPES_DROPDOWN = CONSTANTS.DATA_TYPES_DROPDOWN;
const VARIABLE_TYPES_DROPDOWN = CONSTANTS.VARIABLE_TYPES_DROPDOWN;
const COMPARATOR_DROPDOWN = CONSTANTS.COMPARATOR_DROPDOWN;
const strategy_segments = require('./segments');
const overview = require('./overview');
const strategy_overview = overview.strategy;

const variable = [ {
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
  },
  card: {
    props: cardprops({
      cardTitle: 'Calculation Detail',
    }),
  },
  comparisonprops: [{
    left: ['active', ],
    operation: 'eq',
    right: false,
  }],
  formElements: [ {
    type: 'layout',
    value: {
      component: 'div',
      bindprops: true,
      children: [ {
        component: 'span',
        thisprops: {
          children: [ 'formdata', 'state_property_attribute' ]
        },
      }, {
        component: 'span',
        children: ' =',
      }]
    }
  }, {
    name: 'value',
    type: 'code',
  }, ],
}, {
  gridProps: {
    key: randomKey(),
  },
  card: {
    props: cardprops({
      cardTitle: 'Variables Required for Calculation (i.e. Select All Variables Required Above)',
    }),
  },
  formElements: [ {
    name: 'required_variables',
    label: 'Variables',
    type: 'dropdown',
    // validateOnChange: true,
    passProps: {
      selection: true,
      multiple: true,
      fluid: true,
      search: true,
    },
  }, ],
}, ];

const DETAIL_CONFIGS = {
  variable: [],
  rule: [],
  'strategy': [
    ...strategy_overview,
    ...strategy_segments[ 'strategy' ] ],
};

module.exports = DETAIL_CONFIGS;
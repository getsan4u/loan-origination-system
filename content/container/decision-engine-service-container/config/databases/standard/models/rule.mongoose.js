'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  name: {
    type: String,
    index: true,
    required: true,
  },
  title: {
    type: String,
    index: true,
    required: true,
  },
  latest_version: Boolean,
  description: String,
  rule_type: String,
  calculation_inputs: [{
    ref: 'Variable',
    type: ObjectId
  }],
  calculation_outputs: [{
    ref: 'Variable',
    type: ObjectId
  }],
  multiple_rules: [{
    state_property_attribute: {
      type: ObjectId,
      ref: 'Variable',
    },
    static_state_property_attribute: {
      type: 'String',
    },
    condition_test: {
      type: String,
      uppercase: true,
      enum: ['CAP', 'FLOOR', 'RANGE', 'EQUAL', 'NOT EQUAL', 'IN', 'NOT IN', 'LT', 'GT', 'EXISTS', 'DEEPEQUAL', 'NOT DEEPEQUAL', 'IS NULL', 'IS NOT NULL',],
    },
    state_property_attribute_value_comparison: Schema.Types.Mixed,
    state_property_attribute_value_comparison_type: String,
    state_property_attribute_value_minimum: Schema.Types.Mixed,
    state_property_attribute_value_minimum_type: String,
    state_property_attribute_value_maximum: Schema.Types.Mixed,
    state_property_attribute_value_maximum_type: String,
  },],
  condition_output: [Schema.Types.Mixed,],
  type: {
    type: String,
    required: true,
  },
  version: {
    type: Number,
    default: 1,
  },
  locked: {
    default: false,
    type: Boolean,
  },
  change: {
    type: ObjectId,
    ref: 'Change',
  },
  strategy: {
    index: true,
    type: ObjectId,
    ref: 'Strategy',
  },
  user: Schema.Types.Mixed,
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: ['_id', 'name', 'organization'],
    sort: { createdat: -1, },
    search: ['name',],
    population: 'multiple_rules.state_property_attribute change strategy output_variable',
    uniqueCompound: { name: 1, organization: 1, },
  },
};
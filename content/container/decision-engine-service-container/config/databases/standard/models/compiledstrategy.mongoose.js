
'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

let segment = {
  name: String,
  type: String,
  conditions: [Schema.Types.Mixed,],
  ruleset: [Schema.Types.Mixed,],
};

let segments = [segment,];

const scheme = {
  name: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  status: String,
  version: {
    type: Number,
    default: 1,
  },
  module_run_order: [Schema.Types.Mixed,],
  createdat: {
    type: Date,
    default: Date.now,
  },
  updatedat: {
    type: Date,
    default: Date.now,
  },
  templates: [ {
    fileurl: String,
    filename: String,
  }],
  input_variables: [{
    type: ObjectId,
    ref: 'Variable',
  },],
  output_variables: [{
    type: ObjectId,
    ref: 'Variable',
  }, ],
  calculated_variables: [{
    type: ObjectId,
    ref: 'Variable',
  }, ],
  decline_reasons: [String, ],
  rules: [{
    type: ObjectId,
    ref: 'Rule',
  },],
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
    population: 'organization input_variables output_variables calculated_variables rules',
    docid: ['_id', 'name',],
    sort: { createdat: -1, },
    search: [ 'title', 'name', ],
    uniqueCompound: { title: 1, status: 1, organization: 1, },
  },
};

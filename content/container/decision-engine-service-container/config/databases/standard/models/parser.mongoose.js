'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  id: ObjectId,
  name: {
    type: String,
    index: true,
    required: true,
  },
  data_provider: String,
  status: String,
  createdat: {
    type: Date,
    default: Date.now,
  },
  updatedat: {
    type: Date,
    default: Date.now,
  },
  description: String,
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  main: String,
  global_functions: [ {
    name: String,
    operation: String,
  },],
  variables: [ {
    _id: false,
    api_name: String,
    description: String,
    data_type: String,
    display_name: String,
    example: String,
    output_variable: {
      type: ObjectId,
      ref: 'Variable',
    },
  },]
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: ['_id', 'name', ],
    sort: { createdat: -1, },
    search: ['name', ],
    population: 'organization inputs.input_variable outputs.output_variable credentials.security_certificate',
  },
};
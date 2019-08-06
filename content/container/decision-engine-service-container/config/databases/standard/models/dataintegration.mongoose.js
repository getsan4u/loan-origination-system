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
  vm_parser: {
    type: ObjectId,
    ref: 'Parser',
  },
  xml_configs: Schema.Types.Mixed,
  xml_parser_configs: Schema.Types.Mixed,
  updatedat: {
    type: Date,
    default: Date.now,
  },
  description: String,
  ip_addresses: [String, ],
  require_security_cert: Boolean,
  required_credentials: [String, ],
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  credentials: {
    active: Schema.Types.Mixed,
    testing: Schema.Types.Mixed,
    security_certificate: {
      type: ObjectId,
      ref: 'Asset',
    },
  },
  request_option_configs: Schema.Types.Mixed,
  response_option_configs: Schema.Types.Mixed,
  request_type: String,
  stringify: Boolean,
  request_options: Schema.Types.Mixed,
  active_request_options: Schema.Types.Mixed,
  default_configuration: Schema.Types.Mixed,
  active_default_configuration: Schema.Types.Mixed,
  custom_inputs: [{
    data_type: String,
    name: String,
    format: String,
    function: String,
  }],
  inputs: [{
    _id: false,
    display_name: String,
    input_name: String,
    description: String,
    input_type: String,
    data_type: String,
    format: String,
    style: String,
    traversal_path: String,
    example: String,
    input_variable: {
      type: ObjectId,
      ref: 'Variable',
    },
    input_value: Schema.Types.Mixed,
  },
  ],
  outputs: [{
    _id: false,
    vm_parser: {
      default: false,
      type: Boolean,
    },
    api_name: String,
    description: String,
    data_type: String,
    display_name: String,
    example: String,
    traversalPath: String,
    arrayConfigs: Schema.Types.Mixed,
    output_variable: {
      type: ObjectId,
      ref: 'Variable',
    },
  },
  ]
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
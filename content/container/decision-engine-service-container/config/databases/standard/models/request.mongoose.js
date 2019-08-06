'use strict';
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-auto-increment');

mongoose.connections.forEach(con => AutoIncrement.initialize(con));

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const scheme = {
  id: ObjectId,
  request_date: {
    type: Date,
    default: Date.now,
  },
  response_date: {
    type: Date,
    default: null,
  },
  client_id: String,
  request_id: Number,
  client_transaction_id: String,
  strategy_name: String,
  strategy_status: String,
  strategy_version: Number,
  status_code: Number,
  status_message: String,
  error: [String],
  type: String,
  overall_count: Number,
  requirements_rule_count: Number,
  scoring_model_count: Number,
  rule_based_output_count: Number,
  simple_output_count: Number,
  calculation_scripts_count: Number,
  data_integration_count: Number,
  email_count: Number,
  text_message_count: Number,
  ai_model_count: Number,
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
    docid: ['_id',],
    sort: { createdat: -1, },
    search: ['_id',],
    plugins: [{
      func: AutoIncrement.plugin,
      options: { model: 'Requests', field: 'request_id', startAt: 10000, incrementBy: 1, },
    },],
  },
};
'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  id: ObjectId,
  createdat: {
    type: Date,
    default: Date.now,
  },
  updatedat: {
    type: Date,
    default: Date.now,
  },
  case_type: {
    type: String,
    default: 'Web',
  },
  case_name: {
    type: String,
    required: true,
  },
  processing_type: {
    index: true,
    type: String,
    enum: ['individual', 'batch'],
  },
  decline_reasons: [String],
  error: [ String ],
  strategy_display_name: String,
  inputs: Schema.Types.Mixed,
  outputs: Schema.Types.Mixed,
  module_order: Schema.Types.Mixed,
  compiled_order: Schema.Types.Mixed,
  passed: {
    type: Boolean,
    default: false,
  },
  application: {
    index: true,
    type: ObjectId,
    ref: 'Losapplication',
    default: null,
  },
  strategy: {
    index: true,
    type: ObjectId,
    ref: 'Strategy',
  },
  files: [{
    type: ObjectId,
    ref: 'File',
  }, ],
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  user: Schema.Types.Mixed,
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: ['_id',],
    sort: { createdat: -1, },
    search: ['case_name', ],
    population: 'strategy files organization',
  },
};
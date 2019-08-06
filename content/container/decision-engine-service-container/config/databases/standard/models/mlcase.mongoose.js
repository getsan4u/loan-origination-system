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
  decision_name: {
    type: String,
    index: true,
    required: true,
  },
  model_name: {
    type: String,
    required: true,
  },
  case_number: Number,
  model_type: {
    type: String,
    required: true,
  },
  mlmodel: String,
  industry: String,
  processing_type: {
    type: String,
    enum: ['individual', 'batch'],
  },
  application: {
    index: true,
    type: ObjectId,
    ref: 'Losapplication',
    default: null,
  },
  decoder: Schema.Types.Mixed,
  provider: String,
  error: [String],
  inputs: Schema.Types.Mixed,
  original_prediction: Number,
  prediction: Schema.Types.Mixed,
  digifi_score: Number,
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  averages: Schema.Types.Mixed,
  explainability_results: Schema.Types.Mixed,
  user: {
    type: ObjectId,
    ref: 'User',
  },
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: ['_id',],
    sort: { createdat: -1, },
    search: ['case_name', ],
    population: 'organization user',
  },
};
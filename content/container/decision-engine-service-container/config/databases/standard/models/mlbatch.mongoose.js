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
  model_name: String,
  results: [{
    model_type: String,
    industry: String,
    prediction: Schema.Types.Mixed,
    decision_name: String,
    provider: String,
    mlcase: {
      type: ObjectId,
      ref: 'Mlcase',
    },
    decoder: Schema.Types.Mixed,
  },],
  mlsimulation: {
    type: ObjectId,
    ref: 'Mlsimulation',
  },
  user: {
    type: ObjectId,
    ref: 'User',
  },
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
    docid: ['_id', 'name', ],
    sort: { createdat: -1, },
    search: ['name',],
    population: 'results.mlcase',
  },
};
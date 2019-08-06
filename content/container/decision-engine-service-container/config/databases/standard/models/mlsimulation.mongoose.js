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
  createdat: {
    type: Date,
    default: Date.now,
  },
  simulation_count: Number,
  model_name: String,
  industry: String,
  updatedat: {
    type: Date,
    default: Date.now,
  },
  status: String,
  message: String,
  provider: String,
  progress: Number,
  user: {
    type: ObjectId,
    ref: 'User',
  },
  results: [{
    type: ObjectId,
    ref: 'Mlbatch',
  }],
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
    search: [ 'name', ],
    population: 'results organization user',
  },
};
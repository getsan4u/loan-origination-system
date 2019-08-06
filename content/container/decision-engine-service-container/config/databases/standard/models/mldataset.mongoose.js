'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  id: ObjectId,
  mlmodel: {
    index: true,
    type: ObjectId,
    ref: 'Mlmodel'
  },
  headers: [String],
  testing: Schema.Types.Mixed,
  training: Schema.Types.Mixed,
  historical_result_encoder: Schema.Types.Mixed,
  historical_result_decoder: Schema.Types.Mixed,
  filename: String,
  createdat: {
    type: Date,
    default: Date.now,
  },
  updatedat: {
    type: Date,
    default: Date.now,
  },
  organization: {
    type: ObjectId,
    ref: 'Organization',
    index: true,
  },
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: ['_id', 'mlmodel' ],
    sort: { createdat: -1, },
    search: [],
    population: 'organization user mlmodel',
  },
};
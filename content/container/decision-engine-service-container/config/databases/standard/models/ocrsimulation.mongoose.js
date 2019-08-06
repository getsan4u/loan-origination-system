'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  id: ObjectId,
  simulation_number: Number,
  name: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
  createdat: {
    type: Date,
    default: Date.now,
  },
  updatedat: {
    type: Date,
    default: Date.now,
  },
  template_name: String,
  status: String,
  progress: Number,
  user: Schema.Types.Mixed,
  template: {
    type: ObjectId,
    ref: 'Ocrdocument',
  },
  results: [{
    type: ObjectId,
    ref: 'Ocrcase',
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
    population: 'results template',
  },
};
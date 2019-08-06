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
  results: [{
    overall_result: String,
    case_name: String,
    case: {
      type: ObjectId,
      ref: 'Case',
    },
  },],
  simulation: {
    index: true,
    type: ObjectId,
    ref: 'Simulation',
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
    population: 'results.case',
  },
};
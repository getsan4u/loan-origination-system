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
  results: [ {
    type: ObjectId,
    ref: 'Ocrcase',
  }, ],
  ocrsimulation: {
    type: ObjectId,
    ref: 'Ocrsimulation',
  },
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: [ '_id', 'name', ],
    sort: { createdat: -1, },
    search: [ 'name', ],
    population: 'results ocrsimulation',
  },
};
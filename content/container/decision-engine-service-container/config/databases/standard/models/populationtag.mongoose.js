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
    index: true,
    default: Date.now,
  },
  updatedat: {
    type: Date,
    index: true,
    default: Date.now,
  },
  user: String,
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  testcases: [{
    type: ObjectId,
    ref: 'Testcase',
  }],
  max_index: Number,
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: ['_id', 'name',],
    sort: { createdat: -1, },
    search: ['name', ],
  },
};
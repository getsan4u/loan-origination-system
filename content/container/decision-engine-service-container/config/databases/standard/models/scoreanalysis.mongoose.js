'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  id: ObjectId,
  type: String,
  name: String,
  comparison_score_inverse: Boolean,
  mlmodel: {
    type: ObjectId,
    ref: 'Mlmodel',
    index: true,
  },
  provider: {
    type: String,
    index: true,
  },
  industry: String,
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
  results: Schema.Types.Mixed
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: ['_id', ],
    sort: { createdat: -1, },
    search: [ ],
    population: 'organization user',
  },
};
'use strict';
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  id: ObjectId,
  name: String,
  case_number: Number,
  filename: String,
  template: {
    type: ObjectId,
    ref: 'Ocrdocument',
  },
  template_name: String,
  processing_type: {
    type: String,
    enum: [ 'individual', 'batch' ],
  },
  results: Schema.Types.Mixed,
  error: [ String ],
  createdat: {
    type: Date,
    default: Date.now,
  },
  updatedat: {
    type: Date,
    default: Date.now,
  },
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
    docid: [ '_id', ],
    sort: { createdat: -1, },
    search: [ 'case_name', ],
    population: 'organization template',
  },
};
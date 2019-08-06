'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  id: ObjectId,
  name: String,
  api_name: {
    type: String,
    index: true,
    required: true,
  },
  description: String,
  entitytype: {
    type: String,
    'default': 'file',
  },
  fields: [ Schema.Types.Mixed, ],
  status: String,
  user: Schema.Types.Mixed,
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  files: [ String, ],
  createdat: {
    type: Date,
    'default': Date.now,
  },
  updatedat: {
    type: Date,
    'default': Date.now,
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
    population: 'organization file',
  },
};
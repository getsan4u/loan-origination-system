'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  id: ObjectId,
  name: String,
  description: String,
  entitytype: {
    type: String,
    'default': 'file',
  },
  inputs: Schema.Types.Mixed,
  status: String,
  filename: String,
  user: {
    type: ObjectId,
    ref: 'User',
  },
  organization: {
    type: ObjectId,
    ref: 'Organization',
  },
  file: {
    type: ObjectId,
    ref: 'File'
  },
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
    docid: ['_id', 'name', ],
    sort: { createdat: -1, },
    search: ['name',],
    population: 'organization user file',
  },
};
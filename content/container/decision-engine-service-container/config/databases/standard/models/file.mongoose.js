'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  id: ObjectId,
  name: String,
  filetype: String,
  fileurl: String,
  createdat: {
    type: Date,
    'default': Date.now,
  },
  updatedat: {
    type: Date,
    'default': Date.now,
  },
  user: {
    type: ObjectId,
    ref: 'User',
  },
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  entitytype: {
    type: String,
    'default': 'file',
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
    population: 'organization user',
    uniqueCompound: { fileurl: 1, organization: 1, },
  },
};
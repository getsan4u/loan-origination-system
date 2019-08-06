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
  type: String,
  display_name: String,
  mlmodel: {
    type: ObjectId,
    ref: 'Mlmodel'
  },
  provider: {
    type: String,
    index: true,
  },
  predictions: [Schema.Types.Mixed],
  datasource_filename: String,
  original_datasource_filename: String,
  batch_output_uri: String,
  Key: String,
  Bucket: String,
  createdat: {
    type: Date,
    default: Date.now,
  },
  updatedat: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: ObjectId,
    ref: 'User',
  },
  organization: {
    type: ObjectId,
    ref: 'Organization',
    index: true,
  },
  status: {
    type: String,
    index: true,
  },
  results: Schema.Types.Mixed
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: ['_id', 'name', ],
    sort: { createdat: -1, },
    search: ['name', ],
    population: 'organization user mlmodel',
  },
};
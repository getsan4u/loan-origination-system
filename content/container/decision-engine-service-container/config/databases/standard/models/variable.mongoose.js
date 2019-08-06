'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  name: {
    type: String,
    index: true,
    required: true,
  },
  display_name: String,
  display_title: String,
  title: {
    type: String,
    index: true,
    required: true,
  },
  value: Schema.Types.Mixed,
  version: {
    type: Number,
    default: 1,
  },
  data_type: {
    type: String,
    required: true,
  },
  latest_version: Boolean,
  type: {
    type: String,
    required: true,
  },
  description: String,
  strategies: [{
    type: ObjectId,
    ref: 'Strategy',
  },],
  user: Schema.Types.Mixed,
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  }
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: ['_id', 'name',],
    sort: { createdat: -1, },
    search: ['name',],
    population: 'change',
    uniqueCompound: { name: 1, organization: 1, },
  },
};
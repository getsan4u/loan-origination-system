'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  active: {
    type: Boolean,
    required: true,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  name: {
    type: String,
    required: true,
    index: true
  },
  cron_interval: {
    type: String,
    default: ''
  },
  interval_description: {
    type: String,
    default: '',
  },
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  asset: {
    index: true,
    type: ObjectId,
    ref: 'Asset',
  },
  createdat: {
    type: Date,
    default: Date.now,
  },
  lastran: {
    type: Date,
  },
  updatedat: {
    type: Date,
    default: Date.now,
  },
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: ['_id', 'name',],
    sort: { createdat: -1, },
    search: [ 'name', ],
    population: 'organization asset',
    uniqueCompound: { name: 1, organization: 1, },
  },
};
'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const Segment = new Schema({
  name: {
    type: String,
    index: true,
    required: true,
  },
  title: {
    type: String,
    index: true,
  },
  type: {
    type: String,
    required: true,
  },
  description: String,
  locked: {
    default: false,
    type: Boolean,
  },
  conditions: [{
    type: ObjectId,
    ref: 'Rule',
  }, ],
  ruleset: [{
    type: ObjectId,
    ref: 'Rule',
  }, ],
  strict_skip: {
    type: Boolean,
    default: false,
  },
});

const segments = [Segment, ];

const scheme = {
  name: {
    type: String,
    index: true,
    required: true,
  },
  status: {
    type: String,
    index: true,
    default: null,
  },
  display_name: String,
  display_title: String,
  title: {
    type: String,
    index: true,
    required: true,
  },
  modules: Schema.Types.Mixed,
  description: String,
  latest_version: Boolean,
  locked: Boolean,
  version: {
    type: Number,
    index: true,
    default: 1,
  },
  change: {
    type: ObjectId,
    ref: 'Change',
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
  module_run_order: {
    type: [Schema.Types.Mixed, ],
    default: [],
  },
  user: Schema.Types.Mixed,
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: ['_id', 'name', ],
    sort: { createdat: -1, },
    search: ['title', 'name', ],
    population: 'change',
    uniqueCompound: { name: 1, organization: 1, },
  },
};

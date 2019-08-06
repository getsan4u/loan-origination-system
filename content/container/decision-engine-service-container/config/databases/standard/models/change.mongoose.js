'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  name: String,
  entity: {
    index: true,
    type: String,
  },
  entity_id: {
    index: true,
    type: ObjectId,
  },
  entity_display_title: String,
  entity_display_name: String,
  change_type: String,
  entity_title: String,
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
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  description: String,
  version: Number,
  comments: String,
  user: Schema.Types.Mixed,
  before: Schema.Types.Mixed,
  after: Schema.Types.Mixed,
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
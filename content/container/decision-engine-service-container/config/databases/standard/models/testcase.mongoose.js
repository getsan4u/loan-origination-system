'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  id: ObjectId,
  name: {
    type: String,
    index: true,
  },
  displayname: {
    type: String,
    index: true,
    required: true,
  },
  value: Schema.Types.Mixed,
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
  population_tags: [{
    type: ObjectId,
    ref: 'Populationtag',
  },
  ],
  indices: Schema.Types.Mixed,
  description: String,
  user: Schema.Types.Mixed,
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
};

module.exports = {
  scheme,
  options: {
    autoIndex: true,
  },
  coreDataOptions: {
    track_changes: false,
    docid: ['_id', 'name', 'displayname',],
    sort: { createdat: -1, },
    search: ['name', 'displayname',],
    population: 'population_tags',
    uniqueCompound: { name: 1, organization: 1, },
  },
};
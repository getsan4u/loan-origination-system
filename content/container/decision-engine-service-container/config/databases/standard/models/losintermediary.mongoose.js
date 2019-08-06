'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  id: ObjectId,
  name: {
    index: true,
    type: String,
    required: true,
  },
  type: {
    type: String,
    index: true,
  },
  website: {
    type: String,
  },
  address: {
    type: String,
  },
  ein: {
    type: String,
  },
  description: {
    type: String,
  },
  primary_contact: {
    type: ObjectId,
    ref: 'Losperson',
    index: true,
  },
  key_information: Schema.Types.Mixed,
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  user: {
    creator: String,
    updater: String,
  },
  createdat: {
    type: Date,
    default: Date.now,
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
    docid: [ '_id', ],
    sort: { createdat: -1, },
    search: [ 'name', ],
    population: '',
    // uniqueCompound: { name: 1, organization: 1, },
  },
};
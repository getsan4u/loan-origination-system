'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  id: ObjectId,
  createdat: {
    type: Date,
    default: Date.now,
  },
  updatedat: {
    type: Date,
    default: Date.now,
  },
  subject: {
    type: String,
  },
  date: {
    type: Date,
  },
  type: String,
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  people: [ {
    type: ObjectId,
    ref: 'Losperson',
  }, ],
  team_members: [ {
    type: ObjectId,
    ref: 'User',
  }, ],
  description: String,
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
  },
};
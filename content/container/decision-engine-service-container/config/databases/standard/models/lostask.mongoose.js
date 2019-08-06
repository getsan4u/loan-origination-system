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
  due_date: {
    type: Date,
    default: Date.now,
  },
  done: Boolean,
  description: String,
  team_members: [ {
    type: ObjectId,
    ref: 'User',
  } ],
  company: {
    index: true,
    type: ObjectId,
    ref: 'Loscompany',
  },
  people: [ {
    index: true,
    type: ObjectId,
    ref: 'Losperson',
  }, ],
  application: {
    index: true,
    type: ObjectId,
    ref: 'Losapplication',
  },
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
    docid: [ '_id', ],
    sort: { createdat: -1, },
    search: [ 'name' ],
    population: '',
  },
};
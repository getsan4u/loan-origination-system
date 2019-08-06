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
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  application: {
    index: true,
    type: ObjectId,
    ref: 'Losapplication',
  },
  company: {
    index: true,
    type: ObjectId,
    ref: 'Loscompany',
  },
  person: {
    index: true,
    type: ObjectId,
    ref: 'Losperson',
  },
  content: String,
  author: {
    index: true,
    type: ObjectId,
    ref: 'User',
  },
  user: {
    creator: String,
    updater: String,
  },
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: [ '_id', ],
    sort: { createdat: -1, },
    search: [],
    population: '',
  },
};
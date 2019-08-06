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
  name: {
    index: true,
    type: String,
    required: true,
  },
  job_title: String,
  phone: String,
  email: String,
  address: String,
  dob: Date,
  ssn: String,
  key_information: Schema.Types.Mixed,
  company: {
    index: true,
    type: ObjectId,
    ref: 'Loscompany',
  },
  intermediary: {
    index: true,
    type: ObjectId,
    ref: 'Losintermediary',
  },
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
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
    search: [ 'name', ],
    population: '',
  },
};
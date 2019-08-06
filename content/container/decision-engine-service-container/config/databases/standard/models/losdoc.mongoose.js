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
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  file_extension: {
    default: null,
    type: String,
  },
  doc_type: {
    index: true,
    type: String,
  },
  type: {
    index: true,
    type: String,
  },
  description: String,
  fileurl: {
    default: null,
    type: String,
  },
  filesize: {
    type: Number,
  },
  user: {
    creator: String,
    updater: String,
  },
  application: {
    index: true,
    type: ObjectId,
    ref: 'Losapplication',
  },
  person: {
    index: true,
    type: ObjectId,
    ref: 'Losperson',
  },
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
  parent_directory: {
    index: true,
    type: ObjectId,
    ref: 'Losdoc',
    default: null,
  }
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
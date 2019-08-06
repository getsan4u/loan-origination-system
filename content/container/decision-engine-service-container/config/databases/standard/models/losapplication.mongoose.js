'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  id: ObjectId,
  title: {
    index: true,
    type: String,
  },
  createdat: {
    type: Date,
    default: Date.now,
  },
  updatedat: {
    type: Date,
    default: Date.now,
  },
  status: {
    index: true,
    type: ObjectId,
    ref: 'Losstatus',
    required: true,
  },
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  team_members: [ {
    index: true,
    type: ObjectId,
    ref: 'User',
  } ],
  estimated_close_date: {
    index: true,
    type: Date,
  },
  user: {
    creator: String,
    updater: String,
  },
  product: {
    type: ObjectId,
    ref: 'Losproduct',
    required: true,
  },
  loan_amount: Number,
  customer_type: {
    type: String,
    index: true,
  },
  customer_id: {
    type: String,
    index: true,
  },
  coapplicant_customer_type: {
    type: String,
  },
  coapplicant_customer_id: {
    type: String,
    index: true,
  },
  intermediary: {
    type: String,
    index: true,
  },
  decision_date: {
    index: true,
    type: Date,
  },
  reason: String,
  comments: String,
  labels: [ {
    index: true,
    type: ObjectId,
    ref: 'Losapplicationlabel',
  }],
  docs: Schema.Types.Mixed,
  key_information: Schema.Types.Mixed,
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: [ '_id', ],
    sort: { createdat: -1, estimated_close_date: -1, status: -1, },
    search: [ 'status', ],
    population: '',
  },
};
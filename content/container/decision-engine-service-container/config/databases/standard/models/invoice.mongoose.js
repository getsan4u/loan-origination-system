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
  number: {
    type: Number,
    default: null
  },
  tax_owed: {
    type: Number,
    default: null,
  },
  total_payment: {
    type: Number,
    default: null,
  },
  fees: {
    taxable: {
      type: Number,
      default: null,
    },
    non_taxable: {
      type: Number,
      default: null,
    }
  },
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  transactions: [ {
    type: ObjectId,
    ref: 'Transaction'
  }]
};


module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: ['_id', ],
    sort: { createdat: -1, },
    search: ['_id', ],
  },
};
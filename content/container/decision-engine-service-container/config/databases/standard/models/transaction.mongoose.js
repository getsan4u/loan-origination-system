'use strict';
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-auto-increment');

mongoose.connections.forEach(con => AutoIncrement.initialize(con));

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const scheme = {
  id: ObjectId,
  item: {
    type: String,
    default: null,
  },
  createdat: {
    type: Date,
    default: Date.now,
  },
  taxable: {
    type: Boolean,
    default: true,
  },
  transaction_id: Number,
  amount: {
    type: Number,
    default: 0,
  },
  strategy_count: {
    type: Number,
    default: 0,
  },
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  invoiced: {
    type: Boolean,
    default: false,
  }
};


module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: ['_id', ],
    sort: { createdat: -1, },
    search: ['_id', ],
    plugins: [{
      func: AutoIncrement.plugin,
      options: { model: 'Requests', field: 'transaction_id', startAt: 0, incrementBy: 1, },
    }, ],
  },
};
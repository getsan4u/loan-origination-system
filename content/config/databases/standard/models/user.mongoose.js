'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const scheme = {
  id: ObjectId,
  entitytype: String,
  email: {
    type: String,
  },
  password: String,
  first_name: String,
  last_name: String,
  phone: String,
  time_zone: {
    type: String,
    default: 'Etc/GMT+5'
  },
  status: {
    email_verified: {
      type: Boolean,
      default: false,
    },
    email_verified_time: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: false,
    },
    mfa: {
      type: Boolean,
      default: false,
    },
    unsubscribed: {
      type: Boolean,
      default: false
    }
  },
  primaryasset: {
    type: ObjectId,
    ref: 'Asset',
  },
  association: {
    organization: {
      type: ObjectId,
      ref: 'Organization',
    },
  },
  userroles: [{
    type: ObjectId,
    ref: 'Userrole',
  },
  ],
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    docid:['_id', 'name',],
    sort: { createdat: -1, },
    track_changes: false,
    search: ['first_name', 'last_name', 'email', ],
    population: 'association.organization primaryasset userroles',
    uniqueCompound: { email: 1, organization: 1, },
  },
};
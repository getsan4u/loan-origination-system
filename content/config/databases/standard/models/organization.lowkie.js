'use strict';

const lowkie = require('lowkie');
const Schema = lowkie.Schema;
const ObjectId = Schema.ObjectId;
const scheme = {
  id: ObjectId,
  name: {
    type: String,
    unique: true,
  },
  entitytype: {
    type: String,
    default: 'organization',
  },
  esign: {
    platform_terms_and_conditions: {
      consent: Boolean,
      version: String,
      date: Date,
      ip_address: String,
      user_agent: String,
      user: {
        type: ObjectId,
        ref: 'User',
      },
    },
    website_terms_of_service: {
      consent: Boolean,
      version: String,
      date: Date,
      ip_address: String,
      user_agent: String,
      user: {
        type: ObjectId,
        ref: 'User',
      },
    },
    privacy_policy: {
      consent: Boolean,
      version: String,
      date: Date,
      ip_address: String,
      user_agent: String,
      user: {
        type: ObjectId,
        ref: 'User',
      },
    },
  },
  // account: {
  //   account_type: String,
  //   users: Number,
  //   expiration_date: Date,
  // },
  save_data: { // determines if data is saved
    type: Boolean,
    default: false,
  },
  data_retention: { // if data is saved, determines how long it is saved for
    type: Number,
    default: 7,
  },
  status: {
    active: {
      type: Boolean,
      default: false,
    },
  },
  association: {
    users: [{
      type: ObjectId,
      ref: 'User',
    },
    ],  
    client: {
      type: ObjectId,
      ref: 'Client',
    },
  },
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    docid: '_id',
    sort: { createdat: -1, },
    search: ['name', 'account_type', 'status', 'entitytype', ],
    population: 'association.users association.client esign.platform_terms_and_conditions.user esign.website_terms_of_service.user esign.privacy_policy.user',
  }
};
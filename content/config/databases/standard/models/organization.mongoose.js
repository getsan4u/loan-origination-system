'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
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
  stripe: {
    customer: String,
  },
  products: {
    text_recognition: {
      active: {
        type: Boolean,
        default: false,
      },
      pricing: {
        processing_individual: {
          type: Number,
          default: 0.00,
        },
        processing_batch: {
          type: Number,
          default: 0.00,
        },
        api_individual: {
          type: Number,
          default: 0.00,
        },
        api_batch: {
          type: Number,
          default: 0.00,
        },
      },
    },
    machine_learning: {
      active: {
        type: Boolean,
        default: false,
      },
      pricing: {
        processing_individual: {
          type: Number,
          default: 0.00,
        },
        processing_batch: {
          type: Number,
          default: 0.00,
        },
        api_individual: {
          type: Number,
          default: 0.00,
        },
        api_batch: {
          type: Number,
          default: 0.00,
        },
      },
    },
    rules_engine: {
      active: {
        type: Boolean,
        default: false,
      },
      pricing: {
        processing_individual: {
          type: Number,
          default: 0.00,
        },
        processing_batch: {
          type: Number,
          default: 0.00,
        },
        api_individual: {
          type: Number,
          default: 0.00,
        },
        api_batch: {
          type: Number,
          default: 0.00,
        },
      },
    },
    loan_acquisition: {
      active: {
        type: Boolean,
        default: false,
      },
      pricing: {
        processing_individual: {
          type: Number,
          default: 0.00,
        },
        processing_batch: {
          type: Number,
          default: 0.00,
        },
        api_individual: {
          type: Number,
          default: 0.00,
        },
        api_batch: {
          type: Number,
          default: 0.00,
        },
      },
    },
  },
  address: {
    street: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    state: {
      type: String,
      default: null,
    },
    postal_code: {
      type: String,
      default: null,
    },
  },
  billing: {
    balance: {
      type: Number,
      default: null,
    },
    max_balance: {
      type: Number,
      default: 0,
    },
    transaction_count: {
      type: Number,
      default: 0
    },
    max_transactions: {
      type: Number,
      default: 999999999,
    },
    max_api_batch: {
      type: Number,
      default: 250,
    },
    payment_increment: {
      type: Number,
      default: 500.0,
    },
    pricing_per_month: {
      type: Number,
      default: 0,
    },
    payment_type: {
      type: String,
      default: 'auto',
    },
  },
  status: {
    active: {
      type: Boolean,
      default: false,
    },
  },
  los: {
    statuses: [{
      type: ObjectId,
      ref: 'Losstatus',
    }]
  },
  save_data: { // determines if data is saved
    type: Boolean,
    default: true,
  },
  data_retention: { // if data is saved, determines how long it is saved for
    type: Number,
    default: 30,
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
    track_changes: false,
    search: ['name', 'account_type', 'status', 'entitytype',],
    population: 'association.users association.client esign.platform_terms_and_conditions.user esign.website_terms_of_service.user esign.privacy_policy.user',
  },
};
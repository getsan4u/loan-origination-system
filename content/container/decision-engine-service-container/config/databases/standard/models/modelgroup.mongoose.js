'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const scheme = {
  id: ObjectId,
  name: {
    type: String,
    index: true,
    required: true,
  },
  observation_count: Number,
  predictor_variable_count: Number,
  selected_provider: String, //provider name
  description: String,
  type: String,
  display_name: String,
  datasource: {
    type: ObjectId,
    ref: 'Datasource'
  },
  status: String,
  training_data_source_id: String,
  testing_data_source_id: String,
  aws: {
    status: String,
    progress: Number,
    real_time_prediction_id: String,
    real_time_endpoint: String,
    real_time_endpoint_status: String,
    batch_training_status: String,
    batch_testing_status: String,
    evaluation_status: String,
    evaluation_id: String,
    r_squared: Number,
    performance_metrics: Schema.Types.Mixed,
    batch_training_id: {
      type: ObjectId,
      ref: 'Batchprediction'
    },
    batch_testing_id: {
      type: ObjectId,
      ref: 'Batchprediction'
    },
  },
  // ibm: {
  //   real_time_prediction_id: String,
  //   real_time_endpoint: String,
  //   r_squared: Number,
  //   performance_metrics: Schema.Types.Mixed,
  //   training_batch: {
  //     type: ObjectId,
  //     ref: 'BatchPrediction',
  //   },
  //   testing_batch: {
  //     type: ObjectId,
  //     ref: 'BatchPrediction',
  //   },
  // },
  // microsoft: {
  //   real_time_prediction_id: String,
  //   real_time_endpoint: String,
  //   r_squared: Number,
  //   performance_metrics: Schema.Types.Mixed,
  //   training_batch: {
  //     type: ObjectId,
  //     ref: 'BatchPrediction',
  //   },
  //   testing_batch: {
  //     type: ObjectId,
  //     ref: 'BatchPrediction',
  //   },
  // },
  createdat: {
    type: Date,
    default: Date.now,
  },
  updatedat: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: ObjectId,
    ref: 'User',
  },
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  variables: Schema.Types.Mixed,
  strategies: [{
    type: ObjectId,
    ref: 'Strategy',
  }]
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: ['_id', 'name',],
    sort: { createdat: -1, },
    search: ['name',],
    population: 'organization user batch_training_id batch_testing_id datasource',
  },
};
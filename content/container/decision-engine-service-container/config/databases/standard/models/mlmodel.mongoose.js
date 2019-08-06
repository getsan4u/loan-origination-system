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
  updating_provider: {
    type: Boolean,
    default: false,
  },
  description: String,
  type: String,
  industry: {
    type: String,
  },
  industry_headers: [String],
  industry_file: String,
  display_name: String,
  datasource: {
    type: ObjectId,
    ref: 'Datasource'
  },
  digifi_model_status: {
    type: String,
    index: true,
  },
  status: {
    type: String,
    index: true,
  },
  training_data_source_id: String,
  testing_data_source_id: String,
  aws_models: [String],
  digifi_models: [String],
  aws: {
    status: String,
    progress: Number,
    real_time_prediction_id: String,
    real_time_endpoint: String,
    real_time_endpoint_status: String,
    batch_training_status: String,
    model_name: String,
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
  sagemaker_ll: {
    status: String,
    progress: Number,
    model_name: String,
    real_time_prediction_id: String,
    real_time_endpoint: String,
    real_time_endpoint_status: String,
    batch_training_status: String,
    batch_testing_status: String,
    evaluation_status: String,
    evaluation_id: String,
    r_squared: Number,
    error_message: String,
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
  sagemaker_xgb: {
    status: String,
    progress: Number,
    model_name: String,
    real_time_prediction_id: String,
    real_time_endpoint: String,
    real_time_endpoint_status: String,
    batch_training_status: String,
    batch_testing_status: String,
    evaluation_status: String,
    evaluation_id: String,
    r_squared: Number,
    error_message: String,
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
  bayes: {
    status: String,
    progress: Number,
    model: Schema.Types.Mixed,
    batch_training_id: {
      type: ObjectId,
      ref: 'Batchprediction'
    },
    batch_testing_id: {
      type: ObjectId,
      ref: 'Batchprediction'
    },
  },
  decision_tree: {
    status: String,
    progress: Number,
    model: Schema.Types.Mixed,
    batch_training_id: {
      type: ObjectId,
      ref: 'Batchprediction'
    },
    batch_testing_id: {
      type: ObjectId,
      ref: 'Batchprediction'
    },
  },
  random_forest: {
    status: String,
    progress: Number,
    model: Schema.Types.Mixed,
    batch_training_id: {
      type: ObjectId,
      ref: 'Batchprediction'
    },
    batch_testing_id: {
      type: ObjectId,
      ref: 'Batchprediction'
    },
  },
  neural_network: {
    status: String,
    progress: Number,
    model: Schema.Types.Mixed,
    column_scale: Schema.Types.Mixed,
    batch_training_id: {
      type: ObjectId,
      ref: 'Batchprediction'
    },
    batch_testing_id: {
      type: ObjectId,
      ref: 'Batchprediction'
    },
  },
  createdat: {
    type: Date,
    default: Date.now,
  },
  updatedat: {
    type: Date,
    default: Date.now,
  },
  user: {
    creator: String,
    updater: String,
  },
  organization: {
    index: true,
    type: ObjectId,
    ref: 'Organization',
  },
  variables: Schema.Types.Mixed,
  strategies: [ {
    type: ObjectId,
    ref: 'Strategy',
  } ]
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: [ '_id', 'name', ],
    sort: { createdat: -1, },
    search: [ 'name', ],
    population: 'organization aws.batch_training_id aws.batch_testing_id sagemaker_ll.batch_training_id sagemaker_ll.batch_testing_id decision_tree.batch_training_id decision_tree.batch_testing_id neural_network.batch_training_id neural_network.batch_testing_id random_forest.batch_training_id random_forest.batch_testing_id datasource sagemaker_xgb.batch_training_id sagemaker_xgb.batch_testing_id',
  },
};
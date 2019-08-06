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
  original_file: {
    name: String,
    training: {
      Key: String,
      Bucket: String,
      filename: String,
      fileurl: String,
    },
    testing: {
      Key: String,
      Bucket: String,
      filename: String,
      fileurl: String,
    },
  },
  statistics: Schema.Types.Mixed,
  observation_count: Number,
  predictor_variable_count: Number,
  display_name: String,
  data_schema: String,
  strategy_data_schema: String,
  training_data_source_id: String,
  testing_data_source_id: String,
  providers: Schema.Types.Mixed,
  column_unique_counts: Schema.Types.Mixed,
  encoders: Schema.Types.Mixed,
  decoders: Schema.Types.Mixed,
  included_columns:  String,
  encoder_counts: Schema.Types.Mixed,

  // training_data_asset: {
  //   type: ObjectId,
  //   ref: 'Mlasset'
  // },
  // testing_data_asset: {
  //   type: ObjectId,
  //   ref: 'Mlasset'
  // },
  transformations: Schema.Types.Mixed,
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
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    track_changes: false,
    docid: ['_id', 'name', ],
    sort: { createdat: -1, },
    search: ['name', ],
    population: 'organization user training_data_asset testing_data_asset',
  },
};
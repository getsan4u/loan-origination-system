'use strict';

const aws = require('./aws');
const sagemaker_ll = require('./sagemaker_ll');
const sagemaker_xgb = require('./sagemaker_xgb');

module.exports = {
  aws,
  sagemaker_ll,
  sagemaker_xgb,
};
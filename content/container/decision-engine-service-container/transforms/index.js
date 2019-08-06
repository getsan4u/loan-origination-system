'use strict';
const pre = require('./pretransform');
const post = require('./posttransform');
const decision = require('./decision');
const simulation = require('./simulation');
const optimization = require('./optimization');
const ocr = require('./ocr');
const ml = require('./ml');
const payment = require('./payment');

module.exports = {
  pre,
  post,
  decision,
  optimization,
  ocr,
  ml,
  payment,
  simulation,
};
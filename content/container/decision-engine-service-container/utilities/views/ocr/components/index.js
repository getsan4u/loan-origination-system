'use strict';
const ocrTabs = require('./ocrTabs');
const templateDetailForm = require('./templateDetailForm');
const ocrProcessingTabs = require('./ocrProcessingTabs');
const singleRunProcessForm = require('./singleRunProcessForm');
const singleProcessDetailForm = require('./singleProcessDetailForm');
const batchRunProcessForm = require('./batchRunProcessForm');
const batchProcessDetailForm = require('./batchProcessDetailForm');
const batchCaseEditForm = require('./batchCaseEditForm');

module.exports = {
  singleRunProcessForm,
  singleProcessDetailForm,
  batchRunProcessForm,
  batchProcessDetailForm,
  batchCaseEditForm,
  ocrTabs,
  ocrProcessingTabs,
  templateDetailForm,
};
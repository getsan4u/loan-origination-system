'use strict';

const detail = require('./detail');
const dependencies = require('./dependencies');
const overview = require('./overview');
const segments = require('./segments');
const update_history_detail = require('./update_history_detail');
const versions = require('./versions');

const COLLECTION_DETAIL_CONFIGS = {
  detail,
  dependencies,
  overview,
  segments,
  update_history_detail,
  versions,
}

module.exports = COLLECTION_DETAIL_CONFIGS;
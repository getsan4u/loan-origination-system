'use strict';

const capitalize = require('capitalize');
const CONSTANTS = require('../../../constants');
const findConfigArr = require('./findConfigArr');

const createConfigArr = CONSTANTS.TYPES.reduce((configuration, type) => {
  return configuration.concat({
    title: capitalize(type),
    type: type,
    category: null
  })
}, []);

const editConfigArr = CONSTANTS.TYPES.reduce((configuration, type) => {
  return CONSTANTS.COLLECTION_TABS[ type ] ? configuration.concat(
    CONSTANTS.COLLECTION_TABS[ type ].map(el => {
      return {
        title: el.label || capitalize(type),
        type: type,
        location: el.location,
        resources: el.resources,
      };
    })) : configuration;
  });

const updateDetailConfigArr = CONSTANTS.TYPES.reduce((configuration, type) => {
  return configuration.concat({
    title: capitalize(type),
    type: type,
  })
}, [])

const editModalConfigArr = CONSTANTS.SEGMENT_TYPES.map(segment_type => ({
  title: 'Edit Rule',
  type: 'ruleset',
  dependency: 'rule',
  category: segment_type,
  location: `/decision/rules/:id/edit`,
  resources: {},
}));

module.exports = {
  findArr: findConfigArr,
  createArr: createConfigArr,
  editArr: editConfigArr,
  updateHistoryDetailArr: updateDetailConfigArr,
  editModalArr: editModalConfigArr,
}
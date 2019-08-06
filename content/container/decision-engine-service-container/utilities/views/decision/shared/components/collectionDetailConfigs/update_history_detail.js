'use strict';

const moment = require('moment');
const styles = require('../../../../constants').styles;
const capitalize = require('capitalize');
const randomKey = Math.random;
const cardprops = require('../cardProps');
const formElements = require('../formElements');
const CONSTANTS = require('../../../constants');
const CATEGORIES = CONSTANTS.SEGMENT_TYPES;
const updateOverview = require('../updateOverview');
const updateHistoryDetailStrategyTable = require('../updateHistoryDetailStrategyTable');
const updateHistoryDoubleCard = require('../updateHistoryDoubleCard');
const variableLeftConfigs = [ {
  label: 'Data Type',
  name: 'before.data_type'
}, {
  label: 'Variable Type',
  name: 'before.type'
}, {
  label: 'Value',
  name: 'before.value',
  type: 'code',
}, ];

const variableRightConfigs = [ {
  label: 'Variable Name',
  name: 'after.data_type'
}, {
  label: 'Variable Type',
  name: 'after.type'
}, {
  label: 'Value',
  name: 'after.value',
  type: 'code',
}, ];
const variable = [
  updateOverview({ title: 'Variable' }),
  updateHistoryDoubleCard({ title: 'Variable', leftConfigs: variableLeftConfigs, rightConfigs: variableRightConfigs})
];

const strategy = [
  updateOverview({ title: 'Strategy' }),
  updateHistoryDetailStrategyTable({ title: 'Requirements', tablename: 'requirements',childName: 'Variable'}),
  updateHistoryDetailStrategyTable({ title: 'Scorecard', tablename: 'scorecard',childName: 'Variable'}),
  updateHistoryDetailStrategyTable({ title: 'Output', tablename: 'output',childName: 'Variable'}),
  updateHistoryDetailStrategyTable({ title: 'Limits', tablename: 'limits',childName: 'Variable'}),
]

const UPDATE_HISTORY_DETAIL_CONFIGS = {
  variable,
  rule: [],
  strategy,
};

module.exports = UPDATE_HISTORY_DETAIL_CONFIGS;
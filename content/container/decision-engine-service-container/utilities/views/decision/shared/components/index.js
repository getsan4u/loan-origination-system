'use strict';

const appGlobalTabs = require('./appGlobalTabs');
const cardProps = require('./cardProps');
const conditions = require('./conditions');
const findTable = require('./findTable');
const findTabs = require('./findTabs');
const collectionDetailConfigs = require('./collectionDetailConfigs');
const collectionDetailTabs = require('./collectionDetailTabs');
const collectionUpdateDetailTabs = require('./collectionUpdateDetailTabs');
const collectionFindTabs = require('./collectionFindTabs');
const decisionTabs = require('./decisionTabs');
const manifestConfigs = require('./manifestConfigs');
const formConfigs = require('./formConfigs');
const detailHeaderButtons = require('./detailHeaderButtons');
const formElements = require('./formElements');
const updateHistoryDoubleCard = require('./updateHistoryDoubleCard');
const updateOverview = require('./updateOverview');
const radioButtonGroup = require('./radioButtonGroup');
const strategyProcessingTabs = require('./strategyProcessingTabs');

module.exports = {
  appGlobalTabs,
  cardProps,
  conditions,
  findTable,
  findTabs,
  collectionDetailConfigs,
  collectionUpdateDetailTabs,
  collectionDetailTabs,
  collectionFindTabs,
  decisionTabs,
  manifestConfigs,
  formConfigs,
  formElements,
  updateHistoryDoubleCard,
  updateOverview,
  radioButtonGroup,
  strategyProcessingTabs,
};
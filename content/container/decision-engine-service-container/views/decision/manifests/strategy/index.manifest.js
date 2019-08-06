'use strict';
const utilities = require('../../../../utilities');
const generateManifests = utilities.views.decision.shared.manifests.find;

const settings = [ {
  collection: 'strategy',
  display_collection: 'Strategy',
  createModalUrl: '/decision/strategies/new',
  url: '/decision/strategies/all',
  privileges: [101, 102, 103,],
  tabname: 'all',
  cardTitle: 'Strategies',
} ]; 
// {
//   collection: 'strategy',
//   display_collection: 'Strategy',
//   createModalUrl: '/decision/strategies/new',
//   url: '/decision/strategies/active',
//   tabname: 'active',
//   cardTitle: 'Strategies',
// }, {
//   collection: 'strategy',
//   display_collection: 'Strategy',
//   createModalUrl: '/decision/strategies/new',
//   url: '/decision/strategies/testing',
//   tabname: 'testing',
//   cardTitle: 'Strategies',
// }];

module.exports = settings.map(generateManifests);


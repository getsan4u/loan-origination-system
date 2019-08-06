'use strict';

const utilities = require('../../../../utilities');
const generateManifests = utilities.views.decision.shared.manifests.find;

const settings = [ {
  collection: 'variable',
  display_collection: 'Variable',
  createModalUrl: '/decision/variables/new',
  url: '/decision/variables/all',
  tabname: 'variablesall',
  cardTitle: 'Variables'
},
// {
//   collection: 'variable',
//   display_collection: 'Variable',
//   createModalUrl: '/decision/variables/new',
//   url: '/decision/variables/input',
//   tabname: 'input',
//   cardTitle: 'Variables'
// },
// {
//   collection: 'variable',
//   display_collection: 'Variable',
//   createModalUrl: '/decision/variables/new',
//   url: '/decision/variables/output',
//   tabname: 'output',
//   cardTitle: 'Variables'
// }
];

module.exports = settings.map(generateManifests);


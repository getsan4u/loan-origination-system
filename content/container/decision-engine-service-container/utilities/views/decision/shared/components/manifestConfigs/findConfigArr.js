'use strict';
const pluralize = require('pluralize');
const capitalize = require('capitalize');
const CONSTANTS = require('../../../constants');
const FIND_TAB_CONFIGS = CONSTANTS.FIND_TAB_CONFIGS;
const findTabs = require('../findTabs');
const util = require('util');

function generateManifestOptions(collection) {
  let settings = FIND_TAB_CONFIGS[ collection ];
  if (!settings.innerTabs) {
    let collectionDetailTabs = settings.outerTabs.map(outer => {
      let { outerTabs } = findTabs({ tabnames: [ outer.name ], outerTabs: settings.outerTabs, collection, });
      return {
        collection,
        createModalUrl: `/decision/${pluralize(collection)}/new`,
        outerTabs,
        url: `/decision/${pluralize(collection)}/${outer.name}`,
        cardTitle: capitalize(pluralize(collection)),
      }
    });
    return collectionDetailTabs;
  } else {
    let outerTabMap = [];
    let innerTabMap = settings.outerTabs.reduce((tabs, outer) => {
      outer.url = `/${outer.name}/${settings.innerTabs[ 0 ].name}`;
      outerTabMap.push(outer);
      tabs[ outer.name ] = settings.innerTabs.map(inner => {
        return Object.assign({}, inner, {url: `/${outer.name}/${inner.name}`});
      });
      return tabs;
    }, {});
    let collectionDetailTabs = settings.outerTabs.reduce((tabs, outer) => {
      return tabs.concat(settings.innerTabs.map(inner => {
        let { innerTabs, outerTabs } = findTabs({ tabnames: [ outer.name, inner.name ], outerTabs: outerTabMap, innerTabs: innerTabMap[ outer.name ], collection });
        return {
          collection,
          createModalUrl: `/decision/${pluralize(collection)}/new`,
          outerTabs,
          innerTabs,
          url: `/decision/${pluralize(collection)}/${outer.name}/${inner.name}`,
          cardTitle:`${outer.title} ${capitalize(pluralize(collection))}`
        }
      }));
    }, []);
    return collectionDetailTabs;
  }
}

const findConfigArr = Object.keys(FIND_TAB_CONFIGS).reduce((optionsList, collection) => optionsList.concat(generateManifestOptions(collection)), []);

module.exports = findConfigArr;
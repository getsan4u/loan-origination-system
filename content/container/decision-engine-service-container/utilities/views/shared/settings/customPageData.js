'use strict';
const pluralize = require('pluralize');

const riskSubTabs = require('../../risk_management/components/risk_management_sub_tabs');
const riskTabs = require('../../risk_management/components/risk_management_tabs');
const datatab_list = require('../../developer/components/data_tabs');
const datatab_list_array = datatab_list.map(dtab => pluralize.singular(dtab.location));
const developerTabs = require('../../developer/components/developer_tabs');

const pagedata = {
  'title': 'DCP | Risk Management',
  'navLabel': 'Risk Management',
};
const pemEntities = ['calculation', 'creditengine', 'parser', 'resource', 'segment', 'issuer', 'product',];
const pagedataReduced = pemEntities.reduce((result, key) => {
  result[ key ] = pagedata;
  return result;
}, {});
const subTabsReduced = pemEntities.reduce((result, key) => {
  result[ key ] = {
    component:'Container',
    children: [ riskSubTabs(pluralize(key)), ],
  };
  return result;
}, {});
const headerTabsReduced = pemEntities.reduce((result, key) => {
  result[ key ] =riskTabs(`underwriting/${pluralize(key)}`);
  result[ key ].props.style = Object.assign({}, result[ key ].props.style, {
    paddingTop: 0,
    position: 'relative',
    top:'-10px',
  }); 
  return result;
}, {});
const DeveloperHeaderTabsReduced = datatab_list_array.reduce((result, key) => {
  result[ key ] = developerTabs('data');
  result[ key ].props.style = Object.assign({}, result[ key ].props.style, {
    paddingTop: 0,
    position: 'relative',
    top:'-10px',
  }); 
  return result;
}, {});
const pageIndexData = pagedataReduced;
const pageIndexTabs=subTabsReduced;
const pageIndexHeader= Object.assign({}, headerTabsReduced, DeveloperHeaderTabsReduced);
const pageDetailData = pagedataReduced;
const pageDetailTabs=subTabsReduced;
const pageDetailHeader = Object.assign({}, headerTabsReduced, DeveloperHeaderTabsReduced);
// console.log({ pageDetailHeader });

module.exports = {
  pageIndexData,
  pageIndexTabs,
  pageIndexHeader,
  pageDetailData,
  pageDetailTabs,
  pageDetailHeader,
};
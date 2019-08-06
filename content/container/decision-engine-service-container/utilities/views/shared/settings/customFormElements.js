'use strict';
// const pluralize = require('pluralize');
// const capitalize = require('capitalize');
// const cardprops = require('../props/cardprops');
const sharedComponents = require('./sharedComponents');
const getCalculationDatalist = sharedComponents.getCalculationDatalist;
const getDatalist = sharedComponents.getDatalist;
// const getCardFormgroup = sharedComponents.getCardFormgroup;


module.exports = {
  segment: {
    'system_of_record_associated_data related_segment': getDatalist({
      multi: false,
      fieldname: 'related_segment',
      fieldnamepreview:'segments',
      entity:'segment',
      resourceurl:'segments',
    }),
  },
  credit_engine: {
    'system_of_record_associated_data parser': getDatalist({
      multi: false,
      fieldname: 'parser',
      fieldnamepreview:'parsers',
      entity:'parser',
    }),
    'system_of_record_associated_data issuer': getDatalist({
      multi: false,
      fieldname: 'issuer',
      fieldnamepreview:'issuers',
      entity:'issuer',
    }),
    'system_of_record_associated_data product': getDatalist({
      multi: false,
      fieldname: 'product',
      fieldnamepreview:'products',
      entity:'product',
    }),
    'system_of_record_associated_data resources':getDatalist({
      multi: true,
      fieldname: 'resources',
      fieldnamepreview:'resources',
      entity:'resource',
    }),
    'system_of_record_associated_data limits_calculation': getCalculationDatalist(
      {
        multi: false,
        enginetype:'limits',
      }
    ),
    'system_of_record_associated_data mcr_calculation': getCalculationDatalist(
      {
        multi: false,
        enginetype:'mcr',
      }
    ),
    'system_of_record_associated_data scorecard_calculation': getCalculationDatalist(
      {
        multi: false,
        enginetype:'scorecard',
      }
    ),
    'system_of_record_associated_data adverse_calculation': getCalculationDatalist(
      {
        multi: false,
        enginetype:'adverse',
      }
    ),
    'system_of_record_associated_data output_calculation': getCalculationDatalist(
      {
        multi: false,
        enginetype:'output',
      }
    ),
    'system_of_record_associated_data output_segments': getDatalist({
      multi: true,
      fieldname: 'output_segments',
      fieldnamepreview:'segments',
      entity:'segment',
      resourceurl:'segments',
    }),
    'system_of_record_associated_data scorecard_segments': getDatalist({
      multi: true,
      fieldname: 'scorecard_segments',
      fieldnamepreview:'segments',
      entity:'segment',
      resourceurl:'segments',
    }),
    'system_of_record_associated_data mcr_segments': getDatalist({
      multi: true,
      fieldname: 'mcr_segments',
      fieldnamepreview:'segments',
      entity:'segment',
      resourceurl:'segments',
    }),
    'system_of_record_associated_data adverse_segments': getDatalist({
      multi: true,
      fieldname: 'adverse_segments',
      fieldnamepreview:'segments',
      entity:'segment',
      resourceurl:'segments',
    }),
    'system_of_record_associated_data limits_segments': getDatalist({
      multi: true,
      fieldname: 'limits_segments',
      fieldnamepreview:'segments',
      entity:'segment',
      resourceurl:'segments',
    }),

  },
  engine: {
    'system_of_record_associated_data parser': getDatalist({
      multi: false,
      fieldname: 'parser',
      fieldnamepreview:'parsers',
      entity:'parser',
    }),
    'system_of_record_associated_data issuer': getDatalist({
      multi: false,
      fieldname: 'issuer',
      fieldnamepreview:'issuers',
      entity:'issuer',
    }),
    'system_of_record_associated_data product': getDatalist({
      multi: false,
      fieldname: 'product',
      fieldnamepreview:'products',
      entity:'product',
    }),
    'system_of_record_associated_data resources':getDatalist({
      multi: true,
      fieldname: 'resources',
      fieldnamepreview:'resources',
      entity:'resource',
    }),
    'system_of_record_associated_data segments': getDatalist({
      multi: true,
      fieldname: 'segments',
      fieldnamepreview:'segments',
      entity:'segment',
      resourceurl:'segments',
    }),
  },
};
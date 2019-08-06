'use strict';
const capitalize = require('capitalize');
const cardprops = require('../props/cardprops');
const CONSTANTS = require('../../constants');
let i = 0;

exports.getDownloadButton = function (options) {
  return {
    component: 'ResponsiveButton',
    // bindpropsSKIP:true,
    // thispropsSKIP:{
    //   formdata:[formdata]
    // },
    //https://dcp-dev.promisefinancial.net:8788/pem/download/segments/581a58d8c2edb5f419d2e234?prop=conditions&export_format=csv
    props: {
      onclickThisProp: 'formdata',
      onclickBaseUrl: `/pem/download/${options.entity}/:id?prop=${options.prop}&export_format=${options.format}`,
      onclickLinkParams: [
        {
          key: ':id',
          val: '_id',
        },
      ],
      aProps: {
        style: Object.assign({}, CONSTANTS.styles.buttons.primaryALink, options.style),
        target: '_blank',
      },
    },
    children: options.label,
  };
};

exports.getCalculationDatalist = function (options) {
  return {
    type: 'datalist',
    label: 'Calculation',
    datalist: {
      selector: '_id',
      displayField: 'title',
      multi: options.multi || false,
      field: `system_of_record_associated_data.${options.enginetype}_calculation`,
      dbname: 'standard',
      entity: 'calculation',
      resourceDescription: true,
      resourcePreview: '/content/standard/calculations',
      resourceUrl: '/pem/calculation/?format=json&limit=10&allowSpecialCharacters=true', // `${options.extsettings.basename}${usablePrefix}/${pluralize(entity.toLowerCase())}/?format=json`,
    },
  };
};

exports.getDatalist = function (options) {
  return {
    type: 'datalist',
    label: capitalize(options.fieldname),
    datalist: {
      selector: '_id',
      displayField: 'title',
      multi: options.multi,
      field: `system_of_record_associated_data.${options.fieldname}`,
      dbname: 'standard',
      entity: options.entity||options.fieldnamepreview||options.fieldname,
      resourceDescription: true,
      resourcePreview: `/content/standard/${options.fieldnamepreview}`,
      resourceUrl: `/pem/${options.resourceurl || options.fieldname}/?format=json&limit=10&allowSpecialCharacters=true`, // `${options.extsettings.basename}${usablePrefix}/${pluralize(entity.toLowerCase())}/?format=json`,
    },
  };
};

exports.getCardFormgroup = function (options) {
  i++;
  // console.log('genkey:',{i}, Math.random()+'-' + i+'-' + new Date().valueOf() );
  return {
    gridProps: {
      key:Math.random()+'-' + i+'-' + new Date().valueOf(),
    },
    card: {
      // twoColumns: true,
      props: Object.assign({},
        cardprops({
          cardTitle: `${options.title}`,
        }),
        { display: options.displayCard, }),
    },
    formElements: options.elements,
  };
};
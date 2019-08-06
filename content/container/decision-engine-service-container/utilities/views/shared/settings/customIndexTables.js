'use strict';
// const pluralize = require('pluralize');
// const capitalize = require('capitalize');
const data_tables = require('../../../../../../node_modules/periodicjs.ext.reactadmin/utility/data_tables');

const pemTableHeader = [
  data_tables.tableField({
    field: 'title',
    link: true,
    headerStyle: {
      maxWidth: 150,
      // overflow: 'hidden',
      // textOverflow: 'ellipsis',
    },
    columnStyle: {
      maxWidth: 150,
      // overflow: 'hidden',
      // textOverflow: 'ellipsis',
    },
  }),
  data_tables.tableCreatedDate,
  data_tables.tableField({
    title: 'Version',
    field: 'attributes.version',
  }),
  data_tables.tableField({
    title: 'Category',
    field: 'category',
  }),
  data_tables.tableField({
    title: 'Description',
    field: 'description',
    headerStyle: {
      maxWidth: 250,
    },
    columnStyle: {
      maxWidth: 250,
    },
  }),
  data_tables.tableOptions,
];

module.exports = {
  creditengine: pemTableHeader,
  engine: pemTableHeader,
  issuer: pemTableHeader,
  parser: pemTableHeader,
  product: pemTableHeader,
  resource: pemTableHeader,
  segment: pemTableHeader,
};
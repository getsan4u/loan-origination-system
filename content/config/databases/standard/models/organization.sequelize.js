'use strict';
const Sequelize = require('sequelize');

const scheme = {
  _id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
    unique: 'organization_name',
  },
  entitytype: {
    type: Sequelize.STRING,
    defaultValue: 'organization',
  },
  account_type: {
    type: Sequelize.STRING,
  },
  account_users: {
    type: Sequelize.INTEGER,
  },
  account_expiration_date: {
    type: Sequelize.DATE,
  },
  status_active:{
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
};

const options = {
  underscored: true,
  timestamps: true,
  indexes: [{
    fields: ['createdat', ],
  }, ],
};

const associations = [{
  source: 'organization',
  association: 'hasMany',
  target: 'user',
  options: {
    as: 'users',
  },
}, {
  source: 'organization',
  association: 'hasOne',
  target: 'client',
  options: {
    as: 'client',
  },
},
];

module.exports = {
  scheme,
  options,
  associations,
  coreDataOptions: {
    docid: ['_id',],
    sort: { createdat: -1, },
    search: ['name', 'account_type', 'status', 'entitytype', ],
    population: '',
  },
};
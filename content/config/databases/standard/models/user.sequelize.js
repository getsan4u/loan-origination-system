'use strict';
const Sequelize = require('sequelize');

const scheme = {
  _id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  entitytype: {
    type: Sequelize.STRING,
  }, 
  username: {
    type: Sequelize.STRING,
    unique: 'user_username',
  },
  password: {
    type: Sequelize.STRING,
  },
  email: {
    type: Sequelize.STRING,
    unique: 'user_email',
  },
  first_name: {
    type: Sequelize.STRING,
  },
  last_name: {
    type: Sequelize.STRING,
  },
  phone: {
    type: Sequelize.STRING,
  },
  status_email_verified: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  status_active: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  status_mfa: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  terms_of_service_consent: {
    type: Sequelize.BOOLEAN,
  },
  terms_of_service_version: {
    type: Sequelize.STRING,
  },
  terms_of_service_date: {
    type: Sequelize.DATE,
  },
  terms_of_service_ip_address: {
    type: Sequelize.STRING,
  },
  terms_of_service_user_agent: {
    type: Sequelize.STRING,
  },
  privacy_policy_consent: {
    type: Sequelize.BOOLEAN,
  },
  privacy_policy_version: {
    type: Sequelize.STRING,
  },
  privacy_policy_date: {
    type: Sequelize.DATE,
  },
  privacy_policy_ip_address: {
    type: Sequelize.STRING,
  },
  privacy_policy_user_agent: {
    type: Sequelize.STRING,
  },
};


const options = {
  underscored: true,
  timestamps: true,
  indexes: [{
    fields: ['createdat'],
  }],
  // getterMethods:{
  //   config: function () {
  //     // // console.log('getterTHIS', this);
  //     // console.log('this.dataValues.config', this.dataValues.config);
  //     // // console.log('this.config', this.config);
  //     // // console.log('this.config.toString()', this.config.toString());
  //     // console.log('this.filepath', this.filepath);
  //     return JSON.parse(this.dataValues.config);
  //   },
  // },
  // setterMethods: {
  //   config: function(value) {
  //     this.setDataValue('config', JSON.stringify(value));
  //   },
  // },
};

const associations = [
  {
    source: 'user',
    association: 'hasOne',
    target: 'organization',
    options: {
      as: 'org',
    },
  },
  {
    source: 'user',
    association: 'hasMany',
    target: 'userrole',
    options: {
      as: 'userroles',
    },
  },
  {
    source: 'user',
    association: 'hasOne',
    target: 'asset',
    options: {
      as: 'primaryasset',
    },
  },
];

module.exports = {
  scheme,
  options,
  associations,
  coreDataOptions: {
    docid: ['_id', 'name', ],
    sort: { createdat: -1, },
    search: ['first_name', 'last_name', 'email', ],
    population: '',
  },
};
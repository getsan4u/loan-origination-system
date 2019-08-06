'use strict';
let periodic;
let Organization;
let Transaction;
let User;
let Mlmodel;
let Template;
let Strategy;
let orgIds;
let CoreMailer;
let mailerSendEmail;
let environment;
let Moment = require('moment');
const converter = require('json-2-csv');
const Bluebird = require('bluebird');
const Promisie = require('promisie');
const fs = require('fs');
const fsx = require('fs-extra');
const util = require('util')
const path = require('path');
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);


const createDir = async function () {
  let makeDirectory = await fsx.ensureDir(path.resolve(periodic.config.app_root, `content/files/hourly_export/`))
  return true;
};

const getAllOrgs = async function () {
  try {
    let orgs = await Organization.model.find({});
    let formattedorgs = orgsFormatter(orgs);
    return formattedorgs;
  } catch (err) {
    console.log({ err, });
  }
};

const orgsFormatter = function (orgs) {
  let formattedOrgs = [];
  orgs.forEach(org => {
    formattedOrgs.push({
      'Organization Mongo ID': org._id.toString(),
      'Organization Name': org.name,
      'Create Date': Moment(org.createdat).format('YYYY-MM-DD_HH-mm'),
      'Last Update Date': Moment(org.updatedat).format('YYYY-MM-DD_HH-mm'),
      'Status': (org.status.active) ? 'Active' : 'Inactive',
      'Number of Users': org.association.users.length,
      'Billing - Balance': org.billing.balance,
      'Billing - Max Balance': org.billing.max_balance,
      'Billing - Payment Increment': org.billing.payment_increment,
      'Billing - Monthly Fee': org.billing.pricing_per_month,
      'Billing - Payment Type': org.billing.payment_type,
      // 'ML Models Price Per Transaction': org.products.machine_learning.price, // FIX FOR EXTENDED PRICING
      // 'ML Vision Price Per Transaction': org.products.text_recognition.price, // FIX FOR EXTENDED PRICING
      // 'ML Rules Engine Price Per Transaction': org.products.rules_engine.price, // FIX FOR EXTENDED PRICING
      'ML Models Active Status': (org.products.machine_learning.active) ? 'Active' : 'Inactive',
      'ML Vision Active Status': (org.products.text_recognition.active) ? 'Active' : 'Inactive',
      'ML Rules Engine Active Status': (org.products.rules_engine.active) ? 'Active' : 'Inactive',
      'Street': org.address.street,
      'City': org.address.city,
      'State': org.address.state,
      'Postal Code': org.address.postal_code
    })
  });
  return formattedOrgs;
}

const getAllTransactions = async function () {
  try {
    let transactions = await Transaction.model.find({});
    let formattedtransactions = transactionsFormatter(transactions);
    return formattedtransactions;
  } catch (err) {
    console.log({ err, });
  }
}

const transactionsFormatter = function (transactions) {
  let formattedTransactions = [];
  transactions.forEach(transaction => {
    formattedTransactions.push({
      'Transaction Mongo ID': transaction._id.toString(),
      'Transaction ID': transaction.transaction_id,
      'Create Date': Moment(transaction.createdat).format('YYYY-MM-DD_HH-mm'),
      'Last Update Date': Moment(transaction.updatedat).format('YYYY-MM-DD_HH-mm'),
      'Organization Mongo ID': (transaction.organization) ? transaction.organization.toString() : null,
      'Item': transaction.item,
      'Strategy Count': transaction.strategy_count,
    })
  });
  return formattedTransactions;
}

const getAllUsers = async function () {
  try {
    let users = await User.model.find({});
    let formattedusers = usersFormatter(users);
    return formattedusers;
  } catch (err) {
    console.log({ err, });
  }
}

const usersFormatter = function (users) {
  let formattedUsers = [];
  users.forEach(user => {
    formattedUsers.push({
      'User Mongo ID': user._id.toString(),
      'Create Date': Moment(user.createdat).format('YYYY-MM-DD_HH-mm'),
      'Last Update Date': Moment(user.updatedat).format('YYYY-MM-DD_HH-mm'),
      'Status': (user.status.active) ? 'Active' : 'Inactive',
      'Email Verified Status': (user.status.email_verified) ? 'Verified' : 'Not Verified',
      'MFA Enabled': (user.status.mfa) ? 'Enabled' : 'Disabled',
      'Organization Mongo ID': (user.association && user.association.organization) ? user.association.organization.toString() : null,
      'First Name': user.first_name,
      'Last Name': user.last_name,
      'Email': user.email,
      'Phone': (user.phone) ? user.phone : null,
      'User Type': (user.userroles && user.userroles[0]) ? user.userroles[0].toString() : null
    })
  });
  return formattedUsers;
}

const getAllMLModels = async function () {
  try {
    let mlmodels = await Mlmodel.model.find({});
    let formattedmlmodels = mlmodelsFormatter(mlmodels);
    return formattedmlmodels;
  } catch (err) {
    console.log({ err, });
  }
}

const mlmodelsFormatter = function (models) {
  let formattedModels = [];
  models.forEach(model => {
    formattedModels.push({
      'Model Mongo ID': model._id.toString(),
      'Create Date': Moment(model.createdat).format('YYYY-MM-DD_HH-mm'),
      'Last Update Date': Moment(model.createdat).format('YYYY-MM-DD_HH-mm'),
      'Organization Mongo ID': (model.organization) ? model.organization.toString() : null,
      'Display Name': model.display_name,
      'Type': model.type,
      'Status': model.status,
      'Predictor Variables': model.predictor_variable_count,
      'Observation Count': model.observation_count,
    })
  });
  return formattedModels;
}

const getAllTemplates = async function () {
  try {
    let templates = await Template.model.find({});
    let formattedtemplates = templatesFormatter(templates);
    return formattedtemplates;
  } catch (err) {
    console.log({ err, });
  }
}

const templatesFormatter = function (templates) {
  let formattedTemplates = [];
  templates.forEach(template => {
    formattedTemplates.push({
      'Template Mongo ID': template._id.toString(),
      'Create Date': Moment(template.createdat).format('YYYY-MM-DD_HH-mm'),
      'Last Update Date': Moment(template.createdat).format('YYYY-MM-DD_HH-mm'),
      'Organization Mongo ID': (template.organization) ? template.organization.toString() : null,
      'Display Name': template.name
    })
  });
  return formattedTemplates;
}

const getAllStrategies = async function () {
  try {
    let strategies = await Strategy.model.find({});
    let formattedstrategies = strategiesFormatter(strategies);
    return formattedstrategies;
  } catch (err) {
    console.log({ err, });
  }
}

const strategiesFormatter = function (strategies) {
  let formattedStrategies = [];
  strategies.forEach(strategy => {
    formattedStrategies.push({
      'Strategy Mongo ID': strategy._id.toString(),
      'Create Date': Moment(strategy.createdat).format('YYYY-MM-DD_HH-mm'),
      'Last Update Date': Moment(strategy.createdat).format('YYYY-MM-DD_HH-mm'),
      'Organization Mongo ID': (strategy.organization) ? strategy.organization.toString() : null,
      'Display Name': strategy.display_name
    })
  });
  return formattedStrategies;
}

async function createCSV(data) {
  if (data && data[0]) {
    let asyncJson2Csv = Bluebird.promisify(converter.json2csv, { context: converter, });
    let headers = Object.keys(data[0]);
    const csv_options = {
      emptyFieldValue: '',
      keys: headers,
      delimiter: {
        wrap: '"', // Double Quote (") character
        array: ';', // Semicolon array value delimiter
      },
      checkSchemaDifferences: false,
    };
    let csv = await asyncJson2Csv(data, csv_options);
    return csv;
  } else {
    return false;
  }
}

async function writeCSVFile(data, type) {
  let createdFile;
  try {
    if (data) {
      let filePath = path.resolve(periodic.config.app_root, `content/files/hourly_export/`)
      let fileName = `${type}_${Moment().format('YYYY-MM-DD_HH-mm')}.csv`;
      createdFile = await writeFile(`${filePath}/${fileName}`, data, 'utf8');
      return { filePath, fileName };      
    } else {
      return false;
    }
  } catch (err) {
    console.log({ err });
    return false;
  }
}

async function sendEmail(files) {
  let filteredFiles = files.filter(file => {
    if (file !== false) return file
  })
  const email = {
    from: periodic.settings.periodic.emails.server_from_address,
    to: 'accounts@digifi.io',
    // to: 'mark@digifi.io',
    bcc: periodic.settings.periodic.emails.notification_address,
    subject: `${environment} - Hourly Export Cron - ${Moment().tz('America/New_York').format('LLL')}`,
    generateTextFromHTML: true,
    emailtemplatefilepath: path.resolve(periodic.config.app_root, 'content/container/decision-engine-service-container/utilities/views/email/hourly_export.ejs'),
    emailtemplatedata: {
    },
    attachments: filteredFiles.map(file => {
      return {
        filename: file.fileName,
        contentType: 'text/csv',
        path: `${file.filePath}/${file.fileName}`
      }
    }),
  };
  return await periodic.core.mailer.sendEmail(email);
}

async function clearDirectory() {
  let directory = path.resolve(periodic.config.app_root, `content/files/hourly_export`);
  fs.readdir(directory, (err, files) => {
    if (err) throw err;
  
    for (const file of files) {
      fs.unlink(path.join(directory, file), err => {
        if (err) throw err;
      });
    }
  });
}

const mainFunc = async function (req, res, next) {
  try {
    let createExportDir = await createDir();

    let allOrgs = await getAllOrgs();
    let allTransactions = await getAllTransactions();
    let allUsers = await getAllUsers();
    let allModels = await getAllMLModels();
    let allTemplates = await getAllTemplates();
    let allStrategies = await getAllStrategies();

    let orgCSV = await createCSV(allOrgs)
    let transactionCSV = await createCSV(allTransactions);
    let userCSV = await createCSV(allUsers);
    let modelCSV = await createCSV(allModels);
    let templateCSV = await createCSV(allTemplates);
    let strategyCSV = await createCSV(allStrategies);

    let orgCSVFile = await writeCSVFile(orgCSV, 'organization');
    let transactionCSVFile = await writeCSVFile(transactionCSV, 'transaction');
    let userCSVFile = await writeCSVFile(userCSV, 'user');
    let modelCSVFile = await writeCSVFile(modelCSV, 'model');
    let templateCSVFile = await writeCSVFile(templateCSV, 'template');
    let strategyCSVFile = await writeCSVFile(strategyCSV, 'strategy');

    let emailResults = await sendEmail([orgCSVFile, transactionCSVFile, userCSVFile, modelCSVFile, templateCSVFile, strategyCSVFile]);

    let cleanupFiles = await clearDirectory([ orgCSVFile, transactionCSVFile, userCSVFile, modelCSVFile, templateCSVFile, strategyCSVFile ]);
    if (next) return next();
  } catch (err) {
    console.log({ err });
  }
};

var initialize = function (resources) {
  periodic = resources;
  environment = periodic.settings.application.environment;
  Organization = periodic.datas.get('standard_organization');
  Transaction = periodic.datas.get('standard_transaction');
  User = periodic.datas.get('standard_user');
  Mlmodel = periodic.datas.get('standard_mlmodel');
  Template = periodic.datas.get('standard_templatedocument');
  Strategy = periodic.datas.get('standard_strategy');
  CoreMailer = resources.core.mailer;
  mailerSendEmail = Promisie.promisify(CoreMailer.sendEmail);

  return mainFunc;
};

module.exports = initialize;
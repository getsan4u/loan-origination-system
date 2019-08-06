'use strict';

/** Middleware for organization */

const periodic = require('periodicjs');
const logger = periodic.logger;
const utilities = require('../utilities');
const api_utilities = utilities.controllers.api;
const helpers = utilities.helpers;
let stripeToken = periodic.settings.container[ 'decision-engine-service-container' ].stripe.token;
var stripe = require('stripe')(stripeToken);
const Numeral = require('numeral');
const Accounting = require('accounting');
const moment = require('moment');

const transformhelpers = utilities.transformhelpers;

async function getCustomer(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.org && req.controllerData.org.stripe && req.controllerData.org.stripe.customer) {
      let customer = await stripe.customers.retrieve(req.controllerData.org.stripe.customer);
      req.controllerData.stripeCustomer = customer;
      next();
    } else {
      return next();
    }
  } catch(e) {
    return next(e);
  }
}

async function createCustomer(req, res, next) {
  req.controllerData = req.controllerData || {};
  let org = req.controllerData.org;
  if (req.controllerData.stripeCustomer) {
    req.controllerData.org.association = null;
    delete req.controllerData.org.association;
    return next();
  } else {
    let customer = await stripe.customers.create(
      { email: req.user.email, }
    );
    org.stripe = org.stripe || {};
    org.stripe.customer = customer.id;
    org.billing.max_balance = 10000;
    req.controllerData.org.association = null;
    delete req.controllerData.org.association;
    req.controllerData.stripeCustomer = customer;
    return next();
  }
}

async function createPaymentMethod(req, res, next) {
  try {
    let source = await stripe.sources.create({
      type: 'card',
      card: {
        number: req.body.credit_card_number,
        exp_month: Number(req.body.exp_month),
        exp_year: Number(req.body.exp_year),
        cvc: req.body.cvc,
      },
    });
    req.controllerData.source = source;
    return next();
  } catch (err) {
    return next(err.message)
  }
}

async function updateCustomer(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let { stripeCustomer, source, } = req.controllerData;
    let updatedCustomer;
    let removeSourced;
    if (stripeCustomer && stripeCustomer.default_source) {
      removeSourced = await stripe.customers.deleteSource(stripeCustomer.id, stripeCustomer.default_source);
      updatedCustomer = await stripe.customers.createSource(stripeCustomer.id, {
        source: source.id,
      });
    } else {
      updatedCustomer = await stripe.customers.createSource(stripeCustomer.id, {
        source: source.id,
      });
    }
    return next();
  } catch (err) {
    console.log({ err, });
    return next(err.message);
  }
}

async function chargeDefaultCard(req, res, next) {
  req.controllerData = req.controllerData || {};
  try {
    let { stripeCustomer, org, } = req.controllerData;
    let charge = await stripe.charges.create({
      amount: org.billing.payment_increment,
      currency: 'usd',
      source: stripeCustomer.default_source,
      description: 'Balance refill',
    });
    req.controllerData.charge = charge;
    return next();
  } catch (err) {
    console.log({ err, });
    return res.status(400).send({});
  }
}

async function stageCreditCardTransactionForCreation(req, res, next) {
  req.controllerData = req.controllerData || {};
  req.controllerData.transactionData = {
    item: 'Credit Card Payment',
    amount: req.controllerData.charge.amount,
    organization: req.controllerData.org.id,
  };
  return next();
}

async function stageProcessingTransactionForCreation(req, res, next) {
  req.controllerData = req.controllerData || {};
  let { transactionParams, } = req.controllerData;
  if (transactionParams.requestType === 'Individual') {
    req.controllerData.transactionData = {
      item: `${transactionParams.requestName}: Interface ${transactionParams.requestType}`,
      taxable: true,
      strategy_count: 1,
      amount : Accounting.toFixed(transactionParams.requestCost, 2),
      organization: req.user.association.organization,
    };
  }

  if (transactionParams.requestType === 'Batch') {
    let requestNumber = 1;
    if (transactionParams.requestName === 'Machine Learning') requestNumber = req.controllerData.formatted_ml_cases.length;
    if (transactionParams.requestName === 'Decision Engine') requestNumber = req.controllerData.testcases.length;
      
    let requestCost = parseFloat(Math.round((requestNumber * transactionParams.requestCost) * 100) / 100).toFixed(2);
    req.controllerData.transactionData = {
      item: `${transactionParams.requestName}: Interface ${transactionParams.requestType}`,
      taxable: true,
      strategy_count: requestNumber,
      amount : Accounting.toFixed(requestCost, 2),
      organization: req.user.association.organization,
    };
  } else {
    let requestCost = parseFloat(Math.round((transactionParams.requestCost) * 100) / 100).toFixed(2);
    req.controllerData.transactionData = {
      item: `${transactionParams.requestName}: Interface ${transactionParams.requestType}`,
      taxable: true,
      strategy_count: 1,
      amount : Accounting.toFixed(requestCost, 2),
      organization: req.user.association.organization,
    };
  }
  return next();
}

async function stageAPITransactionForCreation(req, res, next) {
  req.controllerData = req.controllerData || {};
  let { transactionParams, } = req.controllerData;
  let requestType = (transactionParams.requestType) ? transactionParams.requestType : 'Individual';
  req.controllerData.transactionData = {
    item: `${transactionParams.requestName}: API ${requestType}`,
    taxable: true,
    strategy_count: transactionParams.requestCount || 1,
    amount : Accounting.toFixed(transactionParams.requestCost, 2),
    organization: req.user.association.organization,
  };
  return next();
}

async function addTransaction(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Transaction = periodic.datas.get('standard_transaction');
  Transaction.create({
    newdoc: Object.assign({}, req.controllerData.transactionData, ),
  })
    .then(transaction => {
      req.controllerData.transaction = transaction;
      if(req.controllerData.results) req.controllerData.results.request_id = transaction.transaction_id;
      if (req.controllerData.single_ml_result) req.controllerData.single_ml_result.request_id = transaction.transaction_id;      
      return next();
    })
    .catch(err => {
      if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
        let xmlError = api_utilities.formatXMLErrorResponse(err);
        res.set('Content-Type', 'application/xml');
        return res.status(401).send(xmlError);
      } else {
        return res.status(401).send({
          error: err,
        });
      }
    });
}

async function addOrgAddress(req, res, next) {
  req.controllerData = req.controllerData || {};
  let { org, } = req.controllerData;
  let rb = req.body;
  if (rb.street_address && org && !org.address.street) {
    org.address = {
      street: rb.street_address,
      city: rb.city,
      state: rb.state,
      postal_code: rb.postal_code,
    };
  }
  return next();
} 

async function updateOrgBalance(req, res, next) {
  req.controllerData = req.controllerData || {};
  let { org, charge, } = req.controllerData;
  if (org && charge) {
    req.controllerData.org.billing.balance = req.controllerData.org.billing.balance + charge.amount;
  }
  next();
}

async function sendPaymentEmail(req, res, next) {
  req.controllerData = req.controllerData || {};
}

async function getTransactions(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let { org, } = req.controllerData;
    let query = { organization: req.controllerData.org._id, };
    let skip = req.query.pagenum ? ((Number(req.query.pagenum) - 1) * 50) : 0;
    const Transaction = periodic.datas.get('standard_transaction');
    const numItems = await Transaction.model.countDocuments(query);
    const numPages = Math.ceil(numItems / 50);
    let transactions = await Transaction.model.find(query).sort('-createdat').skip(skip).limit(50).lean();
    req.controllerData.transactions = transactions.reduce((returnData, transaction) => {
      let amount = (transaction.amount < 0) ? `${Numeral(transaction.amount).format('$0,0.00')}` : `${Numeral(transaction.amount).format('$0,0.00')}`;
      returnData.push({
        date: transformhelpers.formatDate(transaction.createdat, req.user.time_zone),
        item: transaction.item,
        strategy_count: transaction.strategy_count,
        amount: amount
      });
      return returnData;
    }, []);

    if (req.query && req.query.getMonthTransactions) {
      const monthlyTransactionQuery = { organization: req.controllerData.org._id, createdat: { $gte: moment().startOf('month') } };
      const numItemsThisMonth = await Transaction.model.countDocuments(monthlyTransactionQuery);
      req.controllerData.transaction_count = numItemsThisMonth;
    }

    req.controllerData = Object.assign({}, req.controllerData, {
      rows: req.controllerData.transactions,
      numPages,
      numItems,
    });
    // delete req.controllerData.org;
    return next();
  } catch(e) {
    return next(e);
  }
}

async function getPaginatedTransactions(req,res,next) {
  try {
    req.controllerData = req.controllerData || {};
    let { org, } = req.controllerData;
    if (req.query && req.query.paginate) {
      let pagenum = 1;
      if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
      let skip = 50 * (pagenum - 1);
      let queryOptions = { query: { organization: req.controllerData.org._id, }, paginate: true, limit: 50, pagelength: 50, skip, sort: '-createdat', /*population: 'datasource'*/ };
      const Transaction = periodic.datas.get('standard_transaction');
      let result = await Transaction.query(queryOptions);
      const numItems = await Transaction.model.countDocuments(queryOptions.query);
      const numPages = Math.ceil(numItems / 50);
      let transaction_docs = (result && result[ '0' ] && result[ '0' ].documents) ? result[ '0' ].documents : [];
      transaction_docs = transaction_docs.map(app => app = app.toJSON ? app.toJSON() : app);
      req.controllerData = Object.assign({}, req.controllerData, {
        rows: transaction_docs.map(transaction => {
          transaction.date =  transformhelpers.formatDate(transaction.createdat, req.user.time_zone);
          transaction.amount = (transaction.amount < 0) ? `${Numeral(transaction.amount).format('$0,0.00')}` : `${Numeral(transaction.amount).format('$0,0.00')}`;
          return transaction;
        }),
        numPages,
        numItems,
      });
    }
    next();
  } catch(e) {
    res.status(500).send({ message: 'Error retrieving transactions' });
  }
}

async function checkOrganizationStatus(req, res, next) {
  req.controllerData = req.controllerData || {};
  let { org, } = req.controllerData;
  let error = null;
  // if (org && org.billing && org.billing.max_balance && org.billing.balance && (org.billing.balance >= org.billing.max_balance)) {
  //   error = 'Account limit reached. Payment required before running additional processes';
  // }
  if (org && org.billing && org.billing.transaction_count && org.billing.max_transactions && (org.billing.transaction_count >= org.billing.max_transactions)) {
    error = 'Account limit reached. Please contact DigiFi.';
  }
  if (req.url.match(/ml_rules_engine/i) && org && org.products && org.products[ 'rules_engine' ] && !org.products[ 'rules_engine' ].active) {
    error = 'You have not activated the requested product';
  }
  if (req.url.match(/ml_models/i) && org && org.products && org.products[ 'machine_learning' ] && !org.products[ 'machine_learning' ].active) {
    error = 'You have not activated the requested product';
  }
  if (req.url.includes('text_recognition') && org && org.products && org.products[ 'text_recognition' ] && !org.products[ 'text_recognition' ].active) {
    error = 'You have not activated the requested product';
  }
  if (error) {
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xmlError = api_utilities.formatXMLErrorResponse({error, });
      res.set('Content-Type', 'application/xml');
      return res.status(401).send(xmlError);
    } else {
      return res.status(401).send({
        error,
      });
    }
  } else {
    return next();
  }
}

async function addTrialCredit(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Transaction = periodic.datas.get('standard_transaction');
  Transaction.create({
    newdoc: Object.assign({}, {
      item: 'Free Trial Credit',
      amount: -250.00,
      organization: req.controllerData.org._id,
    }),
  })
    .then(transaction => {
      req.controllerData.transaction = transaction;
      return next();
    })
    .catch(err => {
      console.log({ err, });
      return res.status(400).send({});
    });
}

async function setRequestTypeAndCost(req, res, next) {
  req.controllerData = req.controllerData || {};
  let { org, } = req.controllerData;
  req.controllerData.transactionParams = {};
  let { rules_engine, machine_learning, text_recognition, } = org.products;

  if (req.originalUrl.includes('individual') ) {
    req.controllerData.transactionParams.requestType = 'Individual';
  }

  if (req.originalUrl.includes('batch') ) {
    req.controllerData.transactionParams.requestType = 'Batch';
  }

  /* API ENDPOINTS */
  if (req.originalUrl.includes('api/v2/ml_rules_engine')) {
    req.controllerData.transactionParams.requestName = 'Decision Engine';
    req.controllerData.transactionParams.requestCost = (rules_engine && rules_engine.pricing && rules_engine.pricing.api_individual) ? rules_engine.pricing.api_individual : 0.00;
    req.controllerData.transactionParams.requestCount = 1;
  }
  
  if (req.originalUrl.includes('api/v2/rules_engine_batch')) {
    req.controllerData.transactionParams.requestName = 'Decision Engine';
    req.controllerData.transactionParams.requestCost = (rules_engine && rules_engine.pricing && rules_engine.pricing.api_batch && req.body && req.body.variables && req.body.variables.length) ? rules_engine.pricing.api_batch * req.body.variables.length : 0.00;
    req.controllerData.transactionParams.requestCount = (req.body && req.body.variables && req.body.variables.length) ? req.body.variables.length : 1;
  }

  if (req.originalUrl.includes('api/v2/machine_learning_batch')) {
    req.controllerData.transactionParams.requestName = 'Machine Learning';
    req.controllerData.transactionParams.requestCost = (machine_learning && machine_learning.pricing && machine_learning.pricing.api_batch && req.body && req.body.variables && req.body.variables.length) ? machine_learning.pricing.api_batch * req.body.variables.length : 0.00;
    req.controllerData.transactionParams.requestCount = (req.body && req.body.variables && req.body.variables.length) ? req.body.variables.length : 1;
  }

  if (req.originalUrl.includes('api/v2/ml_models')) {
    req.controllerData.transactionParams.requestName = 'Machine Learning';
    req.controllerData.transactionParams.requestCost = (machine_learning && machine_learning.pricing && machine_learning.pricing.api_individual) ? machine_learning.pricing.api_individual : 0.00;
    req.controllerData.transactionParams.requestCount = 1;
  }

  if (req.originalUrl.includes('api/v2/ocr')) {
    req.controllerData.transactionParams.requestName = 'OCR Text Recognition';
    let type = req.controllerData.transactionParams.requestType || null;
    req.controllerData.transactionParams.requestCost = (type === 'Individual') ? text_recognition.pricing.processing_individual * req.controllerData.fileCount : (type === 'Batch') ? text_recognition.pricing.processing_batch * req.controllerData.fileCount : 0.00;
  }
  
  /* INTERFACE ENDPOINTS */
  if (req.originalUrl.includes('simulation')) {
    req.controllerData.transactionParams.requestName = 'Decision Engine';
    let type = req.controllerData.transactionParams.requestType || null;
    req.controllerData.transactionParams.requestCost = (type === 'Individual') ? rules_engine.pricing.processing_individual : (type === 'Batch') ? rules_engine.pricing.processing_batch : 0.00;
  }


  if (req.originalUrl.includes('optimization') || req.originalUrl.includes('ml/api')) {
    req.controllerData.transactionParams.requestName = 'Machine Learning';
    let type = req.controllerData.transactionParams.requestType || null;
    req.controllerData.transactionParams.requestCost = (type === 'Individual') ? machine_learning.pricing.processing_individual : (type === 'Batch') ? machine_learning.pricing.processing_batch : 0.00;
  }
  
  // if (req.originalUrl.includes('ml_vision') || req.originalUrl.includes('ocr')) {
  //   req.controllerData.transactionParams.requestName = 'OCR Text Recognition';
  //   let type = req.controllerData.transactionParams.requestType || null;
  //   req.controllerData.transactionParams.requestCost = (type === 'Individual') ? text_recognition.pricing.processing_individual * req.controllerData.fileCount : (type === 'Batch') ? text_recognition.pricing.processing_batch * req.controllerData.fileCount : 0.00;
  // }

  if (org && org.stripe && org.stripe.customer && org.address && org.address.state) {
    req.controllerData.transactionParams.taxRate = helpers.lookupTaxes(org.address.state);
  }
  next();
}

function downloadCSV(req, res) {
  try {
    if (req.controllerData && req.controllerData.download_content) {
      res.set('Content-Type', 'text/csv');
      res.attachment(`${req.controllerData.doc.name}_${new Date()}.csv`);
      res.status(200).send(req.controllerData.download_content).end();
    } else {
      res.status(500).send({ message: 'Could not download transactions history.', });
    }
  } catch (e) {
    res.status(500).send({ message: 'Could not download transactions history.', });
  }
}

module.exports = {
  getCustomer,
  createCustomer,
  createPaymentMethod,
  downloadCSV,
  updateCustomer,
  chargeDefaultCard,
  stageCreditCardTransactionForCreation,
  stageProcessingTransactionForCreation,
  stageAPITransactionForCreation,
  addTransaction,
  addOrgAddress,
  updateOrgBalance,
  sendPaymentEmail,
  getTransactions,
  getPaginatedTransactions,
  checkOrganizationStatus,
  addTrialCredit,
  setRequestTypeAndCost,
};
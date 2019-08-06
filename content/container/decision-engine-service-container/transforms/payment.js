'use strict';

const numeral = require('numeral');
const converter = require('json-2-csv');
const capitalize = require('capitalize');
const Bluebird = require('bluebird');
const Numeral = require('numeral');

function formatCustomerData(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      let displayData = {};
      let { stripeCustomer, org, } = req.controllerData;
      if (stripeCustomer && stripeCustomer.default_source) {
        stripeCustomer.sources.data.forEach(source => {
          if (source.id === stripeCustomer.default_source) displayData.source = source.card;
        });
      }
      displayData.balance = (org.billing && org.billing.balance >= 0)
        ? `You owe ${Numeral(org.billing.balance).format('$0,0.00')}`
        : (org.billing && org.billing.balance < 0)
          ? `You have ${Numeral((org.billing.balance) * -1).format('$0,0.00')} remaining in free credits` // get non-negative value
          : '';

      let productKeys = Object.keys(org.products);
      let allProductsZero = true;
      productKeys.forEach(key => {
        if (allProductsZero === true && org.products[ key ].price === 0) allProductsZero = true;
        else allProductsZero = false;
      }); 
      let monthlyPricing = (org.billing && typeof org.billing.pricing_per_month === 'number' && org.billing.pricing_per_month !== 0)
        ? org.billing.pricing_per_month
        : false;
      
      displayData.pricing = (org.billing && !allProductsZero && !monthlyPricing)
        ? 'Usage based'
        : (monthlyPricing && !allProductsZero)
          ? `Usage based | ${Numeral(monthlyPricing).format('$0,0.00')} monthly fee`
          : (monthlyPricing && allProductsZero)
            ? `${Numeral(monthlyPricing).format('$0,0.00')} monthly fee`
            : '';
  
      displayData.payment_method = (org.billing && org.billing.payment_type === 'auto')
        ? 'Not Applicable'
        : (org.billing && org.billing.payment_type === 'manual')
          ? 'Payment by invoice'
          : 'Not Applicable';
      
      displayData.max_transaction_count = (org.billing && org.billing.max_transactions)
        ? org.billing.max_transactions
        : 'Not Applicable';
      
      displayData.transaction_count = (req.controllerData.transaction_count && typeof req.controllerData.transaction_count === 'number')
        ? numeral(req.controllerData.transaction_count).format('0,0')
        : 'Not Applicable';

      displayData.credit_card = (displayData.source)
        ? (displayData.source.brand === 'American Express')
          ? `${displayData.source.brand} **** ****** *${displayData.source.last4}`
          : `${displayData.source.brand} **** **** **** ${displayData.source.last4}`
        : 'None';

      displayData.company_name = (org.name)
        ? capitalize(org.name)
        : '';

      displayData.street_address = (org.address && org.address.street)
        ? org.address.street
        : '';

      displayData.city = (org.address && org.address.city)
        ? org.address.city
        : '';

      displayData.state = (org.address && org.address.state)
        ? org.address.state
        : '';

      displayData.postal_code = (org.address && org.address.postal_code)
        ? org.address.postal_code
        : '';
      
      displayData.hideCCButton = (org.billing && org.billing.payment_type === 'manual') ? true : false;

      displayData.active_user_count = (org.association && org.association.users)?org.association.users.filter(user => user.status.active).length : 0;
      displayData.active_user_count = numeral(displayData.active_user_count).format('0,0');


      req.controllerData.displayData = displayData;
      delete req.controllerData.stripeCustomer;
      delete req.controllerData.org;
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

function formatTransactionsCSVData(req) {
  return new Promise(async (resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.controllerData.transactions) {
        let asyncJson2Csv = Bluebird.promisify(converter.json2csv, { context: converter, });
        let headers = [ 'date', 'item', 'strategy_count', ];
        let rows = req.controllerData.transactions;
        const csv_options = {
          emptyFieldValue: '',
          keys: headers,
          delimiter: {
            wrap: '"', // Double Quote (") character
            array: ';', // Semicolon array value delimiter
          },
          checkSchemaDifferences: false,
        };
        let csv = await asyncJson2Csv(rows, csv_options);
        req.controllerData.download_content = csv;
        req.controllerData.doc = req.controllerData.doc || {};
        req.controllerData.doc.name = 'Transaction History';
      } else {
        req.controllerData.download_content = '';
        req.controllerData.doc = req.controllerData.doc || {};
        req.controllerData.doc.name = 'Transaction History';
      }
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

module.exports = {
  formatCustomerData,
  formatTransactionsCSVData,
}
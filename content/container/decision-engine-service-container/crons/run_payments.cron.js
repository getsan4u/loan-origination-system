'use strict';
const Promisie = require('promisie');
const os = require('os');
const path = require('path');
const moment = require('moment');
const Numeral = require('numeral');
let periodic;
let Invoice;
let Organization;
let Transaction;
let User;
let stripeToken;
var stripe;
let taxTable = {
  'AL': 0.00,
  'AK': 0.00,
  'AS': 0.00,
  'AZ': 0.00,
  'AR': 0.00,
  'CA': 0.00,
  'CO': 0.00,
  'CT': 0.00,
  'DE': 0.00,
  'DC': 0.00,
  'FM': 0.00,
  'FL': 0.00,
  'GA': 0.00,
  'GU': 0.00,
  'HI': 0.00,
  'ID': 0.00,
  'IL': 0.00,
  'IN': 0.00,
  'IA': 0.00,
  'KS': 0.00,
  'KY': 0.00,
  'LA': 0.00,
  'ME': 0.00,
  'MH': 0.00,
  'MD': 0.00,
  'MA': 0.00,
  'MI': 0.00,
  'MN': 0.00,
  'MS': 0.00,
  'MO': 0.00,
  'MT': 0.00,
  'NE': 0.00,
  'NV': 0.00,
  'NH': 0.00,
  'NJ': 0.00,
  'NM': 0.00,
  'NY': 0.08875,
  'NC': 0.00,
  'ND': 0.00,
  'MP': 0.00,
  'OH': 0.00,
  'OK': 0.00,
  'OR': 0.00,
  'PW': 0.00,
  'PA': 0.00,
  'PR': 0.00,
  'RI': 0.00,
  'SC': 0.00,
  'SD': 0.00,
  'TN': 0.00,
  'TX': 0.00,
  'UT': 0.00,
  'VT': 0.00,
  'VI': 0.00,
  'VA': 0.00,
  'WA': 0.00,
  'WV': 0.00,
  'WI': 0.00,
  'WY': 0.00,
};

const getAllOrgs = async function () {
  try {
    let orgs = await Organization.model.find({});
    return orgs;      
  } catch (err) {
    console.log({ err, });
  }
};

const getTransactionsForOrg = async function (orgId) {
  try {
    let transactions = await Transaction.model.find({ organization: orgId, $or: [ { invoiced: null }, { invoiced: undefined }, { invoiced: false } ] });
    return transactions;
  } catch (err) {
    console.log({ err, });
  }
};

const filterOrgsByBalanceAndIncrement = async function (organizations) {
  let filteredOrgs = {};

  for (var i = 0; i < organizations.length; i++) {
    let org = organizations[ i ];
    if (org.billing.balance > org.billing.payment_increment && org.billing.payment_type === 'auto' && org.stripe && org.stripe.customer) {
      filteredOrgs[ org._id ] = {
        users: org.association.users,
        state: org.address.state,
        payment_amount: org.billing.balance,
        customer: org.stripe.customer,
        transactions: await getTransactionsForOrg(org._id),
      };
    }
  }
  return filteredOrgs;
};

const getOrganizationOwners = async function (organizations) {
  for (var org in organizations) {
    let organization = organizations[ org ];
    let users = organization.users;
    organizations[org].adminUsers = [];
    for (var i = 0; i < users.length; i++) {
      let fullUser = await User.load({ query: { _id: users[ i ] } });
      if (fullUser && fullUser.userroles) {
        fullUser.userroles.forEach(role => {
          if (role && role.name && role.name === 'owner') organizations[org].adminUsers.push(fullUser.email);
        })
      }
    }
  }
  return organizations;
}

const getTaxableTotals = function (transactions, state) {
  let taxable_amount = 0;
  let non_taxable_amount = 0;
  let taxRate = (state && taxTable[ state ]) ? taxTable[ state ] : 0.00;
  let taxes_paid = 0;
  transactions.forEach(tx => {
    if (tx.item && tx.item.includes('Sales Tax')) taxes_paid += tx.amount;
    if (tx.taxable) taxable_amount += tx.amount;
    else non_taxable_amount += tx.amount;
  });
  let total_tax_owed = parseFloat(Math.round((taxRate * taxable_amount) * 100) / 100).toFixed(2);
  total_tax_owed = total_tax_owed - taxes_paid;
  if (total_tax_owed < 0) total_tax_owed = 0.00;
  return {
    taxable_amount: parseFloat(Math.round((taxable_amount) * 100) / 100).toFixed(2),
    non_taxable_amount: parseFloat(Math.round((non_taxable_amount) * 100) / 100).toFixed(2),
    total_tax_owed: total_tax_owed || 0.00,
  };
};

const calculateTaxesForOrg = async function (organizations) {
  let orgsWithTaxes = {};
  for (var orginization in organizations) {
    let org = organizations[ orginization ];
    let taxable_totals = getTaxableTotals(org.transactions, org.state);
    orgsWithTaxes[ orginization ] = Object.assign({}, org, taxable_totals);
  }
  return orgsWithTaxes;
};

const getStripeCustomers = async function (organizations) {
  for (var org in organizations) {
    let stripecustomerid = organizations[ org ].customer;
    organizations[ org ].customer = await stripe.customers.retrieve(stripecustomerid);
  }
  return organizations;
};

const chargeCards = async function (organizations) {
  for (var org in organizations) {
    let currentOrg = organizations[ org ];
    let { customer, payment_amount, total_tax_owed, } = currentOrg;
    let totalCharge = (payment_amount + Number(total_tax_owed));
    organizations[org].charge = await stripe.charges.create({
      amount: Math.round(totalCharge * 100),
      currency: 'usd',
      source: customer.default_source,
      customer: customer.id,
      description: 'Payment',
    });
  }
  return organizations;
};

const createInvoices = async function (organizations) {
  try {
    for (var org in organizations) {
      let currentOrg = organizations[ org ];
      let orgInvoices = await Invoice.model.find({ organization: currentOrg._id });
      let invoiceNumber = (1000 + orgInvoices.length) || 1000;
      let charge = currentOrg.charge;
      let payment_amount = currentOrg.payment_amount;
      organizations[ org ].invoice = await Invoice.create({
        number: invoiceNumber,
        organization: currentOrg._id,
        transactions: currentOrg.transactions,
        tax_owed: currentOrg.total_tax_owed,
        total_payment: (charge.amount / 100),
        fees: {
          taxable: currentOrg.taxable_amount  || 0.00,
          non_taxable: currentOrg.non_taxable_amount || 0.00
        }
      });
    }
    return organizations;
  } catch (err) {
    console.log({ err });
  }
}

const createTransactions = async function (organizations) {
  try {
    for (var org in organizations) {
      let currentOrg = organizations[ org ];
      if (currentOrg && currentOrg.charge) {
        let charge = currentOrg.charge;
        if (currentOrg.total_tax_owed) {
          organizations[ org ].transaction_sales_tax = await Transaction.create({
            newdoc: {
              item: 'Sales Tax',
              amount: currentOrg.total_tax_owed,
              organization: org,
              invoiced: true,
            },
          });
        }
        organizations[ org ].transaction = await Transaction.create({
          newdoc: {
            item: 'Balance payment',
            amount:  (charge.amount / 100) * -1,
            organization: org,
            invoiced: true,
          },
        });
      }
    }
    return organizations;
  } catch (err) {
    console.log({ err });
  }
};

const updateTransactions = async function (organizations) {
  try {
    for (var org in organizations) {
      let currentOrg = organizations[ org ];
      let transactions = currentOrg.transactions;
      for (var i = 0; i < transactions.length; i++) {
        let tx = transactions[ i ];
        let updatedTransaction = Transaction.update({
          id: tx._id,
          updatedoc: {
            invoiced: true
          },
          isPatch: true,
        });
      }
    }
    return organizations;
  } catch (err) {
    console.log({ err });
    return organizations;
  }
}

const sendEmails = function (organizations) {
  for (var org in organizations) {
    let currentOrg = organizations[ org ];
    let charge = currentOrg.charge;
    if (charge && charge.outcome && charge.outcome.network_status === 'approved_by_network') {
      sendSuccessEmail(currentOrg);
    } else {
      sendFailEmail(currentOrg);
    }
  }
  return organizations;
};

const sendSuccessEmail = async function (currentOrg) {
  try {
    let charge = currentOrg.charge;
    let { taxable_amount, non_taxable_amount } = currentOrg;
    let fees = Number(currentOrg.taxable_amount) + Number(currentOrg.non_taxable_amount);
    const email = {
      from: periodic.settings.periodic.emails.server_from_address,
      // to: 'mark@digifi.io',
      to: currentOrg.adminUsers.join(', '),
      bcc: periodic.settings.periodic.emails.notification_address,
      subject: 'DigiFi Payment Receipt',
      generateTextFromHTML: true,
      emailtemplatefilepath: path.resolve(periodic.config.app_root, 'content/container/decision-engine-service-container/utilities/views/email/successful_charge.ejs'),
      emailtemplatedata: {
        appname: periodic.settings.name,
        hostname: periodic.settings.application.hostname || periodic.settings.name,
        url: periodic.settings.application.url,
        protocol: periodic.settings.application.protocol,
        amount_paid: Numeral(charge.amount / 100).format('$0,0.00'),
        fees: Numeral(fees).format('$0,0.00'),
        date_paid: moment().format('L'),
        total_tax_owed: Numeral(currentOrg.total_tax_owed).format('$0,0.00'),
        payment_method: `${charge.source.card.brand} - ${charge.source.card.last4}`,
      },
    };
    return await periodic.core.mailer.sendEmail(email);
  } catch (err) {
    console.log({ err, });
  }
};

const sendFailEmail = async function (currentOrg) {
  try {
    let charge = currentOrg.charge;
    
    const email = {
      from: periodic.settings.periodic.emails.server_from_address,
      // to: 'mark@digifi.io',
      to: currentOrg.adminUsers.join(', '),
      bcc: periodic.settings.periodic.emails.notification_address,
      subject: 'DigiFi Payment Unsuccessful',
      generateTextFromHTML: true,
      emailtemplatefilepath: path.resolve(periodic.config.app_root, 'content/container/decision-engine-service-container/utilities/views/email/unsuccessful_charge.ejs'),
      emailtemplatedata: {
        appname: periodic.settings.name,
        hostname: periodic.settings.application.hostname || periodic.settings.name,
        basepath: '/company-settings/account/billing',
        url: periodic.settings.application.url,
        protocol: periodic.settings.application.protocol,
        amount_paid: Numeral(charge.amount / 100).format('$0,0.00'),
        fees: Numeral(fees).format('$0,0.00'),
        date_paid: moment().format('L'),
        total_tax_owed: Numeral(currentOrg.total_tax_owed).format('$0,0.00'),
        payment_method: `${charge.source.card.brand} - ${charge.source.card.last4}`,
      },
    };
    let sendEmail = await periodic.core.mailer.sendEmail(email);
    return sendEmail;
  } catch (err) {
    console.log({ err, });
  }
};

const updateOrganizations = async function (organizations) {
  for (var org in organizations) {
    organizations[ org ].transaction = await Organization.update({
      id: org,
      updatedoc: {
        billing: {
          balance: 0,
        },
      },
      isPatch: true,
    });
  }
}; 

const mainFunc = async function (req, res, next) {
  try {
    let allOrgs = await getAllOrgs();
    let filteredOrgs = await filterOrgsByBalanceAndIncrement(allOrgs);
    let organizationsWithOwners = await getOrganizationOwners(filteredOrgs);
    let orgsWithTaxBreakdown = await calculateTaxesForOrg(organizationsWithOwners);
    let orgsWithStripe = await getStripeCustomers(orgsWithTaxBreakdown);
    let orgsWithCharge = await chargeCards(orgsWithStripe);
    let orgsWithInvoices = await createInvoices(orgsWithCharge)
    let orgsWithTransactions = await createTransactions(orgsWithCharge);
    let updatedTransactions = await updateTransactions(orgsWithTransactions);
    let orgsAfterEmails = await sendEmails(orgsWithTransactions);
    let updatedOrgs = await updateOrganizations(orgsAfterEmails);
    console.log('Email Cron Ran');
    if (next) return next();
  } catch (err) {
    let fullErr = JSON.stringify(err, null, 2)
    console.log({ fullErr, });
    return false
  }

};

var initialize = function (resources) {
  periodic = resources;
  stripeToken = periodic.settings.container[ 'decision-engine-service-container' ].stripe.token;
  stripe = require('stripe')(stripeToken);
  Invoice = periodic.datas.get('standard_invoice');
  Organization = periodic.datas.get('standard_organization');
  Transaction = periodic.datas.get('standard_transaction');
  User = periodic.datas.get('standard_user');
  return mainFunc;
};

module.exports = initialize;

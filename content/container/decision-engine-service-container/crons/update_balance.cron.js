'use strict';
let periodic;
let organization;
let transaction;
let orgIds;

const getAllOrgs = async function () {
  try {
    let orgs = await organization.model.find({});
    return orgs;
  } catch (err) {
    console.log({ err, });
  }
};

const updateOrg = async function (orgId, balance) {
  let updatedOrg = await organization.update({
    id: orgId,
    updatedoc: {
      billing: {
        balance,
      },
    },
    isPatch: true,
  });
  return updatedOrg;
};

const mainFunc = async function (options) {
  try {
    let allOrgs = await getAllOrgs();
    if (allOrgs) {
      orgIds = allOrgs.map(org => {
        return org._id;
      });

      let transactionsByOrg = await transaction.model.aggregate([
        {
          $group:
            {
              _id: '$organization',
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
        },
      ]);
      let orgBalances = transactionsByOrg.reduce((balances, org) => {
        if (org._id) {
          let sum = org.total;
          balances[ org._id ] = Number(sum.toFixed(2));
        }
        return balances;
      }, {});
      allOrgs.forEach(org => {
        if (org.billing && org.billing.balance === orgBalances[ org._id ]) {
          delete orgBalances[ org._id ]
        }
      });
      let updatedOrgs = await orgIds.map(async orgId => {
        if (orgBalances[ orgId ]) {
          let updatedOrg = await updateOrg(orgId, orgBalances[ orgId ]);
          return updatedOrg;
        }
      });
    }
  } catch (err) {
    console.log({ err });
  }
};

var initialize = function (resources) {
  periodic = resources;
  organization = periodic.datas.get('standard_organization');
  transaction = periodic.datas.get('standard_transaction');
  return mainFunc;
};

module.exports = initialize;
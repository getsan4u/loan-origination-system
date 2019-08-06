'use strict';
const moment = require('moment');
let periodic;
let organization;
let transaction;

const getAllOrgs = async function () {
  try {
    let orgs = await organization.model.find({});
    return orgs;
  } catch (err) {
    console.log({ err, });
  }
};

const updateOrg = async function (orgId, txcount) {
  let updatedOrg = await organization.update({
    id: orgId,
    updatedoc: {
      billing: {
        transaction_count: txcount,
      },
    },
    isPatch: true,
  });
  return updatedOrg;
};


const mainFunc = async function () {
  try {
    let allOrgs = await getAllOrgs();
    let orgMap = {};
    let orgIds;
    if (allOrgs) {
      orgIds = allOrgs.map(org => {
        let orgId = org._id.toString();
        orgMap[ orgId ] = org;
        return org._id;
      });

      let startOfMonth = moment().startOf('month').utcOffset('-4:00').toDate();
      let endOfMonth = moment().endOf('month').utcOffset('-4:00').toDate();

      let transactionsByOrg = await transaction.model.aggregate([
        {
          $match: {
            createdat: { $gte: startOfMonth, $lte: endOfMonth, },
          },  
        },
        {
          $group:
            {
              _id: '$organization',
              count: { $sum: 1, },
            },
        },
      ]);

      transactionsByOrg.forEach(async org => {
        let OrgTxCount = org.count;
        let fullOrg = orgMap[ org._id ];
        if (fullOrg && fullOrg.billing && (fullOrg.billing.transaction_count === OrgTxCount)) {
          return false;
        } else {
          let updatedOrg = await updateOrg(org._id, OrgTxCount);
        }
      });
    }
  } catch (err) {
    console.log({ err, });
  }
};

var initialize = function (resources) {
  periodic = resources;
  organization = periodic.datas.get('standard_organization');
  transaction = periodic.datas.get('standard_transaction');
  return mainFunc;
};

module.exports = initialize;
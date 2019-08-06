'use strict';

const numeral = require('numeral');
const capitalize = require('capitalize');

/**
 * Formats users on organization.
 * @param {object} req express request object
 * @returns {promise} a promise that resolves a modified request object
 */
function formatUsers(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      req.controllerData.org.association.users = req.controllerData.org.association.users.map(user => {
        user.type = user.userroles[ 0 ].title[ 0 ].toUpperCase() + user.userroles[ 0 ].title.slice(1);
        user.status.mfa = user.status.mfa ? 'Enabled' : 'Disabled';
        user.status.active = user.status.active ? 'Active' : 'Inactive';
        user.status.email_verified = user.status.email_verified ? 'Yes' : 'No';
        return user;
      });
      req.controllerData.org.numUsers = numeral(req.controllerData.org.association.users.length).format('0,0');
      resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

function formatActivityLogs(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData.rows = [];
      req.controllerData.numItems = 0;
      req.controllerData.numPages = 0;
      if (req.controllerData && req.controllerData.data && req.query.paginate) {
        if (req.controllerData.data && req.controllerData.data[ '0' ] && req.controllerData.data[ '0' ].documents) req.controllerData.rows = req.controllerData.data[ '0' ].documents.map(log => {
          log = log.toJSON ? log.toJSON() : log;
          if (!isNaN(log.ai_model_count) && !isNaN(log.overall_count)) log.ai_model_count = Number(log.ai_model_count) * Number(log.overall_count);
          log.strategy_status = log.strategy_status === null ? 'Inactive' : capitalize.words(log.strategy_status);
          return log;
        });
        req.controllerData.numItems = req.controllerData.data.collection_count;
        req.controllerData.numPages = req.controllerData.data.collection_pages;
      } else if (req.controllerData && req.controllerData.data && req.query.export_format) {
        req.controllerData.rows = req.controllerData.data.map(log => {
          log = log.toJSON ? log.toJSON() : log;
          if (!isNaN(log.ai_model_count) && !isNaN(log.overall_count)) log.ai_model_count = Number(log.ai_model_count) * Number(log.overall_count);
          log.date = log.createdat;
          log.number_of_decisions = log.overall_count;
          log.number_of_ai_predictions = log.ai_model_count;
          log.request_status = log.status_code;
          log.strategy_status = log.strategy_status === null ? 'Inactive' : capitalize.words(log.strategy_status);
          log.type = (log.type === 'Simulation') ? 'Online' : log.type;
          return log;
        });
        req.controllerData.headers = [ 'date', 'request_id', 'type', 'strategy_name', 'strategy_version', 'strategy_status', 'number_of_decisions', 'number_of_ai_predictions', 'request_status', ];
        req.controllerData.filename = `${(req.controllerData.organization)?req.controllerData.organization.name : ''}-activity-logs`;
      }
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

function stageInfoForUpdate(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      let { org } = req.controllerData;
      let rb = req.body;
      if (org && rb) {
        let updatedAddress = {
          street: (rb.street_address) ? rb.street_address : '',
          city: (rb.city) ? rb.city : '',
          state: (rb.state) ? rb.state :  '',
          postal_code: (rb.postal_code) ? rb.postal_code : '',
        }
        req.controllerData.org = Object.assign({}, org, { address: updatedAddress });
      }
      delete req.controllerData.org.association;
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

module.exports = {
  formatUsers,
  formatActivityLogs,
  stageInfoForUpdate,
};

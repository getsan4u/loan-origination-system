'use strict';

/**
 * Formats user.
 * @param {object} req express request object
 * @returns {promise} a promise that resolves a modified request object
 */
async function formatUser(req) {
  try {
    req.controllerData = req.controllerData || {};
    let user = req.controllerData.user;
    user.active = user.status.active ? 'Yes' : 'No';
    user.mfa = user.status.mfa ? 'Enabled' : 'Disabled';
    user.active = user.status.active ? 'Active' : 'Inactive';
    user.type = user.userroles[ 0 ].title;
    return req;
  } catch (err) {
    req.error = err;
    return req;
  }
}

/**
 * Formats user.
 * @param {object} req express request object
 * @returns {promise} a promise that resolves a modified request object
 */
async function lowercaseEmail(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.body.username = req.body.username.toLowerCase();
    return req;
  } catch (err) {
    req.error = err;
    return req;
  }
}

module.exports = {
  formatUser,
  lowercaseEmail,
};

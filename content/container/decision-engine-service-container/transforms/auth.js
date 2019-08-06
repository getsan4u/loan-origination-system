'use strict'

/** Transform functions for auth */

/**
 * Converts email to lowercase.
 * @param {object} req express request object
 * @returns {promise} a promise that resolves a modified request object
 */
function transformEmailtoLowerCase(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.body) {
        if (typeof req.body === 'string') req.body = JSON.parse(req.body);
        req.body.username = req.body.username ? req.body.username.toLowerCase() : null;
      }
      resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Adds email to body.
 * @param {object} req express request object
 * @returns {promise} a promise that resolves a modified request object
 */
function addEmailToBody(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.user && req.user.email) {
        req.body = {
          username: req.user.email,
        };
      }
      resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Put token on controllerData for submit button on enter new password form.
 * @param {object} req express request object
 * @returns {promise} a promise that resolves a modified request object
 */
function putTokenOnForm(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.params && req.params.token) {
        req.controllerData = req.controllerData || {};
        req.controllerData.token = req.params.token;
        req.body.confirmpassword = req.body.password;
      }
      resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Sets confirmpassword to equal password.
 * @param {object} req express request object
 * @returns {promise} a promise that resolves a modified request object
 */
function confirmPassword(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.body && req.body.password) {
        req.body.confirmpassword = req.body.password;
      }
      resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Add MFA code success notification message to req.controllerData.
 * @param {object} req express request object
 * @returns {promise} a promise that resolves a modified request object
 */
function resendMFAMessage(req) {
  return new Promise((resolve, reject) => {
    try {
      req.controllerData = req.controllerData || {};
      if (req.user && req.user.phone) {
        req.controllerData = Object.assign({}, req.controllerData, {
          status: 200,
          result: 'success',
          type: 'success',
          text: `Code sent to (xxx)-xxx-${req.user.phone.slice(-4)}.`,
          timeout: 10000,
        });
      }
      resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

async function orgTrimWhitespace(req) {
  try {
    if (req.body && req.body.name) {
      req.body.name = (req.body.name) ? req.body.name.replace(/[ \s]+$/gi, '') : null;
    }
    return req;
  } catch (err) {
    return Promise.reject(err);
  }
}

module.exports = {
  transformEmailtoLowerCase,
  addEmailToBody,
  putTokenOnForm,
  confirmPassword,
  resendMFAMessage,
  orgTrimWhitespace
};
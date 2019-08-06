'use strict';

/** Middleware for client. Used for storing client_id and secrets */

const periodic = require('periodicjs');
const logger = periodic.logger;
const utilities = require('../utilities');
const helpers = utilities.helpers;
const passportSettings = periodic.settings.extensions[ 'periodicjs.ext.passport' ];
const passportUtilities = periodic.locals.extensions.get('periodicjs.ext.passport');
const routeUtils = periodic.utilities.routing;
const utilControllers = utilities.controllers;

/**
 * Create a new organization.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function createClient(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Client = periodic.datas.get('standard_client');
  utilControllers.auth.generateCredential(req.body)
    .then(credentials => {
      let credential = {
        client_id: credentials[ 0 ],
        public_key: credentials[ 1 ],
        client_secret: credentials[ 2 ],
        client_secret_2: credentials[ 3 ],
      };
      return Client.create({ newdoc: Object.assign({}, credential, { name: req.controllerData.org.name, 'association.organization': req.controllerData.org._id, }), });
    })
    .then(client => {
      req.controllerData.client = Object.assign({}, client._doc);
      next();
    })
    .catch(err => {
      logger.error('Unable to create new client', err);
      next(err);
    });
}

/**
 * Updates client based on req.controllerData.client.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
function updateClient(req, res, next) {
  req.controllerData = req.controllerData || {};
  const Client = periodic.datas.get('standard_client');
  Client.update({
    id: req.controllerData.client._id.toString(),
    updatedoc: req.controllerData.client,
    isPatch: true,
  })
    .then(() => {
      next();
    })
    .catch(err => {
      logger.error('Unable to update client', err);
      next(err);
    });
}

/**
 * Get client based on organization.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @param {function} next express next function
 */
async function getClientByOrg(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Client = periodic.datas.get('standard_client');
    let client = await Client.load({ query: { association: { organization: req.user.association.organization._id, }, }, });
    client = client.toJSON ? client.toJSON() : client;
    req.controllerData.client = client;
    return next();
  } catch (err) {
    logger.error('Unable to get client', err);
    return next(err);
  }
}

module.exports = {
  createClient,
  updateClient,
  getClientByOrg,
};
'use strict';

/** Routes for Payment */

const periodic = require('periodicjs');
const controllers = require('../controllers');
const transformController = controllers.transform;
const authController = controllers.auth;
const paymentController = controllers.payment;
const organizationController = controllers.organization;
const PaymentRouter = periodic.express.Router();
const ensureApiAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.ensureApiAuthenticated;

PaymentRouter.post('/addPaymentMethod',
  ensureApiAuthenticated,
  organizationController.getOrg,
  paymentController.getCustomer,
  paymentController.createCustomer,
  paymentController.addOrgAddress,
  organizationController.updateOrg,
  paymentController.createPaymentMethod,
  paymentController.updateCustomer,
  authController.handleControllerDataResponse);

PaymentRouter.get('/getCustomer',
  ensureApiAuthenticated,
  organizationController.getOrg,
  paymentController.getCustomer,
  paymentController.getTransactions,
  transformController.posttransform,
  authController.handleControllerDataResponse);

PaymentRouter.get('/getTransactions',
  ensureApiAuthenticated,
  organizationController.getOrg,
  paymentController.getTransactions,
  // transformController.posttransform,
  authController.handleControllerDataResponse);

PaymentRouter.get('/downloadTransactions',
  ensureApiAuthenticated,
  organizationController.getOrg,
  paymentController.getTransactions,
  transformController.posttransform,
  paymentController.downloadCSV,
  authController.handleControllerDataResponse);  

module.exports = PaymentRouter;
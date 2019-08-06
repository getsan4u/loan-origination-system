'use strict';
//ROUTER ONLY USED IN DEV ENVIRONMENTS
const periodic = require('periodicjs');
const EmailRouter = periodic.express.Router();
const controllers = require('../controllers');
const emailController = controllers.email;
const authController = controllers.auth;

EmailRouter.post('/send',
  emailController.sendEmail,
  authController.handleControllerDataResponse);


module.exports = EmailRouter;
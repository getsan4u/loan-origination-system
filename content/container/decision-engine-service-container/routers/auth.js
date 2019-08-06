'use strict';

/** Routes for login/authentication purposes. */

const periodic = require('periodicjs');
const controllers = require('../controllers');
const transformController = controllers.transform;
const authController = controllers.auth;
const clientController = controllers.client;
const userController = controllers.user;
const paymentController = controllers.payment;
const organizationController = controllers.organization;
const AuthRouter = periodic.express.Router();
const ensureApiAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.ensureApiAuthenticated;

AuthRouter.post('/login',
  transformController.pretransform,
  authController.checkSuperAdmin,
  authController.getJWTtoken,
);

AuthRouter.get('/success',
  authController.handleControllerDataResponse);

AuthRouter.get('/unsubscribe/:email',
  userController.getUsersFromParams,
  userController.unsubscribeUsers,
  authController.handleControllerDataResponse);

AuthRouter.get('/checkdigifisupport',
  ensureApiAuthenticated,
  authController.checkDigifiSupport,
  authController.handleControllerDataResponse);

AuthRouter.get('/run_checks',
  ensureApiAuthenticated,
  authController.checkLogin, //check for multiple logins and also user inactivity
  authController.checkStatus,
  authController.getUserPrivilegeCode,
  authController.handleControllerDataResponse);

AuthRouter.get('/show_homepage',
  ensureApiAuthenticated,
  organizationController.getOrg,
  authController.populateHomepage,
  authController.handleControllerDataResponse);

AuthRouter.get('/product_page',
  ensureApiAuthenticated,
  organizationController.getOrg,
  authController.populateProductpage,
  authController.handleControllerDataResponse);

AuthRouter.get('/complete_registration',
  authController.findUserByActivationToken,
  authController.completeRegistration,
  authController.setEmailVerify,
  userController.sendWelcomeEmail,
  authController.redirectHomePage);

AuthRouter.get('/reset_token/:token', //pretransform puts token on the enter new password form.
  transformController.pretransform,
  authController.handleControllerDataResponse);

AuthRouter.post('/organization/new',
  transformController.pretransform, //transform email to lowercase
  authController.findOrCreateUserPrivilegesAndRoles,
  authController.checkOrgExists,
  authController.blockProtectedUsernames,
  userController.createUser,
  organizationController.createOrg,
  clientController.createClient,
  userController.activateUser,
  userController.updateUser,
  // paymentController.addTrialCredit,
  organizationController.activateOrg,
  organizationController.updateOrg,
  organizationController.seedNewOrganization,
  organizationController.createLosDependencies,
  organizationController.sendCreateOrgResponse);

AuthRouter.post('/forgot_password',
  transformController.pretransform,
  authController.forgot,
  authController.handleControllerDataResponse);

AuthRouter.post('/recover_organization',
  transformController.pretransform,
  authController.recoverOrganizations,
  authController.sendOrganizationRecoveryEmail,
  authController.handleControllerDataResponse);

AuthRouter.post('/reset_password/:token',
  transformController.pretransform,
  authController.resetPassword,
  authController.handleControllerDataResponse);

AuthRouter.post('/register_new_user',
  userController.completeNewUser,
  userController.updateUser,
  userController.sendWelcomeEmail,
  authController.loginNewUser);

AuthRouter.post('/verify_password', //used for modals
  ensureApiAuthenticated,
  authController.verifyPassword,
  authController.handleControllerDataResponse);

AuthRouter.post('/verify_password_and_disable_mfa',
  ensureApiAuthenticated,
  authController.verifyPassword,
  userController.disableMFA,
  userController.updateUser,
  authController.handleControllerDataResponse);

AuthRouter.post('/generate_api_credentials',
  ensureApiAuthenticated,
  authController.adminOnly,
  authController.generateNewCredentials,
  clientController.updateClient,
  authController.handleControllerDataResponse);

AuthRouter.post('/change_email',
  ensureApiAuthenticated,
  transformController.pretransform, //transform email to lowercase
  organizationController.getOrg,
  authController.checkEmailExists,
  userController.changeEmail,
  userController.updateUser,
  authController.handleControllerDataResponse);

AuthRouter.post('/resend_email',
  ensureApiAuthenticated,
  transformController.pretransform, //add email to body
  userController.changeEmail,
  userController.updateUser,
  authController.handleControllerDataResponse);

AuthRouter.post('/register_session', //hits path on login; used for setting the session on Redis
  organizationController.getOrg,
  authController.putSessionOnRedis,
  authController.checkMFA, // if mfa is not enabled, send back req.controllerData.
  authController.sendMFACode,
  authController.storeMFACodeOnRedis,
  authController.handleControllerDataResponse);

AuthRouter.post('/mfa_phone',  
  ensureApiAuthenticated,
  userController.addPhoneNumber,
  userController.updateUser,
  authController.sendMFACode,
  authController.storeMFACodeOnRedis,
  authController.handleControllerDataResponse);

AuthRouter.post('/resend_mfa_phone',  
  ensureApiAuthenticated,
  authController.sendMFACode,
  authController.storeMFACodeOnRedis,
  transformController.posttransform, // add notification message to req.controllerData
  authController.handleControllerDataResponse);

AuthRouter.post('/verify_mfa_code', //used for enabling MFA
  ensureApiAuthenticated,
  authController.verifyMFACode,
  userController.updateUser,
  authController.handleControllerDataResponse);

AuthRouter.post('/validate_mfa', //used for validating MFA code on login
  ensureApiAuthenticated,
  authController.verifyMFACode,
  authController.handleControllerDataResponse);

AuthRouter.put('/update_product',
  ensureApiAuthenticated,
  organizationController.getOrg,
  authController.toggleProductStatus,
  organizationController.updateOrg,
  authController.handleControllerDataResponse);



module.exports = AuthRouter;
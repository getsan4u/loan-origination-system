'use strict';

/** Routes for user */

const periodic = require('periodicjs');
const controllers = require('../controllers');
const transformController = controllers.transform;
const authController = controllers.auth;
const userController = controllers.user;
const organizationController = controllers.organization;
const UserRouter = periodic.express.Router();
const ensureApiAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.ensureApiAuthenticated;

UserRouter.delete('/delete_user/:id',
  ensureApiAuthenticated,  
  authController.adminOnly,
  userController.deleteUser,
  authController.handleControllerDataResponse);

UserRouter.put('/update_user/:id',
  ensureApiAuthenticated,
  userController.getUser,
  userController.checkUpdateUser,
  transformController.pretransform,
  organizationController.getOrg,
  organizationController.putUserroleOnOrg,
  userController.checkUserrole,
  userController.getUserrole, // use for changing user type
  userController.putFormOnUser, // use for changing first name, last name and mfa
  userController.formatUser,
  userController.updateUser,
  userController.sendUpdateUserResponse,
  authController.handleControllerDataResponse);

UserRouter.post('/check_deleted_user/:id',
  ensureApiAuthenticated,  
  userController.checkDeletedUser,
  authController.handleControllerDataResponse);

UserRouter.post('/new_user',
  ensureApiAuthenticated,
  authController.adminOnly,
  organizationController.getOrg,
  transformController.pretransform, //transform email to lowercase
  authController.blockProtectedUsernames,
  authController.checkEmailExists,
  userController.getUserrole,
  userController.setupNewUser,
  userController.linkNewUserOrg,
  organizationController.updateOrg,
  authController.handleControllerDataResponse);

UserRouter.post('/resend_invitation_email/:id',
  ensureApiAuthenticated,
  authController.adminOnly,
  organizationController.getOrg,
  userController.getUser,
  userController.resendInvitiationEmail);

UserRouter.post('/check_number_of_users',
  ensureApiAuthenticated,
  userController.checkNumUsers,
  authController.handleControllerDataResponse);

UserRouter.get('/get_user_info/:id',
  ensureApiAuthenticated,
  userController.getUser,
  transformController.pretransform,
  userController.deleteUserModal,
  userController.createModalForm,
  authController.handleControllerDataResponse);

UserRouter.get('/get_user_info',
  ensureApiAuthenticated,
  userController.getUser,
  transformController.pretransform,
  userController.mfaPhoneText,
  authController.handleControllerDataResponse);

module.exports = UserRouter;
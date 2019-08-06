'use strict';

/** Routes for organization */

const periodic = require('periodicjs');
const controllers = require('../controllers');
const transformController = controllers.transform;
const authController = controllers.auth;
const organizationController = controllers.organization;
const OrganizationRouter = periodic.express.Router();
const ensureApiAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.ensureApiAuthenticated;

OrganizationRouter.get('/get_general_info',
  ensureApiAuthenticated,  
  organizationController.getGeneralInfo,
  authController.handleControllerDataResponse);

OrganizationRouter.get('/get_org',
  ensureApiAuthenticated,  
  organizationController.getOrg,
  organizationController.putUserroleOnOrg,
  transformController.posttransform,
  authController.handleControllerDataResponse);

OrganizationRouter.put('/edit_general_info',
  ensureApiAuthenticated,
  authController.checkOrgExists,
  transformController.pretransform,
  organizationController.editGeneralInfo,
  authController.handleControllerDataResponse);

OrganizationRouter.put('/update_org_info',
  ensureApiAuthenticated,
  organizationController.getOrg,
  transformController.pretransform,
  organizationController.updateOrg,
  authController.handleControllerDataResponse);

OrganizationRouter.get('/get_activity_log',
  ensureApiAuthenticated,
  authController.checkOrgExists,
  organizationController.getActivityLogs,
  transformController.posttransform,
  authController.handleControllerDataResponse);

OrganizationRouter.get('/:id/download_activity_log',
  ensureApiAuthenticated,
  authController.adminOnly,
  organizationController.loadOrg,
  organizationController.getActivityLogs,
  transformController.posttransform,
  organizationController.downloadJSONToCSV);

module.exports = OrganizationRouter;
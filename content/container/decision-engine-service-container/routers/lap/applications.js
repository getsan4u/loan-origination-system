'use strict';

/** Routes for login/authentication purposes. */

const periodic = require('periodicjs');
const controllers = require('../../controllers');
const ApplicationController = controllers.lap.ApplicationController;
const ProductController = controllers.lap.ProductController;
const StatusController = controllers.lap.StatusController;
const PersonController = controllers.lap.PersonController;
const CompanyController = controllers.lap.CompanyController;
const IntermediaryController = controllers.lap.IntermediaryController;
const LabelController = controllers.lap.LabelController;
const TeamMemberController = controllers.lap.TeamMemberController;
const authController = controllers.auth;
const transformController = controllers.transform;
const isClientAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.isClientAuthenticated;
const ApplicationRouter = periodic.express.Router();

/**
 * Create Application
 */
ApplicationRouter.post('/',
  isClientAuthenticated,
  ProductController.getAllProductsForOrganizationByName,
  StatusController.getAllStatusesForOrganizationByName,
  PersonController.getAllPeopleForOrganization,
  CompanyController.getAllCompaniesForOrganization,
  IntermediaryController.getAllIntermediariesForOrganizationByName,
  LabelController.getAllLabelsForOrganizationByName,
  TeamMemberController.getAllTeamMembersForOrganizationByName,
  transformController.pretransform,
  ApplicationController.createApplication,
  transformController.posttransform,
  authController.handleControllerDataResponse,
);

/**
 * Get Application by Customer ID
 */
ApplicationRouter.get('/search',
  isClientAuthenticated,
  ApplicationController.getApplicationByCustomer,
  transformController.posttransform,
  authController.handleControllerDataResponse,
);

/**
 * Get Application
 */
ApplicationRouter.get('/:id',
  isClientAuthenticated,
  transformController.pretransform,
  ApplicationController.getApplication,
  transformController.posttransform,
  authController.handleControllerDataResponse,
);

/**
 * Update Application
 */
ApplicationRouter.put('/:id',
  isClientAuthenticated,
  ProductController.getAllProductsForOrganizationByName,
  StatusController.getAllStatusesForOrganizationByName,
  PersonController.getAllPeopleForOrganization,
  CompanyController.getAllCompaniesForOrganization,
  LabelController.getAllLabelsForOrganizationByName,
  TeamMemberController.getAllTeamMembersForOrganizationByName,
  IntermediaryController.getAllIntermediariesForOrganizationByName,
  ApplicationController.getApplication,
  transformController.pretransform,
  ApplicationController.updateApplication,
  transformController.posttransform,
  authController.handleControllerDataResponse,
);

/**
 * Delete Application
 */
ApplicationRouter.delete('/:id',
  isClientAuthenticated,
  transformController.pretransform,
  ApplicationController.deleteApplication,
  transformController.posttransform,
  authController.handleControllerDataResponse,
);

module.exports = ApplicationRouter;

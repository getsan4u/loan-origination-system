'use strict';

/** Routes for login/authentication purposes. */

const periodic = require('periodicjs');
const controllers = require('../../controllers');
const CompanyController = controllers.lap.CompanyController;
const PersonController = controllers.lap.PersonController;
const CustomerTemplateController = controllers.lap.CustomerTemplateController;
const transformController = controllers.transform;
const authController = controllers.auth;
const isClientAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.isClientAuthenticated;
const CompanyRouter = periodic.express.Router();

/**
 * Create Compnay
 */
CompanyRouter.post('/',
  isClientAuthenticated,
  PersonController.getAllPeopleForOrganization,
  CustomerTemplateController.getAllCustomerTemplateForOrganizationByType,
  transformController.pretransform,
  CompanyController.createCompany,
  transformController.posttransform,
  authController.handleControllerDataResponse
);

/**
 * Search for Person
 */
CompanyRouter.get('/search',
  isClientAuthenticated,
  transformController.pretransform,
  CompanyController.findCompanyByEIN,
  transformController.posttransform,
  authController.handleControllerDataResponse
);

/**
 * Get Company
 */
CompanyRouter.get('/:id',
  isClientAuthenticated,
  transformController.pretransform,
  CompanyController.getCompany,
  transformController.posttransform,
  authController.handleControllerDataResponse
);

/**
 * Update Company
 */
CompanyRouter.put('/:id',
  isClientAuthenticated,
  CompanyController.getCompany,
  PersonController.getAllPeopleForOrganization,
  transformController.pretransform,
  CompanyController.updateCompany,
  transformController.posttransform,
  authController.handleControllerDataResponse
);

/**
 * Delete Company
 */
CompanyRouter.delete('/:id',
  isClientAuthenticated,
  transformController.pretransform,
  CompanyController.deleteCompany,
  transformController.posttransform,
  authController.handleControllerDataResponse
);


module.exports = CompanyRouter;

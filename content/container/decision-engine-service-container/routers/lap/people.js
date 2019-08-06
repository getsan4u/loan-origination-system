'use strict';

/** Routes for login/authentication purposes. */

const periodic = require('periodicjs');
const controllers = require('../../controllers');
const APIController = controllers.api;
const PersonController = controllers.lap.PersonController;
const CompanyController = controllers.lap.CompanyController;
const CustomerTemplateController = controllers.lap.CustomerTemplateController;
const transformController = controllers.transform;
const isClientAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.isClientAuthenticated;
const PersonRouter = periodic.express.Router();

/**
 * Create Person
 */
PersonRouter.post('/',
  isClientAuthenticated,
  CompanyController.getAllCompaniesForOrganization,
  CustomerTemplateController.getAllCustomerTemplateForOrganizationByType,
  transformController.pretransform,
  PersonController.createPerson,
  transformController.posttransform,
  APIController.LAPAPIResponse
);

/**
 * Search for Person
 */
PersonRouter.get('/search',
  isClientAuthenticated,
  transformController.pretransform,
  PersonController.findPersonByEmail,
  transformController.posttransform,
  APIController.LAPAPIResponse
);

/**
 * Get Person
 */
PersonRouter.get('/:id',
  isClientAuthenticated,
  transformController.pretransform,
  PersonController.getPerson,
  transformController.posttransform,
  APIController.LAPAPIResponse
);

/**
 * Update Person
 */
PersonRouter.put('/:id',
  isClientAuthenticated,
  PersonController.getPerson,
  CompanyController.getAllCompaniesForOrganization,
  transformController.pretransform,
  PersonController.updatePerson,
  transformController.posttransform,
  APIController.LAPAPIResponse
);

/**
 * Delete Person
 */
PersonRouter.delete('/:id',
  isClientAuthenticated,
  transformController.pretransform,
  PersonController.deletePerson,
  transformController.posttransform,
  APIController.LAPAPIResponse
);


module.exports = PersonRouter;

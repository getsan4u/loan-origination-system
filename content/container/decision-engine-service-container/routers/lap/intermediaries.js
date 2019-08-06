'use strict';

/** Routes for login/authentication purposes. */

const periodic = require('periodicjs');
const controllers = require('../../controllers');
const APIController = controllers.api;
const IntermediaryController = controllers.lap.IntermediaryController;
const PersonController = controllers.lap.PersonController;
const CompanyController = controllers.lap.CompanyController;
const ApplicationController = controllers.lap.ApplicationController;
const transformController = controllers.transform;
const isClientAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.isClientAuthenticated;
const IntermediaryRouter = periodic.express.Router();

/**
 * Create Intermediary
 */
IntermediaryRouter.post('/',
  isClientAuthenticated,
  transformController.pretransform,
  IntermediaryController.createIntermediary,
  transformController.posttransform,
  APIController.LAPAPIResponse
);

/**
 * Search for Intermediary
 */
IntermediaryRouter.get('/search',
  isClientAuthenticated,
  transformController.pretransform,
  IntermediaryController.searchIntermediaries,
  transformController.posttransform,
  APIController.LAPAPIResponse
);

/**
 * Get Intermediary
 */
IntermediaryRouter.get('/:id',
  isClientAuthenticated,
  transformController.pretransform,
  IntermediaryController.getIntermediary,
  transformController.posttransform,
  APIController.LAPAPIResponse
);

/**
 * Update Intermediary
 */
IntermediaryRouter.put('/:id',
  isClientAuthenticated,
  IntermediaryController.getIntermediary,
  PersonController.getAllPeopleForOrganization,
  transformController.pretransform,
  IntermediaryController.updateIntermediary,
  transformController.posttransform,
  APIController.LAPAPIResponse
);

/**
 * Delete Intermediary
 */
IntermediaryRouter.delete('/:id',
  isClientAuthenticated,
  transformController.pretransform,
  IntermediaryController.deleteIntermediary,
  transformController.posttransform,
  APIController.LAPAPIResponse
);


module.exports = IntermediaryRouter;

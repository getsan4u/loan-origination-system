'use strict';

/** Routes for login/authentication purposes. */

const periodic = require('periodicjs');
const controllers = require('../../controllers');
const APIController = controllers.api;
const CommunicationController = controllers.lap.CommunicationController;
const PersonController = controllers.lap.PersonController;
const CompanyController = controllers.lap.CompanyController;
const ApplicationController = controllers.lap.ApplicationController;
const TeamMemberController = controllers.lap.TeamMemberController;
const transformController = controllers.transform;
const isClientAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.isClientAuthenticated;
const CommunicationRouter = periodic.express.Router();

/**
 * Create Communication
 */
CommunicationRouter.post('/',
  isClientAuthenticated,
  transformController.pretransform,
  CommunicationController.createCommunication,
  transformController.posttransform,
  APIController.LAPAPIResponse
);

/**
 * Search for Communication
 */
CommunicationRouter.get('/search',
  isClientAuthenticated,
  transformController.pretransform,
  CommunicationController.searchCommunications,
  transformController.posttransform,
  APIController.LAPAPIResponse
);

/**
 * Get Communication
 */
CommunicationRouter.get('/:id',
  isClientAuthenticated,
  transformController.pretransform,
  CommunicationController.getCommunication,
  transformController.posttransform,
  APIController.LAPAPIResponse
);

/**
 * Update Communication
 */
CommunicationRouter.put('/:id',
  isClientAuthenticated,
  CommunicationController.getCommunication,
  TeamMemberController.getAllTeamMembersForOrganizationByName,
  transformController.pretransform,
  CommunicationController.updateCommunication,
  transformController.posttransform,
  APIController.LAPAPIResponse
);

/**
 * Delete Communication
 */
CommunicationRouter.delete('/:id',
  isClientAuthenticated,
  transformController.pretransform,
  CommunicationController.deleteCommunication,
  transformController.posttransform,
  APIController.LAPAPIResponse
);


module.exports = CommunicationRouter;

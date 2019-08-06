'use strict';

/** Routes for login/authentication purposes. */

const periodic = require('periodicjs');
const controllers = require('../../controllers');
const APIController = controllers.api;
const TaskController = controllers.lap.TaskController;
const PersonController = controllers.lap.PersonController;
const CompanyController = controllers.lap.CompanyController;
const ApplicationController = controllers.lap.ApplicationController;
const TeamMemberController = controllers.lap.TeamMemberController;
const transformController = controllers.transform;
const isClientAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.isClientAuthenticated;
const TaskRouter = periodic.express.Router();

/**
 * Create Task
 */
TaskRouter.post('/',
  isClientAuthenticated,
  transformController.pretransform,
  TaskController.createTask,
  transformController.posttransform,
  APIController.LAPAPIResponse
);

/**
 * Search for Task
 */
TaskRouter.get('/search',
  isClientAuthenticated,
  transformController.pretransform,
  TaskController.searchTasks,
  transformController.posttransform,
  APIController.LAPAPIResponse
);

/**
 * Get Task
 */
TaskRouter.get('/:id',
  isClientAuthenticated,
  transformController.pretransform,
  TaskController.getTask,
  transformController.posttransform,
  APIController.LAPAPIResponse
);

/**
 * Update Task
 */
TaskRouter.put('/:id',
  isClientAuthenticated,
  TaskController.getTask,
  TeamMemberController.getAllTeamMembersForOrganizationByName,
  transformController.pretransform,
  TaskController.updateTask,
  transformController.posttransform,
  APIController.LAPAPIResponse
);

/**
 * Delete Task
 */
TaskRouter.delete('/:id',
  isClientAuthenticated,
  transformController.pretransform,
  TaskController.deleteTask,
  transformController.posttransform,
  APIController.LAPAPIResponse
);


module.exports = TaskRouter;

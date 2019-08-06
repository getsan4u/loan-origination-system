'use strict';

/** Routes for login/authentication purposes. */

const periodic = require('periodicjs');
const controllers = require('../../controllers');
const CaseController = controllers.lap.CaseController;
const ProductController = controllers.lap.ProductController;
const StatusController = controllers.lap.StatusController;
const PersonController = controllers.lap.PersonController;
const CompanyController = controllers.lap.CompanyController;
const LabelController = controllers.lap.LabelController;
const authController = controllers.auth;
const transformController = controllers.transform;
const isClientAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.isClientAuthenticated;
const CaseRouter = periodic.express.Router();

/**
 * Get Cases by Request Type
 */
CaseRouter.get('/batch/:id',
  isClientAuthenticated,
  // transformController.pretransform,
  CaseController.getBatchCase,
  transformController.posttransform,
  authController.handleControllerDataResponse,
);

CaseRouter.get('/search',
  isClientAuthenticated,
  CaseController.getCaseByApplication,
  transformController.posttransform,
  authController.handleControllerDataResponse,
);

/**
 * Get Case
 */
CaseRouter.get('/individual/:id',
  isClientAuthenticated,
  // ProductController.getAllProductsForOrganization,
  // StatusController.getAllStatusesForOrganizationByName,
  // transformController.pretransform,
  CaseController.getCase,
  transformController.posttransform,
  authController.handleControllerDataResponse,
);

/**
 * Update Case
 */
CaseRouter.put('/individual/:id',
  isClientAuthenticated,
  CaseController.getCase,
  transformController.pretransform,
  CaseController.updateCase,
  transformController.posttransform,
  authController.handleControllerDataResponse,
);

/**
 * Update Case
 */
CaseRouter.put('/batch/:id',
  isClientAuthenticated,
  CaseController.getBatchCase,
  transformController.pretransform,
  CaseController.updateBatchCase,
  transformController.posttransform,
  authController.handleControllerDataResponse,
);

/**
 * Delete Case
 */
CaseRouter.delete('/individual/:id',
  isClientAuthenticated,
  CaseController.deleteCase,
  transformController.posttransform,
  authController.handleControllerDataResponse,
);

/**
 * Delete Batch Case
 */
CaseRouter.delete('/batch/:id',
  isClientAuthenticated,
  CaseController.deleteBatchCase,
  transformController.posttransform,
  authController.handleControllerDataResponse,
);

module.exports = CaseRouter;

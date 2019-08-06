'use strict';

/** Routes for login/authentication purposes. */

const periodic = require('periodicjs');
const controllers = require('../../controllers');
const DocumentController = controllers.lap.DocumentController;
const transformController = controllers.transform;
const authController = controllers.auth;
const isClientAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.isClientAuthenticated;
const DocumentRouter = periodic.express.Router();

/** 
 * Creates document
 */
DocumentRouter.post('/',
  isClientAuthenticated,
  transformController.pretransform,
  DocumentController.getUploadedDocument,
  DocumentController.uploadDocumentToAWS,
  DocumentController.createDocument,
  transformController.posttransform,
  authController.handleControllerDataResponse
);

/**
 * Gets Documents Search By Application
 */
DocumentRouter.get('/search/:id',
  isClientAuthenticated,
  DocumentController.getDocumentsByAssociations,
  transformController.posttransform,
  authController.handleControllerDataResponse
);

/**
 * Gets Document
 */
DocumentRouter.get('/:id',
  isClientAuthenticated,
  transformController.pretransform,
  DocumentController.downloadDocument,
  transformController.posttransform,
  authController.handleControllerDataResponse
);

/**
 * Gets Document
 */
DocumentRouter.delete('/:id',
  isClientAuthenticated,
  transformController.pretransform,
  DocumentController.deleteDocument,
  transformController.posttransform,
  authController.handleControllerDataResponse
);

module.exports = DocumentRouter;
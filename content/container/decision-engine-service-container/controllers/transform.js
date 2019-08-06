'use strict';
const periodic = require('periodicjs');
const Promisie = require('promisie');
const utilities = require('../utilities');
const api_utilities = utilities.controllers.api;
const helpers = utilities.helpers;
const logger = periodic.logger;

let transforms = require('../transforms');

const transformRequest = (type) => (req, res, next) => {
  let transformType = (type === 'pre') ? transforms.pre : transforms.post;
  let transformsFilters = (transformType[req.method]) ?
    helpers.findMatchingRoute(transformType[req.method], req._parsedOriginalUrl.pathname) :
    false;
  if (transformsFilters && transformsFilters.length > 0) {
    Promisie.pipe(transformType[req.method][transformsFilters])(req)
      .then(newreq => {
        if (newreq.error) {
          if (req.is('*/xml')) {
            let xmlError = api_utilities.formatXMLErrorResponse(newreq.error);
            res.set('Content-Type', req.is('*/xml'));
            return res.status(401).send(xmlError);
          } else {
            res.status(500).send({
              result: 'error',
              data: {
                error: newreq.error,
              },
            });
          }
        } else if (!newreq.sentResponse) {
          next();
        }
      })
      .catch(err => {
        if (err) {
          logger.error('Transforms error', err);
          res.status(500).send({
            result: 'error',
            data: {
              error: JSON.stringify(err),
            },
          });
        } else {
          next();
        }
      });
  } else {
    next();
  }
};

const posttransform = transformRequest('post');
const pretransform = transformRequest('pre');
const renameEntitytype = (req, res, next) => {
  req.params.entity_type = req.params.entity_type.replace('sor_', '');
  req.params.entity_type = req.params.entity_type.replace('data', '');
  next();
};
const fixResponsePostResponse = (req, res, next) => {
  if (req.originalUrl.indexOf('/developer/contentdata/') !== -1 && Object.keys(req.controllerData.data).length===1) {
    req.controllerData.data = req.controllerData.data[ Object.keys(req.controllerData.data)[ 0 ] ];
  }
  next();
};
module.exports = {
  pretransform,
  posttransform,
  renameEntitytype,
  fixResponsePostResponse,
};
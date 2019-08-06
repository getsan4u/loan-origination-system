'use strict';

// const path = require('path');
const periodic = require('periodicjs');
const containerRouter = periodic.express.Router();
const moment = require('moment');
const reactadminController = periodic.controllers.extension.get('@digifi-los/reactapp').reactapp;
const APIRouter = require('./api');
const DecisionRouter = require('./decision');
const AuthRouter = require('./auth');
const IntegrationsRouter = require('./integrations');
const OrganizationRouter = require('./organization');
const PaymentRouter = require('./payment');
const UserRouter = require('./user');
const SimulationRouter = require('./simulation');
const OptimizationRouter = require('./optimization');
const OcrRouter = require('./ocr');
const MlRouter = require('./ml');
const LosRouter = require('./los');

//Dev Only Routers
const CronRouter = require('./cron');
const EmailRouter = require('./email');

containerRouter.use('/api', APIRouter);
containerRouter.use('/decision', DecisionRouter);
containerRouter.use('/auth', AuthRouter);
containerRouter.use('/integrations', IntegrationsRouter);
containerRouter.use('/organization', OrganizationRouter);
containerRouter.use('/payment', PaymentRouter);
containerRouter.use('/user', UserRouter);
containerRouter.use('/simulation/api', SimulationRouter);
containerRouter.use('/optimization/api', OptimizationRouter);
containerRouter.use('/ml/api', MlRouter);
containerRouter.use('/ocr/api', OcrRouter);
containerRouter.use('/los/api', LosRouter);

if (periodic.settings.application.environment === 'development' || periodic.settings.application.environment === 'dev_remote') {
  containerRouter.use('/cron', CronRouter);
  containerRouter.use('/email', EmailRouter);
} 

containerRouter.get('/*', reactadminController.index);

module.exports = containerRouter;
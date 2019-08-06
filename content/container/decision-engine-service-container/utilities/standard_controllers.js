'use strict';
const periodic = require('periodicjs');
const path = require('path');
const standard_overrides = require('../controllers/overrides');
const CoreControllerModule = require('periodicjs.core.controller');

/**
 * 
 * Iterates through the models on periodic.datas and generates CRUD router for each SOR models, using the periodic core controller and applies overrides if any
 * @returns {Map<string, Object>} Contains key value pair of SOR dataname and corresponding CRUD routers
 */
function standardControllers() {
  try {
    const dataCoreControllers = new Map();
    for (let [dataName, datum] of periodic.datas) {
      if (dataName.indexOf('standard_') > -1) {
        const override = standard_overrides[ dataName ];
        const CoreController = new CoreControllerModule(periodic, {
          compatibility: false,
          skip_responder: true,
          skip_db: true,
          skip_protocol: true,
        });
        CoreController.initialize_responder({
          adapter: 'json',
        });
        CoreController.initialize_protocol({
          adapter: 'json',
          api: 'rest',
        });
        CoreController.db[dataName] = datum;
        dataCoreControllers.set(dataName, {
          controller: CoreController,
          router: CoreController.protocol.api.implement({
            override,
            model_name: dataName,
            dirname: path.join(periodic.config.app_root, '/content/container/decision-engine-service-container/views'),
          }).router,
        });
      }
    }
    return (dataCoreControllers);
  } catch (e) {
    periodic.logger.error(e);
  }
}

module.exports = {
  standardControllers,
};
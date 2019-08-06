'use strict';
const utilities = require('../../../utilities');
const create = utilities.views.decision.modals.create;
const { createArr } = utilities.views.decision.shared.components.manifestConfigs.configArr;
module.exports = createArr.map(create);
'use strict';
const api = require('./api');
const auth = require('./auth');
const client = require('./client');
const file = require('./file');
const integration = require('./integration');
const organization = require('./organization');
const payment = require('./payment');
const user = require('./user');
const transform = require('./transform');
const overrides = require('./overrides');
const standardControllers = require('../utilities/standard_controllers.js');
const simulation = require('./simulation');
const optimization = require('./optimization');
const ocr = require('./ocr');
const ml = require('./ml');
const lap = require('./lap_api');
const los = require('./los');

//USED FOR DEV ENVIRONMENTS ONLY
const email = require('./email');

module.exports = {
  overrides,
  api,
  auth,
  client,
  email,
  file,
  integration,
  organization,
  payment,
  optimization,
  ocr,
  ml,
  lap,
  los,
  user,
  simulation,
  transform,
  standardControllers,
};

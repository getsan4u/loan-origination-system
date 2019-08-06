'use strict';

let ApplicationRouter = require('./applications');
let CaseRouter = require('./cases');
let CompanyRouter = require('./companies');
let CommunicationRouter = require('./communications');
let DocumentRouter = require('./documents');
let IntermediaryRouter = require('./intermediaries');
let PersonRouter = require('./people');
let TaskRouter = require('./tasks');

module.exports = {
  ApplicationRouter,
  CaseRouter,
  CompanyRouter,
  CommunicationRouter,
  DocumentRouter,
  IntermediaryRouter,
  PersonRouter,
  TaskRouter,
};


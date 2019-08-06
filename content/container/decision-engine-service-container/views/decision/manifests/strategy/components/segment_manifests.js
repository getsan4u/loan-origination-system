'use strict';

const REQUIREMENTS = require('./generate_requirements_segments');
const DATAINTEGRATIONS = require('./generate_dataintegration_segments');
const ARTIFICIALINTELLIGENCE = require('./generate_artificialintelligence_segments');
const SCORECARD = require('./generate_scorecard_segments');
const OUTPUT = require('./generate_output_segments');
const CALCULATION = require('./generate_calculation_segments');
const ASSIGNMENT = require('./generate_assignment_segments');
const EMAIL = require('./generate_email_segments');
const TEXT = require('./generate_textmessage_segments');
const DOCUMENTCREATION = require('./generate_documentcreation_segments');

module.exports = {
  dataintegration: DATAINTEGRATIONS,
  artificialintelligence: ARTIFICIALINTELLIGENCE,
  requirements: REQUIREMENTS,
  scorecard: SCORECARD,
  output: OUTPUT,
  calculations: CALCULATION,
  assignments: ASSIGNMENT,
  email: EMAIL,
  textmessage: TEXT,
  documentcreation: DOCUMENTCREATION,
};
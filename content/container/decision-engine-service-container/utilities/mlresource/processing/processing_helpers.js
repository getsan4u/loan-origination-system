'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
const { mapPredictionToDigiFiScore } = require('../resourcehelpers');

function generateProjectedResult(scoreanalysis, prediction) {
  try {
    const evaluatorFunc = new Function('x', scoreanalysis.results.projection_evaluator);
    const projection_adr = evaluatorFunc(mapPredictionToDigiFiScore(prediction));
    if (!isNaN(parseFloat(projection_adr))) return projection_adr < 0 ? 0 : projection_adr;
    else return prediction; 
  } catch(e) {
    logger.warn(e);
  }
}



module.exports = {
  generateProjectedResult,
};
'use strict';

const periodic = require('periodicjs');
const logger = periodic.logger;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const utilities = require('../../utilities');
const helpers = utilities.helpers;
const losControllerUtil = utilities.controllers.los;
const transformhelpers = utilities.transformhelpers;

async function getTaskBots(req, res, next) {
  try {
    const Taskbot = periodic.datas.get('standard_cron');
    req.controllerData = req.controllerData || {};
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    if (req.query.paginate) {
      let pagenum = 1;
      if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
      let skip = 50 * (pagenum - 1);
      const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
      let queryOptions = { query: { organization, }, paginate: true, limit: 50, pagelength: 50, skip, sort, population: 'false' };
      const { $and, $or, } = losControllerUtil.__formatTaskMongoQuery({ req });
      if ($and && $and.length) queryOptions.query[ '$and' ] = $and;
      if ($or && $or.length) queryOptions.query[ '$or' ] = queryOptions.query[ '$or' ] = $or;
      const taskbots = await Taskbot.model.find(queryOptions.query).collation({ locale: 'en' }).sort(sort).skip(skip).limit(50).lean();
      const numItems = await Taskbot.model.countDocuments(queryOptions.query);
      const numPages = Math.ceil(numItems / 50);
      req.controllerData = Object.assign({}, req.controllerData, { rows: taskbots || [], skip, numItems, numPages, });
    } else {
      const {
        limit,
        populate,
        sort = '-createdat',
        query = {},
      } = req.query;
      query.organization = organization;
      const populationFields = [];
      if (populate) {
        populationFields.push({ path: populate, select: [], });
      }
      const tasks = await Taskbot.model.find(query).limit(limit).populate(populationFields).sort(sort).lean();
      req.controllerData.tasks = tasks;
    }
    next();
  } catch (e) {
    logger.warn(e.message)
    next(e);
  }
}

module.exports = {
  getTaskBots,
};
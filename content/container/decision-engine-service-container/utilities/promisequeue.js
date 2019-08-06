'use strict';
const periodic = require('periodicjs');
const PQ = require('p-queue');
const logger = periodic.logger;
const queue = new PQ({ concurrency: 20, });
const Promisie = require('promisie');
const util = require('util');
const path = require('path');
const flatten = require('flat').flatten;
const unflatten = require('flat').unflatten;
const helpers = require('./helpers.js');
const wkhtmltopdf = require('wkhtmltopdf');
const fs = Promisie.promisifyAll(require('fs-extra'));
const Bluebird = require('bluebird');
const ejs = require('ejs');
let redisClient;
let activeInterval;

/**
 * Interval function to update redis status with the number of pending promises in the queue
 * 
 */
function queueStatUpdater() {
  redisClient.get('active_queue', (err, result) => {
    if (err) clearInterval(activeInterval);
    redisClient.set('active_queue', JSON.stringify({
      pending: queue.pending,
      status: 'In Progress',
    }), 'EX', 10);
  });
}

function toMB(byteVal) {
  return (byteVal / 1048576).toFixed(2);
}

/** OLD addQueue
 * Queues all calls to credit engine, processes in batches, updates simulation results after queue has been completed
 * 
 * @param {any} arrayOfPromises 
 * @param {any} mongodoc 
 * @returns 
 */
// async function addQueue(options) {
//   let { arrayOfPromises, mongodoc, totalCount, currentCount, organization, } = options;
//   const io = periodic.servers.get('socket.io').server;
//   const Simulation = periodic.datas.get('standard_simulation');
//   redisClient = periodic.app.locals.redisClient;
//   activeInterval = setInterval(queueStatUpdater, 2000);
//   let Batch = periodic.datas.get('standard_batch');
//   try {
//     let result = await queue.addAll(arrayOfPromises);
//     clearInterval(activeInterval);
//     let data = await Batch.create({
//       newdoc: { results: result, simulation: mongodoc._id.toString(), },
//     });
//     data = data.toJSON ? data.toJSON() : data;
//     let simulation = await Simulation.load({ query: { _id: mongodoc._id.toString(), }, });
//     let currentProgress = simulation.progress;
//     let progress = (currentProgress / 100 * totalCount + currentCount) / totalCount * 100;
//     let status = progress < 100 ? 'In Progress' : 'Complete';
//     await Simulation.update({
//       id: mongodoc._id.toString(),
//       isPatch: true,
//       updatedoc: { status, progress, results: [data._id.toString(),], },
//     });
//     io.sockets.emit('decisionProcessing', { progress, _id: mongodoc._id.toString(), status, organization, });
//   } catch(err) {
//     logger.warn('addQueue error: ', err);
//     clearInterval(activeInterval);
//     try {
//       await Simulation.update({
//         id: mongodoc._id.toString(),
//         updatedoc: { 'status': 'Error', updatedat: new Date(), },
//         isPatch: true,
//       });
//       io.sockets.emit('decisionProcessing', { _id: mongodoc._id.toString(), status: 'Error', organization, });
//     } catch (e) {
//       return Promise.reject(e);
//     }
//   }
// }

/**
 * Save the data integration responses to files.
 * @param {Object} options Contains results array and simulation object
 */
async function saveFiles(options) {
  const File = periodic.datas.get('standard_file');
  let { result, simulation, organization, user, idx } = options;
  return Promise.all(result.data_sources.map(async (data_source, i) => {
    let { name, data, } = data_source;
    let Key, filetype;
    try {
      JSON.parse(data);
      Key = `dataintegrations/${simulation.name.replace(/\//g, '_')}/${name.replace(/\//g, '_')}_${new Date().getTime()}_${idx}_${i}.json`;
      filetype = 'json';
    } catch (e) {
      Key = `dataintegrations/${simulation.name.replace(/\//g, '_')}/${name.replace(/\//g, '_')}_${new Date().getTime()}_${idx}_${i}.xml`;
      filetype = 'xml';
    }
    await helpers.uploadAWS({ Key, Body: data, });
    return await File.create({ newdoc: Object.assign({}, { name, fileurl: Key, filetype, organization, user, }), });
  }));
}

async function convertHTMLToPDF({ template, }) {
  return new Promise((resolve, reject) => {
    try {
      let pdfBuffers = [];
      const pdfStream = wkhtmltopdf(template, {
        pageSize: 'letter',
        orientation: 'portrait',
        dpi: 96,
      });
      pdfStream.on('data', chunk => {
        pdfBuffers.push(chunk);
      });
      pdfStream.on('end', async () => {
        pdfBuffers = Buffer.concat(pdfBuffers);
        return resolve(pdfBuffers);
      });
      pdfStream.on('error', (err) => {
        return reject(new Error('Could not generate PDF document'));
      });
    } catch (err) {
      return reject(new Error('Could not generate PDF document'));
    }
  });
}

async function generateEmailAndTextDocuments({ md, case_name, organization, user, }) {
  try {
    const File = periodic.datas.get('standard_file');
    let { type, communication_variables, } = md;
    let configs = communication_variables || {};
    let templatePath, template;
    if (configs && type === 'Email') {
      templatePath = path.join(__dirname, '../views/shared/templates/email.ejs');
      template = await fs.readFileAsync(templatePath, 'utf8');
      let email = ejs.render(template, Object.assign({}, configs, { sentat: new Date(), }));
      let Key = `templates/${organization}/${case_name.toLowerCase().replace(/\s+/g, '_')}/email_${md.name}_${new Date().getTime()}.pdf`;
      let pdfDoc = await convertHTMLToPDF({ template: email, });
      await helpers.uploadAWS({ Key, Body: pdfDoc, });
      return await File.create({ newdoc: Object.assign({}, { name: `${case_name.toLowerCase().replace(/\s+/g, '_')}_${md.name}_${new Date().getTime()}`, fileurl: Key, filetype: 'pdf', organization, user, }), });
    } else if (configs && type === 'Text Message') {
      templatePath = path.join(__dirname, '../views/shared/templates/textmessage.ejs');
      template = await fs.readFileAsync(templatePath, 'utf8');
      let textmessage = ejs.render(template, Object.assign({}, configs, { sentat: new Date(), }));
      let Key = `templates/${organization}/${case_name.toLowerCase().replace(/\s+/g, '_')}/textmessage_${md.name}_${new Date().getTime()}.pdf`;
      let pdfDoc = await convertHTMLToPDF({ template: textmessage, });
      await helpers.uploadAWS({ Key, Body: pdfDoc, });
      return await File.create({ newdoc: Object.assign({}, { name: `${case_name.toLowerCase().replace(/\s+/g, '_')}_${md.name}_${new Date().getTime()}`, fileurl: Key, filetype: 'pdf', organization, user, }), });
    }
  } catch (e) {
    return Promisie.reject(e);
  }
}

async function generateDocumentCreationFile({ md, case_name, organization, user, }) {
  try {
    const File = periodic.datas.get('standard_file');
    let { type, created_document, } = md;
    return await File.create({ newdoc: Object.assign({}, { name: `${case_name.toLowerCase().replace(/\s+/g, '_')}_${md.name}_${new Date().getTime()}`, fileurl: created_document.Key, filetype: 'pdf', organization, user, }), });
  } catch (e) {
    return Promisie.reject(e);
  }
}


/**
 * Queues all calls to credit engine, processes in batches, updates simulation results after queue has been completed
 * 
 * @param {any} arrayOfPromises 
 * @param {any} mongodoc 
 * @returns 
 */
async function addQueue(options) {
  let { arrayOfPromises, mongodoc, totalCount, currentCount, organization, user, strategyId, compiled_order, strategy_display_name, } = options;
  const io = periodic.servers.get('socket.io').server;
  const Simulation = periodic.datas.get('standard_simulation');
  redisClient = periodic.app.locals.redisClient;
  activeInterval = setInterval(queueStatUpdater, 2000);
  let Batch = periodic.datas.get('standard_batch');
  let Case = periodic.datas.get('standard_case');
  try {
    let simulation = await Simulation.load({ query: { _id: mongodoc._id.toString(), }, });
    let results = await queue.addAll(arrayOfPromises);
    let asyncRedisIncrBy = Bluebird.promisify(redisClient.incrby, { context: redisClient, });
    let case_count = await asyncRedisIncrBy('batch_case_count', results.length);
    let cases = await Promise.all(results.map(async (el, idx) => {
      let files = [];
      let module_order = el.processing_detail || [];
      let emailModule = [];
      let textmessageModule = [];
      let documentcreationModule = [];
      let case_name = (el.test_case_name) ? el.test_case_name : `Batch Process ${case_count - idx}`;
      module_order.forEach((md) => {
        if (md.type === 'Email') emailModule.push(md);
        else if (md.type === 'Text Message') textmessageModule.push(md);
        else if (md.type === 'Document Creation') documentcreationModule.push(md);
      });
      if (el.data_sources && el.data_sources.length) {
        files = await saveFiles({ result: el, simulation, organization, user, idx });
      }
      if (emailModule.length) {
        let templatefiles = await Promise.all(emailModule.map(md => generateEmailAndTextDocuments({ md, case_name, organization, user, })));
        files = files.concat(templatefiles);
      }
      if (textmessageModule.length) {
        let templatefiles = await Promise.all(textmessageModule.map(md => generateEmailAndTextDocuments({ md, case_name, organization, user, })));
        files = files.concat(templatefiles);
      }
      if (documentcreationModule.length) {
        let templatefiles = await Promise.all(documentcreationModule.map(md => generateDocumentCreationFile({ md, case_name, organization, user, })));
        files = files.concat(templatefiles);
      }
      if (el.input_variables && el.input_variables.datasources) delete el.input_variables.datasources;
      // return Case.create({
      //   newdoc: {
      //     case_name,
      //     inputs: el.input_variables || {},
      //     outputs: el.output_variables || {},
      //     module_order: el.processing_detail || [],
      //     decline_reasons: el.decline_reasons || [],
      //     passed: el.passed,
      //     strategy: strategyId,
      //     compiled_order,
      //     strategy_display_name: strategy_display_name || '',
      //     processing_type: 'batch',
      //     organization,
      //     error: (el.message && typeof el.message === 'string') ? [ el.message ] : [],
      //     user: {
      //       creator: `${user.first_name} ${user.last_name}`,
      //       updater: `${user.first_name} ${user.last_name}`,
      //     },
      //     files: files.map(file => file._id.toString()),
      //   }
      // })
      return {
        case_name,
        inputs: el.input_variables || {},
        outputs: el.output_variables || {},
        module_order: el.processing_detail || [],
        decline_reasons: el.decline_reasons || [],
        passed: el.passed,
        strategy: strategyId,
        compiled_order,
        strategy_display_name: strategy_display_name || '',
        processing_type: 'batch',
        organization,
        error: (el.message && typeof el.message === 'string') ? [el.message, ] : [],
        user: {
          creator: `${user.first_name} ${user.last_name}`,
          updater: `${user.first_name} ${user.last_name}`,
        },
        files: files.map(file => file._id.toString()),
      };
    }));
    clearInterval(activeInterval);
    let createdCasesArray = cases.map(cs => {
      let createOptions = {
        newdoc: cs,
      };
      return Case.create(createOptions);
    });
    let createdCases = await Promise.all(createdCasesArray);
    let data = await Batch.create({
      newdoc: { organization, results: createdCases.map(cas => ({ case: cas._id.toString(), case_name: cas.case_name, overall_result: Array.isArray(cas.error) && cas.error.length ? 'Error' : cas.passed ? 'Passed' : 'Failed', })), simulation: mongodoc._id.toString(), },
    });
    data = data.toJSON ? data.toJSON() : data;
    let currentProgress = simulation.progress;
    let progress = (currentProgress / 100 * totalCount + currentCount) / totalCount * 100;
    let status = progress < 100 ? 'In Progress' : 'Complete';
    await Simulation.update({
      id: mongodoc._id.toString(),
      isPatch: true,
      updatedoc: { status, progress, results: [data._id.toString(), ], },
    });
    io.sockets.emit('decisionProcessing', { progress, _id: mongodoc._id.toString(), status, organization, });
    return;
  } catch (err) {
    logger.warn('addQueue error: ', err);
    clearInterval(activeInterval);
    try {
      await Simulation.update({
        id: mongodoc._id.toString(),
        updatedoc: { 'status': 'Error', updatedat: new Date(), },
        isPatch: true,
      });
      io.sockets.emit('decisionProcessing', { _id: mongodoc._id.toString(), status: 'Error', organization, });
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

module.exports = {
  addQueue,
  queueStatUpdater,
};


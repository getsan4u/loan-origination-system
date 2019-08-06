'use strict';

const periodic = require('periodicjs');
const fs = require('fs-extra');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const numeral = require('numeral');
const logger = periodic.logger;
const flat = require('flat');
const Promisie = require('promisie');
const util = require('util');
const converter = require('json-2-csv');
const flatten = require('flat').flatten;
const unflatten = require('flat').unflatten;
const moment = require('moment');
const path = require('path');
const capitalize = require('capitalize');
const utilities = require('../utilities');
const AWS = require('aws-sdk');
const csv = require('fast-csv');
const pluralize = require('pluralize');
const zlib = require('zlib');
const helpers = utilities.helpers;
const getCollectionCounter = helpers.getCollectionCounter;
const Busboy = require('busboy');
const RTree = require('rtree');
const transformhelpers = utilities.transformhelpers;
const _controller = utilities.controllers.ocr;

/**
 * Gets all documents
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function getTemplates(req, res, next) {
  const OCR = periodic.datas.get('standard_ocrdocument');
  req.controllerData = req.controllerData || {};
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  let query = { organization, };
  if (req.query.query) {
    query[ '$or' ] = [ {
      name: new RegExp(req.query.query, 'gi'),
    }, {
      description: new RegExp(req.query.query, 'gi'),
    }, ];
  }
  let documents = await OCR.query({ query, });
  documents = documents.map(data => data.toJSON ? data.toJSON() : data);
  req.query.pagenum = req.query.pagenum || 1;
  let startIndex = 10 * (req.query.pagenum - 1);
  let endIndex = 10 * req.query.pagenum;
  let rows = documents.sort((a, b) => a.createdat > b.createdat ? -1 : 1).slice(startIndex, endIndex);
  req.controllerData = Object.assign({}, req.controllerData, {
    templates: {
      documents,
      rows,
      numPages: Math.ceil(documents.length / 10),
      numItems: documents.length,
    },
  });
  return next();
}

/**
 * Gets all documents
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function getCases(req, res, next) {
  const Case = periodic.datas.get('standard_ocrcase');
  req.controllerData = req.controllerData || {};
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  let query = req.query.query ? { processing_type: 'individual', filename: new RegExp(req.query.query, 'gi'), organization, } : { processing_type: 'individual', organization, };
  let documents = await Case.query({ query, });
  documents = documents.map(data => data.toJSON ? data.toJSON() : data);
  req.query.pagenum = req.query.pagenum || 1;
  let startIndex = 10 * (req.query.pagenum - 1);
  let endIndex = 10 * req.query.pagenum;
  let rows = documents.sort((a, b) => a.createdat > b.createdat ? -1 : 1).slice(startIndex, endIndex);
  req.controllerData = Object.assign({}, req.controllerData, {
    cases: {
      documents,
      rows,
      numPages: Math.ceil(documents.length / 10),
      numItems: documents.length,
    },
  });
  return next();
}

/**
 * Gets all documents
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function getSimulations(req, res, next) {
  const Simulation = periodic.datas.get('standard_ocrsimulation');
  req.controllerData = req.controllerData || {};
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  let query = req.query.query ? { name: new RegExp(req.query.query, 'gi'), organization, } : { organization, };
  let documents = await Simulation.query({ query, });
  documents = documents.map(data => data.toJSON ? data.toJSON() : data);
  req.query.pagenum = req.query.pagenum || 1;
  let startIndex = 10 * (req.query.pagenum - 1);
  let endIndex = 10 * req.query.pagenum;
  let rows = documents.sort((a, b) => a.createdat > b.createdat ? -1 : 1).slice(startIndex, endIndex);
  req.controllerData = Object.assign({}, req.controllerData, {
    simulations: {
      documents,
      rows,
      numPages: Math.ceil(documents.length / 10),
      numItems: documents.length,
    },
  });
  return next();
}

async function checkExistingTemplateName(req, res, next) {
  try {
    const OCR = periodic.datas.get('standard_ocrdocument');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.body = req.body || {};
    req.body.api_name = req.body.name.toLowerCase().replace(/\s+/g, '_');
    const existingOCRDoc = await OCR.load({ query: { api_name: req.body.api_name, organization, }, });
    if (existingOCRDoc) {
      res.status(500).send({ message: 'OCR Document with the same name already exists', });
    } else {
      next();
    }
  } catch(e) {
    logger.error('OCR template api name already exists', e);
    return next(e);
  }
}

async function createTemplate(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const OCR = periodic.datas.get('standard_ocrdocument');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let createOptions = Object.assign({
      user: { creator: `${user.first_name} ${user.last_name}`, updater: `${user.first_name} ${user.last_name}`, },
      organization,
    }, req.body, { fields: [], });
    let newDoc = await OCR.create(createOptions);
    if (newDoc && newDoc._id) {
      res.status(200).send({
        status: 200,
        timeout: 10000,
        type: 'success',
        text: 'Changes saved successfully!',
        successProps: {
          successCallback: 'func:window.closeModalAndCreateNotification',
        },
        responseCallback: 'func:this.props.reduxRouter.push',
        pathname: `/ocr/templates/${newDoc._id}/0`,
      });
    } else next();
  } catch (e) {
    logger.error('Unable to create ocr template', e);
    return next(e);
  }
}

/** 
 * Deletes data source from mongo
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
async function deleteTemplate(req, res, next) {
  try {
    const OCR = periodic.datas.get('standard_ocrdocument');
    req.controllerData = req.controllerData || {};
    if (req.params && req.params.id) {
      let user = req.user;
      let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      await OCR.delete({ deleteid: req.params.id, organization, });
      next();
    } else {
      next();
    }
  } catch (e) {
    logger.warn('Error in deleteDataSource: ', e);
  }
}

/**
 * 
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function getTemplate(req, res, next) {
  req.controllerData = req.controllerData || {};
  const OCR = periodic.datas.get('standard_ocrdocument');
  let user = req.user;
  let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
  let query = (req.body.template_name) 
    ? { api_name: req.body.template_name, organization, }
    :  (req.user) 
      ? { _id: req.params.id || req.body.id || req.controllerData.template_id, organization, } 
      : { _id: req.params.id || req.body.id, };
  let doc = await OCR.load({ query, });
  doc = doc.toJSON ? doc.toJSON() : doc;
  req.controllerData.doc = doc;
  if (req.query.download_document) req.controllerData.data = { name: doc.filename, fileurl: `templatedocuments/${doc.filename}.pdf`, };
  return next();
}


async function getTemplateFromAWS(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (Array.isArray(req.controllerData.doc.files) && req.controllerData.doc.files.length) {
      let current_filepath = req.controllerData.doc.files[ req.params.page ];
      let fileurl = `ocr_templates/${current_filepath}`;
      let filedata = await helpers.downloadAWS({ fileurl, });
      let filestring = 'data:image/jpg;base64,' + new Buffer(filedata).toString('base64');
      req.controllerData.ocr_template_string = filestring;
    } else {
      req.controllerData.ocr_template_string = '';
    }
    next();
  } catch (e) {
    res.status(500).send({ message: 'Error uploading OCR template.', });
  }
}

/**
 * Updates document.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function updateTemplate(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const OCR = periodic.datas.get('standard_ocrdocument');
    await OCR.update({
      id: req.params.id || req.body.id,
      updatedoc: (req.query && req.query.update === 'description') ? { description: req.body.description || '', } : req.body,
      isPatch: req.controllerData.isPatch === undefined ? true : req.controllerData.isPatch,
    });
    return next();
  } catch (e) {
    logger.error('Unable to update document', e);
    return next(e);
  }
}


async function uploadTemplateToAWS(req, res, next) {
  try {
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData.isPatch = false;
    let original_filename = req.controllerData.original_filenames[ 0 ];
    if (original_filename) original_filename = original_filename.replace('.pdf', '');
    if (Array.isArray(req.controllerData.local_image_files) && req.controllerData.local_image_files.length) {
      let template_filepaths = req.controllerData.local_image_files[ 0 ] || [];
      let aws_file_keys = await Promise.all(template_filepaths.map(async (filepath, idx) => {
        let file = await fs.readFile(filepath);
        let filename = `${new Date().getTime()}_${idx}_${original_filename}.jpg`;
        let options = {
          Key: `ocr_templates/${filename}`,
          Body: file,
        };
        await helpers.uploadAWS(options);
        return filename;
      }));
      req.body = Object.assign({}, req.controllerData.doc, { files: aws_file_keys, });
    }
    next();
  } catch (e) {

    next();
  }
}

async function getUploadedDocuments(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.headers[ 'content-type' ] === 'application/octet-stream') {
      const buffer = [];
      req.on('data', function onRequestData(chunk) {
        buffer.push(chunk);
      });
      req.on('error', function(err) {
        res.status(500).send({ message: err.message });
      });
      req.on('end', function() {
        const concated = Buffer.concat(buffer);
        req.body = req.headers;
        req.controllerData.files = [concated,];
        req.controllerData.updatedoc = req.controllerData.updatedoc || {};
        next();
      });
    } else {
      if (!/multipart\/form-data/.test(req.headers[ 'content-type' ])) {
        res.set('Connection', 'close');
        return res.status(500).send({ message: 'Please select a file', });
      } else{
        const busboy = new Busboy({ headers: req.headers, });
        req.controllerData = req.controllerData || {};
        req.controllerData.updatedoc = req.controllerData.updatedoc || {};
        req.controllerData.original_filenames = [];
        req.controllerData.files = [];
        req.body = req.body || {};
        let hasTemplate = true;
        let isProperFileType = true;
        busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
          if (fieldname === 'client_id' || fieldname === 'client_secret' || fieldname === 'client_public_key' || fieldname === 'client_transaction_id' || fieldname === 'template_name') {
            req.body[fieldname] = val;
          } else if (fieldname === 'template_id' && val === 'undefined') {
            req.unpipe(busboy);
            res.set('Connection', 'close');
            res.status(500).send({ message: 'Please select a template', });
            hasTemplate = false;
          } else if (fieldname === 'template_id' && val !== 'undefined') {
            req.controllerData.updatedoc.template = val;
            req.controllerData.template_id = val;
          } else if (fieldname === 'batch_name' && val && val !== 'undefined') {
            req.controllerData.updatedoc.name = val;
          }
        });
        busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
          let buffers = [];
          let filesize = 0;
          let fileTypeArr = filename.trim().split('.');
          let fileType = fileTypeArr[ fileTypeArr.length - 1 ];
          req.controllerData.original_filenames.push(filename);
          if (fileType !== 'pdf') {
            isProperFileType = false;
            req.unpipe(busboy);
            res.set('Connection', 'close');
            return res.status(500).send({ message: 'File type must be in PDF format', });
          } else {
            file.on('data', chunk => {
              filesize += Buffer.byteLength(chunk);
              buffers.push(chunk);
            });
            file.on('end', () => {
              req.controllerData.files.push(Buffer.concat(buffers));
            });
            file.on('error', (e) => {
              logger.error('reading file error', e);
              return next(e);
            });
          }
        });
        busboy.on('finish', function () {
          req.controllerData.updatedoc = req.controllerData.updatedoc || {};
          req.controllerData.updatedoc.progress = 20;
          if (hasTemplate && isProperFileType) next();
        });
        req.pipe(busboy);
      }
    }
  } catch (e) {
    res.status(500).send({ message: 'Error uploading OCR documents', });
  }

}

async function createLocalPDF(req, res, next) {
  try {
    if (req.controllerData.files) {
      let local_filenames = [];
      let local_filename;
      await Promise.all(req.controllerData.files.map(async (filebuffer, i) => {
        local_filename = `temp_pdf_file_${new Date().getTime()}_${i}.pdf`;
        local_filenames.push(local_filename);
        await fs.writeFile(path.join(process.cwd(), `content/files/${local_filename}`), filebuffer);
      }));

      req.controllerData.local_filenames = local_filenames;
      next();
    } else {
      res.status(500).send({ message: 'Could not retreive uploaded file.', });
    }
  } catch (e) {
    res.status(500).send({ message: 'Could not create local PDF file.', });
  }
}

async function generateLocalImageFiles(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.updatedoc = req.controllerData.updatedoc || {};
    if (req.controllerData.local_filenames) {
      let PDFImage = require('pdf-image').PDFImage;
      let pdfimage;
      let allFileImagePaths = await Promise.all(req.controllerData.local_filenames.map(async (local_filename, i) => {
        pdfimage = new PDFImage(path.join(process.cwd(), `content/files/${local_filename}`), {
          convertExtension: 'jpg', convertOptions: {
            '-colorspace': '"RGB"',
            '-interlace': '"none"',
            '-density': '300',
            '-quality': '100',
            '-background': '"#FFFFFF"',
            '-flatten': '',
          },
        });
        let singlefileImagePaths = await pdfimage.convertFile();
        return singlefileImagePaths;
      }));
      req.controllerData.local_image_files = allFileImagePaths;
      req.controllerData.updatedoc.progress = 40;
      next();
    } else {
      res.status(500).send({ message: 'Could not extract OCR templates.', });
    }
  } catch (e) {
    res.status(500).send({ message: 'Could not generate local image files.', });
  }
}

async function retrieveTextExtractionResults(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.updatedoc = req.controllerData.updatedoc || {};
    req.controllerData.fileCount = 0;
    if (req.controllerData.local_image_files) {
      let client = periodic.googlevision;
      let fileContents = await Promise.all(req.controllerData.local_image_files.map(async (image_locations_arr) => {
        return image_locations_arr.map(image_location => {
          req.controllerData.fileCount++;
          return fs.readFileSync(image_location);
        });
      }));
      let ocr_results, ocrRequest;
      req.controllerData.ocr_results = await Promise.all(fileContents.map(async (image_group) => {
        ocrRequest = (image_group.length === 1)
          // ? {
          //   image: {
          //     content: image_group[ 0 ],
          //   },
          //   feature: {
          //     type: 'DOCUMENT_TEXT_DETECTION',
          //     languageHints: ['en-t-i0-handwrit'],
          //   },
          // }
          ? {
            image: {
              content: image_group[ 0 ],
            },
            feature: {
              languageHints: [ 'en-t-i0-handwrit', ],
            },
          }
          : {
            requests: image_group.map(content => {
              return {
                image: { content: content.toString('base64'), },
                features: [ { type: 'DOCUMENT_TEXT_DETECTION', }, ],
              };
            }),
          };
        if (image_group.length > 1) {
          let vision_results = await client.batchAnnotateImages(ocrRequest);
          ocr_results = [ ...vision_results[ 0 ].responses, ];
        } else {
          ocr_results = await client.documentTextDetection(ocrRequest);
        }
        return ocr_results;
      }));
      req.controllerData.updatedoc.progress = 70;
      next();
    } else {
      res.status(500).send({ message: 'Could not extract OCR templates.', });
    }
  } catch (e) {
    req.error = e.message;
    res.status(500).send({ message: 'Could not extract OCR templates.', });
  }
}

async function cleanTextExtractionResults(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.ocr_results) {
      // each of these ocr_results is one to one with a PDF --> it is an array that contains ocr_results of all images from a PDF
      let rtree_matrix = [];
      // generate rtrees for every jpeg
      req.controllerData.ocr_results.forEach((pdf_ocrresult_arr, i) => {
        rtree_matrix[ i ] = rtree_matrix[ i ] || [];
        pdf_ocrresult_arr.forEach(single_page_result => {
          let rTree = RTree();
          let textAnnotations = (single_page_result.textAnnotations)
            ? single_page_result.textAnnotations
            : (single_page_result[ 0 ] && single_page_result[ 0 ].textAnnotations)
              ? single_page_result[ 0 ].textAnnotations
              : [];
          let cleaned_ocr = _controller.__cleanTextAnnotations(textAnnotations);
          cleaned_ocr.forEach(node => {
            // let { x, y, w, h, data, } = node;
            // rTree.insert({ x, y, w, h, }, data);
            let { x, y, w, h, data, } = node;
            let midX = (w / 2) + x;
            let midY = (h / 2) + y;
            rTree.insert({ x: midX, y: midY, w: 1, h: 1, }, data);
          });
          rtree_matrix[ i ].push(rTree);
        });
      });
      req.controllerData.rtree_matrix = rtree_matrix;
      next();
    } else {
      res.status(500).send({ message: 'Could not extract OCR templates.', });
    }
  } catch (e) {
    req.error = e.message;
    res.status(500).send({ message: 'Could not extract OCR templates.', });
  }
}

async function assignFieldsFromTextExtractionResults(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.updatedoc = req.controllerData.updatedoc || {};
    if (req.controllerData.rtree_matrix && req.controllerData.doc) {
      let template = req.controllerData.doc;
      let extractedFields = [];
      let rTreeConfig = req.controllerData.rtree_matrix;

      req.controllerData.rtree_matrix.forEach((rtree_config_set, i) => {
        let extracted = {};
        // rtree_config_set is an array that contains an rtree for every jpg image generated from the uploaded PDF
        let found, rtree, phrase;
        template.fields.forEach(field => {
          let { x, y, w, h, page, name, data_type, } = field;
          rtree = (rTreeConfig && rTreeConfig[ i ]) ? rTreeConfig[ i ][ page ] : rTreeConfig[ i ][ 0 ];
          found = rtree.search({ x, y, w, h, }, true);
          found.sort((a, b) => a.leaf.blockNum - b.leaf.blockNum);
          phrase = found.map(fnd => fnd.leaf.description).join(' ');
          // THIS IS WHERE I NEED TO DO STUFF
          phrase = transformhelpers.transformGoogleVisionOutput(phrase, data_type);
          extracted[ name ] = phrase || '';
        });
        extracted = Object.assign({}, extracted);
        extractedFields.push(extracted);
      });
      req.controllerData = Object.assign({}, req.controllerData, { extractedFields, });
      req.controllerData.updatedoc.progress = 95;
      next();
    } else {
      res.status(500).send({ message: 'Could not extract OCR templates.', });
    }
  } catch (e) {
    req.error = e.message;
    res.status(500).send({ message: 'Could not fetch OCR templates.', });
  }
}

async function clearTempPDFandImageFiles(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    let local_filenames = req.controllerData.local_filenames.map(pdf_name => path.join(process.cwd(), `content/files/${pdf_name}`));
    let local_image_files = req.controllerData.local_image_files.reduce((aggregate, image_names) => {
      aggregate.push(...image_names);
      return aggregate;
    }, []);
    await Promise.all([ ...local_filenames, ...local_image_files, ].map(async (filename) => {
      await fs.remove(filename);
    }));
    next();
  } catch (e) {
    res.status(500).send({ message: 'Error in clearTempPDFandImageFiles.', });
  }
}

async function getSimulation(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Simulation = periodic.datas.get('standard_ocrsimulation');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let query = (req.user) ? { _id: req.params.id, organization, } : { _id: req.params.id || req.body.id, };
    let doc = await Simulation.load({ query, });
    doc = doc.toJSON ? doc.toJSON() : doc;
    req.controllerData.doc = doc;
    // if (req.query.download_document) req.controllerData.data = { name: doc.filename, fileurl: `templatedocuments/${doc.filename}.pdf` };
    return next();
  } catch (e) {
    res.status(500).send({ message: 'Could not find the case', });
  }
}

async function createCase(req, res, next) {
  try {
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData = req.controllerData || {};
    const Case = periodic.datas.get('standard_ocrcase');
    let count = await getCollectionCounter('standard_ocrcase');
    let results = req.controllerData.extractedFields[ 0 ];
    let original_filename = (req.controllerData.original_filenames) ? req.controllerData.original_filenames[ 0 ] : '';
    let template_name = req.controllerData.templateDoc? req.controllerData.templateDoc.name : original_filename;
    original_filename = original_filename.replace('.pdf', '');
    let newdoc = {
      name: `Individual OCR Case ${count}`,
      processing_type: 'individual',
      template_name,
      filename: original_filename,
      template: req.controllerData.template_id,
      results,
      error: [],
      createdat: new Date(),
      updatedat: new Date(),
      organization,
      user: { creator: `${user.first_name} ${user.last_name}`, updater: `${user.first_name} ${user.last_name}`, },
    };
    let created = await Case.create({ newdoc, });
    if (created && created._id) {
      res.status(200).send({
        status: 200,
        timeout: 10000,
        type: 'success',
        text: 'Changes saved successfully!',
        successProps: {
          successCallback: 'func:window.closeModalAndCreateNotification',
        },
        responseCallback: 'func:this.props.reduxRouter.push',
        pathname: `/ocr/processing/individual/${created._id}`,
      });
    } else {
      next();
    }
  } catch (e) {
    next();
  }
}
async function getCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Case = periodic.datas.get('standard_ocrcase');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let query = (req.user) ? { _id: req.params.id || req.body.id, organization, } : { _id: req.params.id || req.body.id, };
    let doc = await Case.load({ query, });
    doc = doc.toJSON ? doc.toJSON() : doc;
    req.controllerData.doc = doc;
    // if (req.query.download_document) req.controllerData.data = { name: doc.filename, fileurl: `templatedocuments/${doc.filename}.pdf` };
    return next();
  } catch (e) {
    res.status(500).send({ message: 'Could not find the case', });
  }
}

/**
 * Updates document.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function updateCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Case = periodic.datas.get('standard_ocrcase');
    await Case.update({
      id: req.params.id || req.body.id,
      updatedoc: req.body,
      isPatch: req.controllerData.isPatch === undefined ? true : req.controllerData.isPatch,
    });
    return next();
  } catch (e) {
    logger.error('Unable to update document', e);
    return next(e);
  }
}

/**
 * Updates document.
 * 
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 * 
 */
async function updateSimulationCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Case = periodic.datas.get('standard_ocrcase');
    await Case.update({
      id: req.params.caseid || req.body.caseid,
      updatedoc: req.body,
      isPatch: req.controllerData.isPatch === undefined ? true : req.controllerData.isPatch,
    });
    return next();
  } catch (e) {
    logger.error('Unable to update document', e);
    return next(e);
  }
}

async function createSimulation(req, res, next) {
  try {
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData = req.controllerData || {};
    const Simulation = periodic.datas.get('standard_ocrsimulation');
    let count = await getCollectionCounter('standard_ocrsimulation');
    let newdoc = {
      name: `Batch OCR ${count}`,
      status: '',
      progress: 0,
      template: null,
      template_name: req.controllerData.templateDoc? req.controllerData.templateDoc.name : '',
      results: [],
      createdat: new Date(),
      updatedat: new Date(),
      organization,
      user: { creator: `${user.first_name} ${user.last_name}`, updater: `${user.first_name} ${user.last_name}`, },
    };
    let created = await Simulation.create({ newdoc, });
    req.controllerData.simulation = (created && created.toJSON) ? created.toJSON() : created;
    next();
  } catch (e) {
    next();
  }
}

async function updateSimulationProgress(req, res, next) {
  try {
    const Simulation = periodic.datas.get('standard_ocrsimulation');
    const io = periodic.servers.get('socket.io').server;
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let isPatch = true;
    req.controllerData = req.controllerData || {};
    let status = req.controllerData.updatedoc.progress < 100 ? 'In Progress' : 'Complete';
    let updatedoc = { _id: req.controllerData.simulation._id, status, };
    updatedoc = Object.assign({}, updatedoc, req.controllerData.updatedoc);
    req.controllerData.updatedoc = {};
    io.sockets.emit('decisionProcessing', { progress: updatedoc.progress, _id: req.controllerData.simulation._id.toString(), status, organization, });
    await Simulation.update({
      id: req.controllerData.simulation._id.toString(),
      updatedoc,
      isPatch,
    });
    return next();
  } catch (e) {
    logger.error('Unable to update document', e);
    return next(e);
  }
}

async function createCases(req, res, next) {
  try {
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    req.controllerData = req.controllerData || {};
    req.controllerData.updatedoc = req.controllerData.updatedoc || {};
    const Case = periodic.datas.get('standard_ocrcase');
    // const Batch = periodic.datas.get('standard_ocrbatch');
    if (req.controllerData.extractedFields) {
      let count = await getCollectionCounter('standard_ocrcase');
      let filenames = (req.controllerData.original_filenames) ? req.controllerData.original_filenames : [];
      filenames = filenames.map(filename => filename.replace('.pdf', ''));
      let template_name = req.controllerData.templateDoc? req.controllerData.templateDoc.name : '';
      let newdoc = req.controllerData.extractedFields.map((result, idx) => ({
        name: `Batch OCR Case ${count + idx}`,
        processing_type: 'batch',
        filename: filenames[ idx ] || '',
        template: req.controllerData.template_id,
        template_name,
        results: result,
        error: [],
        createdat: new Date(),
        updatedat: new Date(),
        organization,
        user: { creator: `${user.first_name} ${user.last_name}`, updater: `${user.first_name} ${user.last_name}`, },
      }));
      let created = await Case.create({ newdoc, bulk_create: true, });
      created = created.map(cs => {
        cs = cs.toJSON ? cs.toJSON() : cs;
        return cs._id.toString();
      });
      // let batch = await Batch.create({
      //   newdoc: {
      //     results: created,
      //     ocrsimulation: req.controllerData.simulation._id.toString(),
      //   }
      // });
      // batch = batch.toJSON ? batch.toJSON() : batch;
      req.controllerData.updatedoc.progress = 100;
      req.controllerData.updatedoc.status = 'Complete';
      req.controllerData.updatedoc.results = created;
      next();
    } else {
      next();
    }
  } catch (e) {
    res.status(500).send({ message: 'Could not create cases', });
  }
}

async function fileTypeCheck(req, res, next) {
  req.controllerData = req.controllerData || {};
  try {
    if (req.controllerData.mimetype && !req.controllerData.mimetype.includes('pdf')) {
      return res.status(400).send({
        message: 'Please upload a PDF file to create your template',
      });
    } else {
      return next();
    }
  } catch (e) {
    res.status(500).send({ message: 'Unable to determine file type', });
  }
}

async function getSimulationCase(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const Case = periodic.datas.get('standard_ocrcase');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let query = (req.user) ? { _id: req.params.caseid, organization, } : { _caseid: req.params.caseid || req.body.caseid, };
    let doc = await Case.load({ query, });
    doc = doc.toJSON ? doc.toJSON() : doc;
    req.controllerData.doc = doc;
    // if (req.query.download_document) req.controllerData.data = { name: doc.filename, fileurl: `templatedocuments/${doc.filename}.pdf` };
    return next();
  } catch (e) {
    res.status(500).send({ message: 'Could not find the case', });
  }
}

function downloadCSV(req, res) {
  try {
    if (req.controllerData && req.controllerData.download_content) {
      res.set('Content-Type', 'text/csv');
      res.attachment(`${req.controllerData.doc.name}_${new Date()}.csv`);
      res.status(200).send(req.controllerData.download_content).end();
    } else {
      res.status(500).send({ message: 'Could not download case results.', });
    }
  } catch (e) {
    res.status(500).send({ message: 'Could not download case results.', });
  }
}

async function downloadTutorialData(req, res, next) {
  let file_name_map = {
    ml_vision_blank_template: 'OCR Text Recognition – Blank Template.pdf',
    ml_vision_processing_example: 'OCR Text Recognition – Processing Example.pdf',
    ml_vision_instructions: 'OCR Text Recognition - Instructions.rtf',
  };
  let filepath = path.join(process.cwd(), `content/files/tutorial/${req.query.type}.${req.query.export_format}`);
  let file = await fs.readFile(filepath);
  let filename = file_name_map[ req.query.type ];
  let contenttype = (req.query.export_format === 'pdf') ? 'application/pdf' : 'application/octet-stream';
  res.set('Content-Type', contenttype);
  res.attachment(filename);
  res.status(200).send(file).end();
}

async function checkTemplateFieldsExist(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const OCR = periodic.datas.get('standard_ocrdocument');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let query = (req.body.template_name) ? { api_name: req.body.template_name, organization, } : { _id: req.controllerData.template_id, };
    let templateDoc = await OCR.load({ query, });
    templateDoc = templateDoc.JSON ? templateDoc.JSON() : templateDoc;
    req.controllerData.templateDoc = templateDoc;
    if (templateDoc.fields && templateDoc.fields.length) {
      return next();
    } else {
      res.status(500).send({ message: 'The template you selected does not include any fields to extract.', });
    }
  } catch(e) {
    res.status(500).send({ message: 'Could not find the selected template', });
  }
}

/**
 * Sends success response.
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 */
function handleControllerDataResponse(req, res) {
  req.controllerData = req.controllerData || {};
  delete req.controllerData.authorization_header;
  let controllerData = Object.assign({}, req.controllerData);
  delete req.controllerData;
  delete req.body;
  return res.send((controllerData.useSuccessWrapper) ? {
    result: 'success',
    data: controllerData,
  } : controllerData);
}


module.exports = {
  getCase,
  getCases,
  updateCase,
  checkTemplateFieldsExist,
  createCase,
  createCases,
  getTemplate,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getSimulation,
  getSimulations,
  createSimulation,
  createLocalPDF,
  downloadCSV,
  getSimulationCase,
  updateSimulationCase,
  getTemplateFromAWS,
  uploadTemplateToAWS,
  getUploadedDocuments,
  downloadTutorialData,
  generateLocalImageFiles,
  updateSimulationProgress,
  clearTempPDFandImageFiles,
  cleanTextExtractionResults,
  retrieveTextExtractionResults,
  assignFieldsFromTextExtractionResults,
  handleControllerDataResponse,
  fileTypeCheck,
  checkExistingTemplateName,
};
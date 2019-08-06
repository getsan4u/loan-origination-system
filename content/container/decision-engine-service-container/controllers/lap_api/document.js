'use strict';

const periodic = require('periodicjs');
const Promisie = require('promisie');
const logger = periodic.logger;
const jsonToXML = require('convertjson2xml').singleton;
const moment = require('moment');
const fs = Promisie.promisifyAll(require('fs-extra'));
const MAX_DOC_FILESIZE = 10485760;
const Busboy = require('busboy');
const utilities = require('../../utilities');
const helpers = utilities.helpers;

async function getUploadedDocument(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (!/multipart\/form-data/.test(req.headers[ 'content-type' ])) {
      res.set('Connection', 'close');
      return res.status(500).send({ message: 'Please select a file', });
    } else if (req.headers[ 'content-length' ] > MAX_DOC_FILESIZE) {
      return res.status(500).send({ message: `The maximum file size is ${MAX_DOC_FILESIZE / 1048576}MB.`, });
    } else {
      const busboy = new Busboy({ headers: req.headers, });
      const requiredFields = new Set([ 'application_id', 'intermediary_id', 'company_id', 'person_id' ]);
      req.controllerData = req.controllerData || {};
      req.controllerData.newdoc = req.controllerData.newdoc || {};
      req.controllerData.file;
      req.body = req.body || {};
      let hasEntityId = false;
      busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        if (val !== 'undefined') {
          if (requiredFields.has(fieldname)) hasEntityId = true;
          req.controllerData.newdoc[ fieldname ] = val;
        }
      });
      busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        let buffers = [];
        let filesize = 0;
        let fileTypeArr = filename.trim().split('.');
        let fileType = fileTypeArr[ fileTypeArr.length - 1 ];
        file.on('data', chunk => {
          filesize += Buffer.byteLength(chunk);
          buffers.push(chunk);
        });
        file.on('end', () => {
          if (!hasEntityId) {
            res.set('Connection', 'close');
            return res.status(500).send({ message: 'Missing a required field', });
          } else if (req.controllerData.newdoc.name) {
            let name = req.controllerData.newdoc.name;
            const dotIdx = req.controllerData.newdoc.name.indexOf('.');
            name = name.substring(0, dotIdx != -1 ? dotIdx : name.length);
            req.controllerData.newdoc.name = `${name}.${fileType}`;
          } else {
            req.controllerData.newdoc.name = filename;
          }
          req.controllerData.newdoc.filesize = filesize;
          req.controllerData.newdoc.file_extension = fileType;
          req.controllerData.file = Buffer.concat(buffers);
        });
        file.on('error', (e) => {
          logger.error('reading file error', e);
          return next(e);
        });
      });
      busboy.on('finish', function () {
        req.controllerData.newdoc = req.controllerData.newdoc || {};
        next();
      });
      req.pipe(busboy);
    }
  } catch (e) {
    res.status(500).send({ message: 'Error uploading document', });
  }
}

async function uploadDocumentToAWS(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.newdoc = req.controllerData.newdoc || {};
    const file = req.controllerData.file;
    const filename = req.controllerData.newdoc.name;
    const newdoc = req.controllerData.newdoc;
    let Key;
    if (newdoc.application) {
      Key = `los/applicationdocuments/${newdoc.application_id}/${filename}`;
    } else {
      Key = `los/applicationdocuments/${new Date() + filename}`;
    }
    const options = {
      Key,
      Body: file,
    };
    await helpers.uploadAWS(options);
    req.controllerData.newdoc.fileurl = Key;
    next();
  } catch (e) {
    logger.warn(e.message);
    return res.status(500).send({ message: 'Error uploading application document', });
  }
}

async function createDocument(req, res, next) {
  try {
    const LosDoc = periodic.datas.get('standard_losdoc');
    req.controllerData = req.controllerData || {};
    const newdoc = req.controllerData.newdoc;
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';

    newdoc.application = newdoc.application_id || null;
    newdoc.company = newdoc.company_id || null;
    newdoc.intermediary = newdoc.intermediary_id || null;
    newdoc.person = newdoc.person_id || null;
    newdoc.organization = organization;
    newdoc.doc_type = 'file';
    newdoc.user = {
      creator: req.user.name,
      updater: req.user.name,
    };
    const created = await LosDoc.create({ newdoc, });
    req.controllerData.document = created;
    next();
  } catch (e) {
    return res.status(500).send({ message: 'Error creating application document', });
  }
}


async function getDocumentsByAssociations(req, res, next) {
  try {
    const LosDoc = periodic.datas.get('standard_losdoc');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.controllerData = req.controllerData || {};
    const associationSet = new Set([ 'application', 'company', 'intermediary', 'person' ]);
    const association = (req.query && req.query.association && associationSet.has(req.query.association)) ? req.query.association : 'application';
    let documents;
    documents = await LosDoc.model.find({ organization, [ association ]: req.params.id, doc_type: 'file' }).lean();
    req.controllerData.documents = documents.map(doc => {
      return {
        document_id: doc._id.toString(),
        name: doc.name,
        file_extension: doc.file_extension,
        filesize: doc.filesize,
        createdat: doc.createdat.toISOString(),
      };
    })
    next();
  } catch (e) {
    next(e);
  }
}

async function downloadDocument(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const LosDoc = periodic.datas.get('standard_losdoc');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const los_file = await LosDoc.model.findOne({ _id: req.params.id, organization }).lean();
    const s3 = periodic.aws.s3;
    if (los_file && los_file.doc_type === 'file') {
      const container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
      const s3Params = {
        Bucket: `${container_name}`,
        Key: los_file.fileurl,
      };
      const fileData = await s3.getObject(s3Params).promise();
      const fileString = fileData.Body.toString('utf8');
      req.controllerData.fileBuffer = fileData.Body;
      req.controllerData.file = fileString;
    }
    next();
  } catch (e) {
    next(e);
  }
}

async function deleteDocument(req, res, next) {
  try {
    const LosDoc = periodic.datas.get('standard_losdoc');
    const s3 = periodic.aws.s3;
    const container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
    req.controllerData = req.controllerData || {};
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const currentDocument = await LosDoc.model.findOne({ _id: req.params.id, doc_type: 'file', organization, }).lean();
    if (currentDocument) {
      const s3Params = {
        Bucket: `${container_name}`,
        Key: currentDocument.fileurl,
      };
      await s3.deleteObject(s3Params).promise();
      await LosDoc.model.deleteOne({ _id: req.params.id, organization, });
      req.controllerData = {
        document_id: req.params.id,
      }
    }
    next();
  } catch (e) {
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 500,
      status_message: 'Error - Failed to delete document',
      request_data: new Date().toISOString(),
      response_date: new Date().toISOString(),
    }
    next(e);
  }
}

module.exports = {
  createDocument,
  getUploadedDocument,
  getDocumentsByAssociations,
  downloadDocument,
  deleteDocument,
  uploadDocumentToAWS,
};
'use strict';

const periodic = require('periodicjs');
const Zip = require('adm-zip');
const Busboy = require('busboy');
const flatten = require('flat');
const unflatten = flatten.unflatten;
const logger = periodic.logger;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const utilities = require('../../utilities');
const helpers = utilities.helpers;
const transformhelpers = utilities.transformhelpers;
const losControllerUtil = utilities.controllers.los;
const MAX_DOC_FILESIZE = 10485760;
const DocuSign = utilities.docusign;
const url = require('url');

async function downloadFile(req, res, next) {
  try {
    const LosDoc = periodic.datas.get('standard_losdoc');
    const los_file = await LosDoc.model.findOne({ _id: req.params.id, }).lean();
    const s3 = periodic.aws.s3;
    if (los_file && los_file.doc_type === 'file') {
      const container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
      const s3Params = {
        Bucket: `${container_name}`,
        Key: los_file.fileurl,
      };
      res.attachment(los_file.name);
      const s3Stream = s3.getObject(s3Params).createReadStream();
      s3Stream.pipe(res);
    } else {
      req.controllerData = req.controllerData || {};
      req.controllerData.doc = los_file;
      next();
    }
  } catch (e) {
    res.status(500).send({ message: 'Could not download file', });
  }
}

async function downloadFolder(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const los_folder = req.controllerData.doc;
    if (los_folder && los_folder.doc_type === 'folder') {
      const s3 = periodic.aws.s3;
      const container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
      const LosDoc = periodic.datas.get('standard_losdoc');
      const LosApplication = periodic.datas.get('standard_losapplication');
      const application = await LosApplication.model.findOne({ _id: los_folder.application.toString(), }).lean();
      const folderLabel = [ los_folder.name ];
      const zip = new Zip();
      const folderStack = [ { currentFolder: los_folder, folderPath: folderLabel }, ];
      while (folderStack.length) {
        const { currentFolder, folderPath } = folderStack.pop();
        const folderChildren = await LosDoc.model.find({ parent_directory: currentFolder._id.toString(), }).lean();
        const currentFolderPath = folderPath.join('/');
        await Promise.all(folderChildren.map(async (losdoc) => {
          if (losdoc.doc_type === 'folder') folderStack.push({ currentFolder: losdoc, folderPath: folderPath.concat(losdoc.name) });
          else {
            const s3Params = {
              Bucket: `${container_name}`,
              Key: losdoc.fileurl,
            };
            const s3Data = await s3.getObject(s3Params).promise();
            const losDocPath = losdoc.name.split('.');
            if (losDocPath[ losDocPath.length - 1 ] !== losdoc.file_extension) losDocPath.push(losdoc.file_extension);
            zip.addFile(`/${currentFolderPath}/${losDocPath.join('.')}`, s3Data.Body);
          }
        }));
      }
      const exportName = `${application.title}.zip`;
      const zipBuffer = zip.toBuffer();
      res.setHeader('Content-disposition', 'attachment; filename=' + exportName);
      res.setHeader('Content-type', 'application/zip');
      let writeStream = helpers.bufferToStream(zipBuffer).pipe(res);
      writeStream.on('error', next);
      writeStream.on('finish', () => { });
    } else {
      res.status(500).send({ message: 'Could not download file', });
    }
  } catch (e) {
    logger.warn(e.message);
    res.status(500).send({ message: 'Could not download file', });
  }
}

async function getDoc(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const LosDoc = periodic.datas.get('standard_losdoc');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const los_doc = await LosDoc.model.findOne({ _id: req.params.id, organization, }).lean();
    req.controllerData.doc = los_doc;
    next();
  } catch (e) {
    res.status(500).send({ message: 'Could not retrieve document', });
  }
}

async function updateDoc(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const user = req.user || {};
    const parentDoc = req.controllerData.los_parent_doc;
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.body[ 'user.updater' ] = `${user.first_name} ${user.last_name}`;
    const LosDoc = periodic.datas.get('standard_losdoc');
    const updateOptions = {
      query: { _id: req.params.id, organization, },
      updatedoc: req.body,
    };
    const updated = await LosDoc.model.updateOne(updateOptions.query, updateOptions.updatedoc).lean();
    next();
  } catch (e) {
    res.status(500).send({ message: 'Could not retrieve document', });
  }
}

async function redirectToFolder(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const LosDoc = periodic.datas.get('standard_losdoc');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const docId = req.controllerData.document ? req.controllerData.document._id.toString() : req.params.id;
    const doc = await LosDoc.model.findOne({ _id: docId, organization, }).lean();
    res.status(200).send({
      status: 200,
      timeout: 10000,
      type: 'success',
      text: 'Changes saved successfully!',
      successProps: {
        successCallback: 'func:window.closeModalAndCreateNotification',
      },
      responseCallback: 'func:this.props.reduxRouter.push',
      pathname: (doc.parent_directory)
        ? `/los/applications/${doc.application}/docs/${doc.parent_directory}`
        : `/los/applications/${doc.application}/docs`,
    });
  } catch (e) {
    res.status(500).send({ message: 'Could not retrieve document', });
  }
}

async function createDocument(req, res, next) {
  try {
    const LosDoc = periodic.datas.get('standard_losdoc');
    req.controllerData = req.controllerData || {};
    const newdoc = req.controllerData.newdoc;
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';

    if (req.params.id) newdoc.application = req.params.id;
    newdoc.organization = organization;
    newdoc.doc_type = 'file';
    newdoc.user = {
      creator: `${user.first_name} ${user.last_name}`,
      updater: `${user.first_name} ${user.last_name}`,
    };
    const created = await LosDoc.create({ newdoc, });
    req.controllerData.document = created;
    next();
  } catch (e) {
    return res.status(500).send({ message: 'Error creating application document', });
  }
}

async function createFolder(req, res, next) {
  try {
    const LosDoc = periodic.datas.get('standard_losdoc');
    req.controllerData = req.controllerData || {};
    const parentDoc = req.controllerData.los_parent_doc;
    const newdoc = req.body;
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';

    newdoc.application = req.params.id;
    newdoc.organization = organization;
    newdoc.doc_type = 'folder';
    newdoc.user = {
      creator: `${user.first_name} ${user.last_name}`,
      updater: `${user.first_name} ${user.last_name}`,
    };
    const created = await LosDoc.create({ newdoc, });
    req.controllerData.document = created;
    next();
  } catch (e) {
    return res.status(500).send({ message: 'Error creating application document', });
  }
}

async function deleteDocument(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const LosDoc = periodic.datas.get('standard_losdoc');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const s3 = periodic.aws.s3;
    const container_name = periodic.settings.extensions[ 'periodicjs.ext.packagecloud' ].container.name;
    const currentDocument = await LosDoc.model.findOne({ _id: req.params.id, organization, }).lean();
    if (currentDocument.doc_type === 'file') {
      const s3Params = {
        Bucket: `${container_name}`,
        Key: currentDocument.fileurl,
      };
      await s3.deleteObject(s3Params).promise();
      await LosDoc.model.deleteOne({ _id: req.params.id, });
    } else if (currentDocument.doc_type === 'folder') {
      const folderStack = [ currentDocument, ];
      const deleteMongoIds = [];
      const deleteS3Params = {
        Bucket: container_name,
        Delete: {
          Objects: [],
          Quiet: false,
        },
      };
      while (folderStack.length) {
        const currentFolder = folderStack.pop();
        const folderChildren = await LosDoc.model.find({ parent_directory: currentFolder._id.toString(), organization, }).lean();
        folderChildren.forEach((losdoc) => {
          if (losdoc.doc_type === 'folder') folderStack.push(losdoc);
          else {
            deleteS3Params.Delete.Objects.push({ Key: losdoc.fileurl });
            deleteMongoIds.push(losdoc._id.toString());
          }
        });
        deleteMongoIds.push(currentFolder._id.toString());
      }
      if (deleteS3Params && deleteS3Params.Delete && deleteS3Params.Delete.Objects.length) {
        const deleteResult = await s3.deleteObjects(deleteS3Params).promise();
      }
      await LosDoc.model.deleteMany({ _id: { $in: deleteMongoIds, }, });
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    return res.status(500).send({ message: 'Error deleting application document', });
  }
}

async function getDocs(req, res, next) {
  try {
    const Doc = periodic.datas.get('standard_losdoc');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    req.controllerData = req.controllerData || {};
    if (req.query.paginate === 'true') {
      let pagenum = 1;
      if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
      const skip = 50 * (pagenum - 1);
      const sort = (req.query && req.query.sort) ? req.query.sort : 'name';
      const queryOptions = { query: { organization, doc_type: 'file' }, paginate: true, limit: 50, pagelength: 50, skip, sort, population: 'application' };
      const { $and, $or, } = losControllerUtil.__formatDocMongoQuery({ req });
      if ($and && $and.length) queryOptions.query[ '$and' ] = $and;
      if ($or && $or.length) queryOptions.query[ '$or' ] = queryOptions.query[ '$or' ] = $or;
      const docs = await Doc.model.find(queryOptions.query).populate(queryOptions.population).collation({ locale: 'en' }).sort(sort).skip(skip).limit(50).lean();
      const numItems = await Doc.model.countDocuments(queryOptions.query);
      const numPages = Math.ceil(numItems / 50);
      req.controllerData = Object.assign({}, req.controllerData, { rows: docs, skip, numItems, numPages, });
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
      const docs = await Doc.model.find(query).limit(limit).populate(populationFields).sort(sort).lean();
      req.controllerData.docs = docs;
    }
    next();
  } catch (e) {
    next();
  }
}

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
      req.controllerData = req.controllerData || {};
      req.controllerData.newdoc = req.controllerData.newdoc || {};
      req.controllerData.file;
      req.body = req.body || {};
      busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        if (val !== 'undefined') {
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
          if (req.controllerData.newdoc.name) {
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
    res.status(500).send({ message: 'Error uploading template documents', });
  }
}

async function uploadDocumentToAWS(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.newdoc = req.controllerData.newdoc || {};
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const file = req.controllerData.file;
    const filename = req.controllerData.newdoc.name;
    const newdoc = req.controllerData.newdoc;
    let Key;
    if (newdoc.application) {
      Key = `los/applicationdocuments/${newdoc.application}/${filename}`;
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

async function runDocuSign(req, res, next) {
  try {
    const DataIntegration = periodic.datas.get('standard_dataintegration');
    const Organization = periodic.datas.get('standard_organization');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const populatedOrg = await Organization.model.findOne({ _id: organization }).populate('association.client').lean();
    let parsed = url.parse(req.headers.referer).pathname.slice(1).split('/') || [];
    const docuSignConfig = await DataIntegration.model.findOne({ organization, data_provider: 'DocuSign', }).lean();
    const docuSignInstance = new DocuSign(docuSignConfig.default_configuration);
    const templateFields = unflatten(req.body);
    const client = populatedOrg.association.client;
    const client_configs = `client_id=${client.client_id}&client_public_key=${client.public_key}&client_secret=${client.client_secret}`;
    // const hostNameMap = {
    //   'cloud': 'cloud.digifi.io',
    //   'development': 'des-development.digifi.cc'
    // }
    // console.log({ client_configs });
    // console.log({ environment: periodic.environment });
    const webhook_url = (periodic.environment === 'cloud')
      ? `https://cloud.digifi.io/api/v2/docusign/${parsed[ 2 ]}?${client_configs}&user_id=${user._id.toString()}`
      : `https://des-development.digifi.cc/api/v2/docusign/${parsed[ 2 ]}?${client_configs}&user_id=${user._id.toString()}`;
    // console.log({ webhook_url });
    const templateOptions = {
      templateId: req.params.id,
      emailSubject: templateFields.emailSubject,
      templateRoleName: 'signer',
      fullName: templateFields.fullName,
      recipientEmail: templateFields.recipientEmail,
      ccEmail: templateFields.ccEmail,
      custom_fields: templateFields.tab,
      webhook_url
      // webhook_url: 'https://des-development.digifi.cc/api/v2/test',
    };
    docuSignInstance.sendTemplate(templateOptions);
    next();
  } catch (e) {
    return res.status(500).send({ message: 'Error docusigning', });
  }
}

async function getDocuSignTemplates(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const DataIntegration = periodic.datas.get('standard_dataintegration');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const docuSignConfig = await DataIntegration.model.findOne({ organization, data_provider: 'DocuSign' }).lean();
    const docuSignInstance = new DocuSign(docuSignConfig.default_configuration);
    let templates = await docuSignInstance.getTemplates();
    if (docuSignInstance && docuSignInstance.accountId) {
      req.controllerData.docusignAuthenticated = true;
    }
    req.controllerData.docusign_templates = templates;
    next();
  } catch (e) {
    return res.status(500).send({ message: 'Error docusigning', });
  }
}

async function getDocuSignTemplateDetail(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    const DataIntegration = periodic.datas.get('standard_dataintegration');
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const docuSignConfig = await DataIntegration.model.findOne({ organization, data_provider: 'DocuSign', }).lean();
    const docuSignInstance = new DocuSign(docuSignConfig.default_configuration);
    let docusign_template = await docuSignInstance.getTemplateDetail({ templateId: req.params.id, });
    req.controllerData.docusign_template = docusign_template;
    next();
  } catch (e) {
    return res.status(500).send({ message: 'Error docusigning', });
  }
}

async function redirectToTemplateConfigModal(req, res) {
  try {
    return res.status(200).send({
      title: 'Send Documents for Electronic Signature',
      pathname: `/los/docusign/templates/${req.body.docusign_template}`,
    });
  } catch (e) {
    return res.status(500).send({ message: 'Error pulling the template', });
  }
}

async function saveSignedDocusign(req, res, next) {
  try {
    const User = periodic.datas.get('standard_user');
    const docusignEnvelope = req.body.envelopestatus;
    let docusignPDF = req.body.documentpdfs.documentpdf;
    req.controllerData = req.controllerData || {};
    req.controllerData.newdoc = req.controllerData.newdoc || {};
    const file = docusignPDF.pdfbytes ? Buffer.from(docusignPDF.pdfbytes, 'base64') : null;
    const filename = `${docusignEnvelope.completed}_signed_${docusignPDF.name}`;
    const Key = `los/applicationdocuments/${req.params.id}/${filename}`
    const options = {
      Key,
      Body: file,
    };
    const user = await User.model.findOne({ _id: req.query.user_id }).lean();
    if (file) {
      await helpers.uploadToAWSFromStream(options);
      const filesize = await helpers.getFileSizeFromS3({ Key });
      req.controllerData.newdoc.fileurl = Key;
      req.controllerData.newdoc.name = filename;
      req.controllerData.newdoc.file_extension = 'pdf';
      req.controllerData.newdoc.filesize = filesize;
      req.user = user;
      next();
    } else {
      res.status(200).send({ message: 'Did not receive documentpdf' });
    }
  } catch (e) {
    res.status(200).send({ message: `Did not receive documentpdf: ${e.message}` });
  }
}

async function getDocAssociatedEntities(req, res, next) {
  try {
    const Application = periodic.datas.get('standard_losapplication');
    const Company = periodic.datas.get('standard_loscompany');
    const Intermediary = periodic.datas.get('standard_losintermediary');
    const Person = periodic.datas.get('standard_losperson');
    const user = req.user;
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    if (req.query && req.query.association) {
      if (req.query.association === 'company') {
        const companies = await Company.model.find({ organization }).collation({ locale: 'en' }).sort('name').lean();
        req.controllerData.company = companies;
      } else if (req.query.association === 'intermediary') {
        const intermediaries = await Intermediary.model.find({ organization }).collation({ locale: 'en' }).sort('name').lean();
        req.controllerData.intermediary = intermediaries;
      } else if (req.query.association === 'person') {
        const people = await Person.model.find({ organization }).collation({ locale: 'en' }).sort('name').lean();
        req.controllerData.person = people;
      } else if (req.query.association === 'application') {
        const applications = await Application.model.find({ organization }).collation({ locale: 'en' }).sort('title').lean();
        req.controllerData.application = applications;
      }
    }
    next();
  } catch (e) {
    res.status(402).send({ message: 'Could not find the requested entity' });
  }
}

module.exports = {
  getDoc,
  getDocs,
  downloadFile,
  downloadFolder,
  updateDoc,
  redirectToFolder,
  createDocument,
  createFolder,
  deleteDocument,
  getUploadedDocument,
  uploadDocumentToAWS,
  runDocuSign,
  getDocuSignTemplates,
  getDocuSignTemplateDetail,
  redirectToTemplateConfigModal,
  saveSignedDocusign,
  getDocAssociatedEntities,
};
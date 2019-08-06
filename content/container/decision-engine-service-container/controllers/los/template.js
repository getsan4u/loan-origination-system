'use strict';

const periodic = require('periodicjs');
const Busboy = require('busboy');
const pdfFiller = require('pdffiller-stream');
const Promisie = require('promisie');
const fs = Promisie.promisifyAll(require('fs-extra'));
const path = require('path');
const logger = periodic.logger;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const utilities = require('../../utilities');
const helpers = utilities.helpers;
const transformhelpers = utilities.transformhelpers;

async function createTemplate(req, res, next) {
  try {
    const Template = periodic.datas.get('standard_lostemplate');
    req.controllerData = req.controllerData || {};
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    if (req.controllerData.newdoc) {
      req.controllerData.newdoc.user = {};
      req.controllerData.newdoc.user.creator = `${user.first_name} ${user.last_name}`;
      req.controllerData.newdoc.user.updater = `${user.first_name} ${user.last_name}`;
      let created;
      created = await Template.create({ newdoc: Object.assign({ organization, }, req.controllerData.newdoc), });
      req.controllerData.template = created;
    }
    delete req.controllerData.newdoc;
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getTemplate(req, res, next) {
  try {
    const Template = periodic.datas.get('standard_lostemplate');
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    const _id = (req.query && req.query.template_param) ? req.params[ req.query.template_param ] : req.params.id;
    const template = await Template.model.findOne({ _id, organization, }).lean();
    req.controllerData = req.controllerData || {};
    req.controllerData.template = template;
    next();
  } catch (e) {
    logger.warn(e.message);
    next();
  }
}

async function updateTemplate(req, res, next) {
  try {
    const Template = periodic.datas.get('standard_lostemplate');
    req.controllerData = req.controllerData || {};
    let updateOptions = {};
    if (req.query.type === 'patch_field_item') {
      req.body = { [ `fields.${req.body.name}` ]: { value_type: req.body.value_type, value: req.body.value, } };
    } else if (req.query.type === 'upload_template' && req.controllerData && req.controllerData.newdoc) {
      req.body = {
        fileurl: req.controllerData.newdoc.fileurl,
        fields: req.controllerData.newdoc.fields,
        images: req.controllerData.newdoc.images,
      };
    }
    updateOptions = {
      query: { _id: req.params.id, },
      updatedoc: { $set: req.body, },
    };
    await Template.model.updateOne(updateOptions.query, updateOptions.updatedoc);
    next();
  } catch (e) {
    next(e);
  }
}

async function getTemplates(req, res, next) {
  try {
    const Template = periodic.datas.get('standard_lostemplate');
    req.controllerData = req.controllerData || {};
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    if (req.query && req.query.paginate) {
      let pagenum = 1;
      if (req.query && req.query.pagenum) pagenum = Number(req.query.pagenum);
      let skip = 50 * (pagenum - 1);
      const sort = (req.query && req.query.sort) ? req.query.sort : '-createdat';
      let queryOptions = { query: { organization, }, paginate: true, limit: 50, pagelength: 50, skip, sort, population: '' };
      let result = await Template.query(queryOptions);
      const numItems = await Template.model.countDocuments(queryOptions.query);
      const numPages = Math.ceil(numItems / 50);
      let templates = (result && result[ '0' ] && result[ '0' ].documents) ? result[ '0' ].documents : [];
      templates = templates.map(app => app = app.toJSON ? app.toJSON() : app);
      req.controllerData = Object.assign({}, req.controllerData, { rows: templates, skip, numItems, numPages, });
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
      const templates = await Template.model.find(query).limit(limit).populate(populationFields).sort(sort).lean();
      req.controllerData.templates = templates;
    }
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getUploadedTemplate(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (!/multipart\/form-data/.test(req.headers[ 'content-type' ])) {
      res.set('Connection', 'close');
      return res.status(500).send({ message: 'Please select a file', });
    } else {
      const busboy = new Busboy({ headers: req.headers, });
      req.controllerData = req.controllerData || {};
      req.controllerData.newdoc = req.controllerData.newdoc || {};
      req.controllerData.original_filenames = [];
      req.controllerData.file;
      req.body = req.body || {};
      let hasTemplate = true;
      let isProperFileType = true;
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
            req.controllerData.file = Buffer.concat(buffers);
          });
          file.on('error', (e) => {
            logger.error('reading file error', e);
            return next(e);
          });
        }
      });
      busboy.on('finish', function () {
        req.controllerData.newdoc = req.controllerData.newdoc || {};
        if (hasTemplate && isProperFileType) next();
        else return res.status(404).send({ message: 'STOP HEREEEEE' });
      });
      req.pipe(busboy);
    }
  } catch (e) {
    res.status(500).send({ message: 'Error uploading template documents', });
  }
}


async function uploadTemplateToAWS(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.newdoc = req.controllerData.newdoc || {};
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    let original_filename = req.controllerData.original_filenames[ 0 ];
    if (original_filename) original_filename = original_filename.replace('.pdf', '');
    const file = req.controllerData.file;
    const filename = `${new Date().getTime()}_${original_filename}.pdf`;
    const options = {
      Key: `los_templates/${organization}/${filename}`,
      Body: file,
    };
    await helpers.uploadAWS(options);
    req.controllerData.newdoc.fileurl = filename;
    next();
  } catch (e) {
    logger.warn(e.message);
    return res.status(500).send({ message: 'Error uploading template documents', });
  }
}

async function extractTemplateFields(req, res, next) {
  try {
    const filebuffer = req.controllerData.file;
    const local_filename = `temp_pdf_file_${new Date().getTime()}.pdf`;
    const filepath = path.join(process.cwd(), `content/files/${local_filename}`);
    req.controllerData = req.controllerData || {};
    req.controllerData.newdoc = req.controllerData.newdoc || {};
    req.controllerData.local_pdf_filepath = filepath;
    await fs.writeFile(filepath, filebuffer);
    const fields = await pdfFiller.generateFDFTemplate(filepath, null);
    req.controllerData.newdoc.fields = fields || {};
    // await fs.remove(filepath);
    next();
  } catch (e) {
    return res.status(500).send({ message: 'Error uploading template documents', });
  }
}

async function generateImageFiles(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.newdoc = req.controllerData.newdoc || {};
    let PDFImage = require('pdf-image').PDFImage;
    const local_pdf_filepath = req.controllerData.local_pdf_filepath;
    const user = req.user;
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const original_filename = req.controllerData.original_filenames[ 0 ];
    const pdfimage = new PDFImage(local_pdf_filepath, {
      convertExtension: 'png', convertOptions: {
        '-colorspace': '"RGB"',
        '-interlace': '"none"',
        '-density': '300',
        '-quality': '100',
        '-background': '"#FFFFFF"',
        '-flatten': ''
      },
    });
    const image_file_paths = await pdfimage.convertFile();
    const aws_jpg_keys = await Promise.all(image_file_paths.map(async (filepath, idx) => {
      const file = await fs.readFile(filepath);
      const filename = `${new Date().getTime()}_${idx}_${original_filename}.jpg`;
      const options = {
        Key: `los_templates/${organization}/${filename}`,
        Body: file,
      };
      await helpers.uploadAWS(options);
      await fs.remove(filepath);
      return filename;
    }));
    await fs.remove(local_pdf_filepath);
    req.controllerData.newdoc.images = aws_jpg_keys || [];
    next();
  } catch (e) {
    return res.status(500).send({ message: 'Error uploading template documents', });
  }
}


async function deleteOldTemplateFromAWS(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.newdoc = req.controllerData.newdoc || {};
    let user = req.user;
    let organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const filename = req.controllerData.template.fileurl;
    const Key = `los_templates/${organization}/${filename}`;
    await helpers.deleteAWS({ Key });
    req.controllerData.template.images = req.controllerData.template.images || [];
    req.controllerData.template.images.forEach(imagepath => {
      helpers.deleteAWS({ Key: `los_templates/${organization}/${imagepath}` });
    });
    next();
  } catch (e) {
    logger.warn(e.message);
    return res.status(500).send({ message: 'Error uploading template documents', });
  }
}

async function downloadTemplateFromAWS(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.newdoc = req.controllerData.newdoc || {};
    const user = req.user;
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
    const filename = req.controllerData.template.fileurl;
    const fileurl = `los_templates/${organization}/${filename}`;
    const template_file = await helpers.downloadAWS({ fileurl, });
    const local_filename = `temp_pdf_file_${new Date().getTime()}.pdf`;
    const filepath = path.join(process.cwd(), `content/files/${local_filename}`);
    await fs.writeFile(filepath, template_file);
    req.controllerData.template_filepath = filepath;
    next();
  } catch (e) {
    logger.warn(e.message);
    return res.status(500).send({ message: 'Error uploading template documents', });
  }
}

async function createDocFromTemplate(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.newdoc = req.controllerData.newdoc || {};
    const template = req.controllerData.template;
    const application = req.controllerData.application;
    const filename = `${template.name}_${application.title}_${new Date().getTime()}.pdf`;
    const template_filepath = req.controllerData.template_filepath;
    const outputStream = await pdfFiller.fillForm(template_filepath, req.body.fields);
    req.controllerData.newdoc = {
      name: filename,
      parent_directory: req.body.parent_directory,
      file: outputStream,
      file_extension: 'pdf',
    };
    next();
  } catch (e) {
    logger.warn(e.message);
    return res.status(500).send({ message: 'Error uploading template documents', });
  }
}

async function removeTemporaryFile(req, res, next) {
  try {
    const template_filepath = req.controllerData.template_filepath;
    await fs.remove(template_filepath);
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function deleteTemplate(req, res, next) {
  try {
    const Template = periodic.datas.get('standard_lostemplate');
    req.controllerData = req.controllerData || {};
    await Template.model.deleteOne({ _id: req.params.id });
    next();
  } catch (e) {
    logger.warn(e.message);
    next(e);
  }
}

async function getTemplateFromAWS(req, res, next) {
  try {
    req.controllerData = req.controllerData || {};
    if (Array.isArray(req.controllerData.template.images) && req.controllerData.template.images.length) {
      const user = req.user;
      const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id : 'organization';
      let current_filepath = req.controllerData.template.images[ req.params.page ];
      let fileurl = `los_templates/${organization}/${current_filepath}`;
      let filedata = await helpers.downloadAWS({ fileurl, });
      let filestring = 'data:image/jpg;base64,' + new Buffer(filedata).toString('base64');
      req.controllerData.template_string = filestring;
    } else {
      req.controllerData.template_string = '';
    }
    next();
  } catch (e) {
    res.status(500).send({ message: 'Error uploading OCR template.', });
  }
}

module.exports = {
  getTemplates,
  getTemplate,
  createTemplate,
  getUploadedTemplate,
  uploadTemplateToAWS,
  extractTemplateFields,
  updateTemplate,
  deleteOldTemplateFromAWS,
  downloadTemplateFromAWS,
  createDocFromTemplate,
  removeTemporaryFile,
  deleteTemplate,
  generateImageFiles,
  getTemplateFromAWS,
};
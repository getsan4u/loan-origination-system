'use strict';

/** Routes for Simulation */

const periodic = require('periodicjs');
const controllers = require('../controllers');
const transformController = controllers.transform;
const losController = controllers.los;
const integrationController = controllers.integration;
const apiController = controllers.api;
const LosRouter = periodic.express.Router();
const ensureApiAuthenticated = periodic.controllers.extension.get('periodicjs.ext.oauth2server').auth.ensureApiAuthenticated;

LosRouter.get('/get_parsed_url',
  ensureApiAuthenticated,
  losController.getParsedUrl,
  losController.handleControllerDataResponse)

LosRouter.get('/download_sample_template',
  ensureApiAuthenticated,
  losController.downloadSampleData);

LosRouter.get('/moduledata',
  ensureApiAuthenticated,
  losController.getParsedUrl,
  losController.getModuleResources,
  losController.handleControllerDataResponse);

// Documents GET

LosRouter.get('/docs',
  ensureApiAuthenticated,
  losController.doc.getDocs,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/docs/new',
  ensureApiAuthenticated,
  // losController.application.getApplications,
  losController.doc.getDocAssociatedEntities,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/docs/docusign/get_templates',
  ensureApiAuthenticated,
  // losController.doc.runDocuSign,
  losController.doc.getDocuSignTemplates,
  transformController.posttransform,
  // losController.doc.getDocuSignTemplateDetail,
  losController.handleControllerDataResponse);

LosRouter.get('/docs/docusign/templates/:id',
  ensureApiAuthenticated,
  // losController.doc.runDocuSign,
  // losController.doc.getDocuSignTemplates,
  losController.doc.getDocuSignTemplateDetail,
  losController.application.getApplicationFromURL,
  losController.application.getApplicationCustomer,
  losController.application.getApplicationIntermediary,
  losController.application.getApplicationCoapplicant,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/docs/:id',
  ensureApiAuthenticated,
  losController.doc.getDoc,
  transformController.posttransform,
  losController.handleControllerDataResponse)

LosRouter.get('/docs/:id/download_doc',
  losController.doc.downloadFile,
  losController.doc.downloadFolder,
  losController.handleControllerDataResponse)

// LosRouter.get('/docs/:id/run_docusign',
//   ensureApiAuthenticated,
//   // losController.doc.runDocuSign,
//   // losController.doc.getDocuSignTemplates,
//   losController.doc.getDocuSignTemplateDetail,
//   losController.handleControllerDataResponse)

LosRouter.get('/docs/:id/edit_file/:application_id',
  ensureApiAuthenticated,
  losController.doc.getDoc,
  losController.application.getFolders,
  transformController.posttransform,
  losController.handleControllerDataResponse)

// Documents POST

LosRouter.post('/docs',
  ensureApiAuthenticated,
  losController.doc.getUploadedDocument,
  losController.doc.uploadDocumentToAWS,
  losController.doc.createDocument,
  losController.handleControllerDataResponse);

LosRouter.post('/docs/docusign/get_template_modal',
  ensureApiAuthenticated,
  losController.doc.redirectToTemplateConfigModal);

LosRouter.post('/docs/docusign/templates/:id',
  ensureApiAuthenticated,
  losController.doc.runDocuSign,
  losController.handleControllerDataResponse);


// Documents PUT

LosRouter.put('/docs/:id',
  ensureApiAuthenticated,
  losController.doc.getDoc,
  transformController.pretransform,
  losController.doc.updateDoc,
  losController.handleControllerDataResponse)

LosRouter.put('/docs/:id/edit_file',
  ensureApiAuthenticated,
  losController.doc.getDoc,
  transformController.pretransform,
  losController.application.getParentDocument,
  losController.doc.updateDoc,
  losController.doc.redirectToFolder)

// Documents DELETE
LosRouter.delete('/docs/:id',
  ensureApiAuthenticated,
  losController.doc.deleteDocument,
  losController.handleControllerDataResponse);

//Applications GET
LosRouter.get('/applications/swimlane',
  ensureApiAuthenticated,
  losController.generateUserImageMap,
  losController.application.getApplications,
  losController.application.getTeamMembers,
  losController.status.retrieveLosStatusesFromOrg,
  transformController.posttransform,
  losController.handleControllerDataResponse)

LosRouter.get('/applications',
  ensureApiAuthenticated,
  losController.application.getApplications,
  losController.getTeamMembersAndUserImageMap,
  losController.status.getLosStatuses,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/applications/new',
  ensureApiAuthenticated,
  losController.status.retrieveLosStatusesFromOrg,
  losController.application.getProducts,
  losController.application.getTeamMembers,
  losController.label.getLabels,
  losController.customer.getCustomers,
  losController.intermediary.getIntermediarires,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/applications/:id',
  ensureApiAuthenticated,
  losController.application.getApplication,
  losController.application.getProducts,
  losController.application.getTeamMembers,
  losController.status.getLosStatuses,
  losController.label.getLabels,
  losController.intermediary.getIntermediarires,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/applications/:id/searchLoanInformation',
  ensureApiAuthenticated,
  losController.application.getApplication,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/applications/:id/docs',
  ensureApiAuthenticated,
  losController.application.getApplication,
  losController.label.getAllLabels,
  losController.application.getDocs,
  losController.application.checkDocusignExists,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/applications/:id/docs/new',
  ensureApiAuthenticated,
  losController.application.getApplication,
  losController.application.getFolders,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/applications/:id/docs/:file_id',
  ensureApiAuthenticated,
  losController.application.getApplication,
  losController.label.getAllLabels,
  losController.application.getDocs,
  losController.application.checkDocusignExists,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/applications/:id/communications',
  ensureApiAuthenticated,
  losController.application.getApplication,
  losController.label.getAllLabels,
  losController.application.getCommunications,
  losController.getTeamMembersAndUserImageMap,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/applications/:id/tasks',
  ensureApiAuthenticated,
  losController.application.getApplication,
  losController.label.getAllLabels,
  losController.getTeamMembersAndUserImageMap,
  losController.application.getTasks,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/applications/:id/cases',
  ensureApiAuthenticated,
  losController.application.getUnderwritingCases,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/applications/:id/key_information/:idx',
  ensureApiAuthenticated,
  losController.application.getApplication,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/applications/:id/notes',
  ensureApiAuthenticated,
  losController.application.getNotes,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/applications/:id/select_template',
  ensureApiAuthenticated,
  losController.application.getApplication,
  losController.template.getTemplates,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/applications/:id/generate_doc/:template',
  ensureApiAuthenticated,
  losController.application.getApplication,
  losController.application.getFolders,
  losController.template.getTemplate,
  losController.application.getApplicationCustomer,
  losController.application.getApplicationIntermediary,
  losController.application.getApplicationCoapplicant,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/applications/:id/run_automation/decision/:strategy',
  ensureApiAuthenticated,
  losController.getStrategyById,
  losController.application.getApplication,
  losController.application.getApplicationCustomer,
  integrationController.getDataIntegrations,
  apiController.initializeStrategyForApiCompilation,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/applications/:id/run_automation/ml/:mlmodel',
  ensureApiAuthenticated,
  losController.getMlModelById,
  losController.application.getApplication,
  losController.application.getApplicationCustomer,
  transformController.posttransform,
  losController.handleControllerDataResponse);

//Applications POST
LosRouter.post('/applications',
  ensureApiAuthenticated,
  losController.application.getProducts,
  losController.application.checkProductCustomer,
  transformController.pretransform,
  losController.application.createApplication,
  losController.application.redirectToApplicationDetail);

LosRouter.post('/applications/:id/select_automation',
  ensureApiAuthenticated,
  transformController.pretransform,
  losController.application.redirectToRunAutomationModal);

LosRouter.post('/applications/:id/select_template',
  ensureApiAuthenticated,
  losController.application.redirectToGenerateDocModal);

LosRouter.post('/applications/:id/docs/new_folder',
  ensureApiAuthenticated,
  losController.application.getParentDocument,
  losController.doc.createFolder,
  losController.doc.redirectToFolder);

LosRouter.post('/applications/:id/docs',
  ensureApiAuthenticated,
  losController.doc.getUploadedDocument,
  losController.application.uploadDocumentToAWS,
  losController.application.getParentDocument,
  losController.doc.createDocument,
  transformController.posttransform,
  losController.doc.redirectToFolder);

LosRouter.post('/applications/:id/generate_doc/:template',
  ensureApiAuthenticated,
  losController.application.getApplication,
  losController.application.getApplicationCustomer,
  losController.template.getTemplate,
  losController.application.extractGenerateDocFields,
  losController.template.downloadTemplateFromAWS,
  losController.template.createDocFromTemplate,
  losController.application.uploadStreamDocumentToAWS,
  losController.template.removeTemporaryFile,
  losController.application.getParentDocument,
  losController.doc.createDocument,
  losController.doc.redirectToFolder
);

//Applications PUT
LosRouter.put('/applications/:id',
  ensureApiAuthenticated,
  transformController.pretransform,
  losController.status.retrieveLosStatusesFromOrg,
  losController.application.updateApplication,
  losController.handleControllerDataResponse);

LosRouter.put('/applications/:id/key_information/:idx',
  ensureApiAuthenticated,
  losController.application.getApplication,
  losController.application.updateApplication,
  losController.handleControllerDataResponse);

LosRouter.put('/applications/:id/cases/:caseid/output_variables/',
  ensureApiAuthenticated,
  losController.application.addOutputVariableToApplicationInfo,
  losController.handleControllerDataResponse);

//Applications DELETE

LosRouter.delete('/applications/:id',
  ensureApiAuthenticated,
  losController.application.deleteApplication,
  losController.handleControllerDataResponse);

//Customers GET
LosRouter.get('/customers',
  ensureApiAuthenticated,
  losController.customer.getCustomers,
  losController.getTeamMembersAndUserImageMap,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/customers/:id/notes',
  ensureApiAuthenticated,
  losController.customer.getNotes,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/customers/companies/new',
  ensureApiAuthenticated,
  losController.customer.getCustomers,
  losController.customertemplate.getCustomerTemplates,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/customers/companies/:id/add_person',
  ensureApiAuthenticated,
  losController.customer.getCompany,
  losController.customer.getCompanyPeople,
  losController.customer.getCustomers,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/customers/companies/:id',
  ensureApiAuthenticated,
  losController.customer.getCompany,
  losController.customer.getCompanyApplications,
  losController.customer.getCompanyPeople,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/customers/companies/:id/key_information/:idx',
  ensureApiAuthenticated,
  losController.customer.getCompany,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/customers/people/:id/key_information/:idx',
  ensureApiAuthenticated,
  losController.customer.getPerson,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/customers/companies/:id/people',
  ensureApiAuthenticated,
  losController.customer.getCompany,
  losController.customer.getCompanyPeople,
  transformController.posttransform,
  losController.handleControllerDataResponse)

LosRouter.get('/customers/companies/:id/tasks',
  ensureApiAuthenticated,
  losController.customer.getCompany,
  losController.getTeamMembersAndUserImageMap,
  losController.customer.getCompanyTasks,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/customers/people/:id/tasks',
  ensureApiAuthenticated,
  losController.customer.getPerson,
  losController.getTeamMembersAndUserImageMap,
  losController.customer.getPersonTasks,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/customers/companies/:id/docs',
  ensureApiAuthenticated,
  losController.customer.getCompany,
  losController.label.getAllLabels,
  losController.customer.getCompanyDocs,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/customers/people/:id/docs',
  ensureApiAuthenticated,
  losController.customer.getPerson,
  losController.label.getAllLabels,
  losController.customer.getPersonDocs,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/customers/people/new',
  ensureApiAuthenticated,
  losController.customer.getCustomers,
  losController.customertemplate.getCustomerTemplates,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/customers/people/:id',
  ensureApiAuthenticated,
  losController.customer.getCustomers,
  losController.customer.getPerson,
  losController.customer.getPersonApplications,
  transformController.posttransform,
  losController.handleControllerDataResponse)

LosRouter.get('/customers/companies/:id/communications',
  ensureApiAuthenticated,
  losController.customer.getCompany,
  losController.customer.getCommunications,
  losController.getTeamMembersAndUserImageMap,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/customers/people/:id/communications',
  ensureApiAuthenticated,
  losController.customer.getPerson,
  losController.customer.getCommunications,
  losController.getTeamMembersAndUserImageMap,
  transformController.posttransform,
  losController.handleControllerDataResponse);

// Customers POST

LosRouter.post('/customers',
  ensureApiAuthenticated,
  losController.customer.createCustomer,
  losController.customer.updateNewCompanyPrimaryContact,
  losController.customer.updateNewIntermediaryPrimaryContact,
  losController.customer.redirectToCustomerDetail,
  losController.customer.addCompanyToPerson,
  losController.handleControllerDataResponse);

// Customers PUT
LosRouter.put('/customers/companies/:id',
  ensureApiAuthenticated,
  transformController.pretransform,
  losController.customer.updateCompany,
  losController.handleControllerDataResponse);

LosRouter.put('/customers/people/:id',
  ensureApiAuthenticated,
  transformController.pretransform,
  losController.customer.getPerson,
  losController.customer.updateExistingCompanyPrimaryContact,
  losController.customer.updateExistingIntermediaryPrimaryContact,
  losController.customer.updatePerson,
  losController.handleControllerDataResponse);

LosRouter.put('/customers/companies/:id/key_information/:idx',
  ensureApiAuthenticated,
  losController.customer.getCompany,
  losController.customer.updateMongoCompany,
  losController.handleControllerDataResponse);

LosRouter.put('/customers/people/:id/key_information/:idx',
  ensureApiAuthenticated,
  losController.customer.getPerson,
  losController.customer.updateMongoPerson,
  losController.handleControllerDataResponse);

// Customers DELETE
LosRouter.delete('/customers/companies/:id',
  ensureApiAuthenticated,
  losController.customer.deleteCompany,
  losController.handleControllerDataResponse);

LosRouter.delete('/customers/people/:id',
  ensureApiAuthenticated,
  losController.customer.deletePerson,
  losController.handleControllerDataResponse);

// Customer Templates GET
LosRouter.get('/customer_templates',
  ensureApiAuthenticated,
  losController.customertemplate.getCustomerTemplates,
  transformController.posttransform,
  losController.handleControllerDataResponse)

LosRouter.get('/customer_templates/:id/template/:idx',
  ensureApiAuthenticated,
  losController.customertemplate.getCustomerTemplate,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/customer_templates/:id/getTemplateId',
  ensureApiAuthenticated,
  losController.customertemplate.setCustomerTemplateId,
  losController.handleControllerDataResponse);

// Customer Templates PUT
LosRouter.put('/customer_templates/:id',
  ensureApiAuthenticated,
  losController.customertemplate.updateCustomerTemplate,
  losController.handleControllerDataResponse);

LosRouter.put('/customer_templates/:id/template/:idx',
  ensureApiAuthenticated,
  losController.customertemplate.getCustomerTemplate,
  losController.customertemplate.updateCustomerTemplate,
  losController.handleControllerDataResponse);

// Products GET
LosRouter.get('/products',
  ensureApiAuthenticated,
  losController.application.getProducts,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/products/:id',
  ensureApiAuthenticated,
  losController.application.getProduct,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/products/:id/template/:idx',
  ensureApiAuthenticated,
  losController.application.getProduct,
  transformController.posttransform,
  losController.handleControllerDataResponse);

// Products POST
LosRouter.post('/products',
  ensureApiAuthenticated,
  losController.application.createProduct,
  losController.redirectToProduct);

// Products PUT  
LosRouter.put('/products/:id',
  ensureApiAuthenticated,
  losController.application.updateProduct,
  losController.handleControllerDataResponse);

LosRouter.put('/products/:id/template/:idx',
  ensureApiAuthenticated,
  losController.application.getProduct,
  losController.application.updateProduct,
  losController.handleControllerDataResponse);

// Products PUT  
LosRouter.delete('/products/:id',
  ensureApiAuthenticated,
  losController.deleteProduct,
  losController.handleControllerDataResponse);

// Tasks GET
LosRouter.get('/tasks',
  ensureApiAuthenticated,
  losController.getTeamMembersAndUserImageMap,
  losController.task.getTasks,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/tasks/new',
  ensureApiAuthenticated,
  losController.application.getApplications,
  losController.application.getTeamMembers,
  losController.customer.getCustomers,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/tasks/:id',
  ensureApiAuthenticated,
  losController.task.getTask,
  losController.application.getApplications,
  losController.application.getTeamMembers,
  losController.customer.getCustomers,
  transformController.posttransform,
  losController.handleControllerDataResponse);

// Tasks POST
LosRouter.post('/tasks',
  ensureApiAuthenticated,
  losController.task.createTask,
  losController.handleControllerDataResponse);

// Tasks PUT
LosRouter.put('/tasks/:id',
  ensureApiAuthenticated,
  losController.task.updateTask,
  losController.handleControllerDataResponse);

// Tasks DELETE
LosRouter.delete('/tasks/:id',
  ensureApiAuthenticated,
  losController.task.deleteTask,
  losController.handleControllerDataResponse);

// Taskbots GET
LosRouter.get('/taskbots',
  ensureApiAuthenticated,
  losController.taskbot.getTaskBots,
  transformController.posttransform,
  losController.handleControllerDataResponse);

// Templates GET 
LosRouter.get('/templates',
  ensureApiAuthenticated,
  losController.template.getTemplates,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/templates/:id/:page',
  ensureApiAuthenticated,
  losController.template.getTemplate,
  losController.template.getTemplateFromAWS,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/templates/:id/field/:idx',
  ensureApiAuthenticated,
  losController.template.getTemplate,
  transformController.posttransform,
  losController.handleControllerDataResponse);


// Templates POST
LosRouter.post('/templates',
  ensureApiAuthenticated,
  losController.template.getUploadedTemplate,
  losController.template.extractTemplateFields,
  losController.template.generateImageFiles,
  losController.template.uploadTemplateToAWS,
  losController.template.createTemplate,
  losController.handleControllerDataResponse);

// Templates PUT
LosRouter.put('/templates/:id/upload_template',
  ensureApiAuthenticated,
  losController.template.getTemplate,
  losController.template.getUploadedTemplate,
  losController.template.extractTemplateFields,
  losController.template.generateImageFiles,
  losController.template.uploadTemplateToAWS,
  losController.template.deleteOldTemplateFromAWS,
  losController.template.updateTemplate,
  losController.handleControllerDataResponse);

LosRouter.put('/templates/:id',
  ensureApiAuthenticated,
  losController.template.updateTemplate,
  losController.handleControllerDataResponse);

// Templates DELETE

LosRouter.delete('/templates/:id',
  ensureApiAuthenticated,
  losController.template.getTemplate,
  losController.template.deleteOldTemplateFromAWS,
  losController.template.deleteTemplate,
  losController.handleControllerDataResponse);

// Communications GET
LosRouter.get('/communications',
  ensureApiAuthenticated,
  losController.communication.getCommunications,
  losController.getTeamMembersAndUserImageMap,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/communications/new',
  ensureApiAuthenticated,
  losController.application.getApplications,
  losController.application.getTeamMembers,
  losController.customer.getCustomers,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/communications/:id',
  ensureApiAuthenticated,
  losController.communication.getCommunication,
  losController.application.getApplications,
  losController.application.getTeamMembers,
  losController.customer.getCustomers,
  transformController.posttransform,
  losController.handleControllerDataResponse);

// Communications POST
LosRouter.post('/communications',
  ensureApiAuthenticated,
  losController.communication.createCommunication,
  losController.handleControllerDataResponse);

// Communications PUT
LosRouter.put('/communications/:id',
  ensureApiAuthenticated,
  losController.communication.updateCommunication,
  losController.handleControllerDataResponse);

// Communications DELETE
LosRouter.delete('/communications/:id',
  ensureApiAuthenticated,
  losController.communication.deleteCommunication,
  losController.handleControllerDataResponse);

// NOTES GET
LosRouter.get('/notes/:id',
  ensureApiAuthenticated,
  losController.note.getNote,
  losController.handleControllerDataResponse);

// NOTES POST
LosRouter.post('/notes',
  ensureApiAuthenticated,
  losController.note.createNote,
  losController.handleControllerDataResponse);

// NOTES PUT
LosRouter.put('/notes/:id',
  ensureApiAuthenticated,
  losController.note.updateNote,
  losController.handleControllerDataResponse);
// NOTES DELETE
LosRouter.delete('/notes/:id',
  ensureApiAuthenticated,
  losController.note.deleteNote,
  losController.handleControllerDataResponse);

// LOSSTATUS GET

LosRouter.get('/statuses/:id',
  ensureApiAuthenticated,
  losController.status.getLosStatus,
  losController.handleControllerDataResponse);

// LOSSTATUS PUT

LosRouter.put('/statuses/:id',
  ensureApiAuthenticated,
  losController.status.updateLosStatus,
  losController.handleControllerDataResponse);

// APPLICATIONLABELS GET 
LosRouter.get('/applicationlabels',
  ensureApiAuthenticated,
  losController.label.getLabels,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/applicationlabels/:id',
  ensureApiAuthenticated,
  losController.label.getLabel,
  losController.handleControllerDataResponse);

// APPLICATIONLABELS POST 
LosRouter.post('/applicationlabels',
  ensureApiAuthenticated,
  losController.label.createLabel,
  losController.handleControllerDataResponse);

// APPLICATIONLABELS PUT 
LosRouter.put('/applicationlabels/:id',
  ensureApiAuthenticated,
  losController.label.updateLabel,
  losController.handleControllerDataResponse);

// APPLICATIONLABELS DELETE
LosRouter.delete('/applicationlabels/:id',
  ensureApiAuthenticated,
  losController.label.deleteLabel,
  losController.handleControllerDataResponse);

//Intermediary GET
LosRouter.get('/intermediaries',
  ensureApiAuthenticated,
  losController.intermediary.getIntermediarires,
  losController.getTeamMembersAndUserImageMap,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/intermediaries/new',
  ensureApiAuthenticated,
  losController.customer.getCustomers,
  losController.customertemplate.getCustomerTemplates,
  transformController.posttransform,
  losController.handleControllerDataResponse);

//Applications GET

LosRouter.get('/intermediaries/:id',
  ensureApiAuthenticated,
  losController.intermediary.getIntermediary,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/intermediaries/:id/docs',
  ensureApiAuthenticated,
  losController.intermediary.getIntermediary,
  losController.intermediary.getIntermediaryDocs,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/intermediaries/:id/people',
  ensureApiAuthenticated,
  losController.intermediary.getIntermediaryPeople,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/intermediaries/:id/add_person',
  ensureApiAuthenticated,
  losController.intermediary.getIntermediary,
  losController.customer.getCustomers,
  losController.intermediary.getIntermediarires,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/intermediaries/:id/applications/swimlane',
  ensureApiAuthenticated,
  losController.intermediary.getIntermediary,
  losController.generateUserImageMap,
  losController.intermediary.getApplications,
  losController.application.getTeamMembers,
  losController.status.retrieveLosStatusesFromOrg,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/intermediaries/:id/applications/table',
  ensureApiAuthenticated,
  transformController.posttransform,
  losController.handleControllerDataResponse);

LosRouter.get('/intermediaries/:id/applications',
  ensureApiAuthenticated,
  losController.intermediary.getIntermediary,
  losController.intermediary.getApplications,
  losController.getTeamMembersAndUserImageMap,
  losController.status.getLosStatuses,
  transformController.posttransform,
  losController.handleControllerDataResponse);


LosRouter.get('/intermediaries/:id/key_information/:idx',
  ensureApiAuthenticated,
  losController.intermediary.getIntermediary,
  transformController.posttransform,
  losController.handleControllerDataResponse);

//Intermediary POST

LosRouter.post('/intermediaries',
  ensureApiAuthenticated,
  losController.intermediary.createIntermediary,
  losController.intermediary.addIntermediaryToPerson,
  losController.intermediary.redirectToIntermediaryDetail);

// Intermediary PUT
LosRouter.put('/intermediaries/:id',
  ensureApiAuthenticated,
  losController.intermediary.updateIntermediary,
  losController.handleControllerDataResponse);


// APPLICATIONLABELS DELETE
LosRouter.delete('/intermediaries/:id',
  ensureApiAuthenticated,
  losController.intermediary.deleteIntermediary,
  losController.handleControllerDataResponse);


module.exports = LosRouter;

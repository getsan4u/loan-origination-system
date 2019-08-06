'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
const flatten = require('flat');
const unflatten = flatten.unflatten;

async function requiredFieldChecker(fields, obj) {
  let keys = Object.keys(obj);
  let missingKeys = fields.filter(field => (!keys.includes(field) || obj[ field ] === undefined));
  return missingKeys;
}

async function formatNewApplicationRequest(req) {
  try {
    req.controllerData = req.controllerData || {};
    const user = req.user;
    const organization = (user && user.association && user.association.organization) ? user.association.organization : null;
    let newApplication = req.body.data;
    const productMapByName = req.controllerData.productMapByName;
    const statusMapByName = req.controllerData.statusMapByName;
    const personMap = req.controllerData.personMap;
    const companyMap = req.controllerData.companyMap;
    const intermediaryMapByName = req.controllerData.intermediaryMapByName;
    const labelMapByName = req.controllerData.labelMapByName;
    const teamMemberMapByName = req.controllerData.teamMemberMapByName;
    let requiredFields = [ 'product', 'status', 'customer_id', /*'title',*/ ];

    let missingValues = await requiredFieldChecker(requiredFields, newApplication);

    if (missingValues.length) {
      req.error = `You are missing the following required fields: ${missingValues.join(', ')}`;
      return req;
    }

    const selectedProduct = (newApplication.product && productMapByName && productMapByName[ newApplication.product ]) ? productMapByName[ newApplication.product ] : null;

    const organizationApplicationStatuses = (organization.los && organization.los.statuses) ? organization.los.statuses : [];

    newApplication.product = (selectedProduct) ? selectedProduct._id : [];

    newApplication.status = (newApplication.status && statusMapByName && statusMapByName[ newApplication.status ]) ? statusMapByName[ newApplication.status ]._id : organizationApplicationStatuses[ 0 ];

    newApplication.customer_type = selectedProduct.customer_type;
    newApplication.coapplicant_customer_type = selectedProduct.customer_type;

    if (Array.isArray(newApplication.team_members)) {
      newApplication.team_members = newApplication.team_members.filter(name => teamMemberMapByName[ name ]).map(name => teamMemberMapByName[ name ]._id.toString());
    }
    if (Array.isArray(newApplication.labels)) {
      newApplication.labels = newApplication.labels.filter(name => labelMapByName[ name ]).map(name => labelMapByName[ name ]._id.toString());
    }

    let customer;
    if (selectedProduct.customer_type) {
      if (selectedProduct.customer_type === 'company' && companyMap[ newApplication.customer_id ]) {
        customer = companyMap[ newApplication.customer_id ];
      } else if (selectedProduct.customer_type === 'person' && personMap[ newApplication.customer_id ]) {
        customer = personMap[ newApplication.customer_id ];
      } else {
        customer = null;
      }
    }

    let keyInfo = unflatten(Object.assign({}, flatten(selectedProduct.template || {}), flatten(newApplication.key_information || {})));
    newApplication.key_information = keyInfo;

    newApplication.title = newApplication.name ? newApplication.name
      : selectedProduct ? `${customer? customer.name : ''} ${selectedProduct.name}`
        : `${customer? customer.name : ''}`;

    newApplication.user = {
      creator: (user && user.name) ? user.name : '',
      updater: (user && user.name) ? user.name : '',
    };
    if (intermediaryMapByName && newApplication.intermediary && intermediaryMapByName[newApplication.intermediary]) {
      newApplication.intermediary = intermediaryMapByName[ newApplication.intermediary ]._id.toString();
    } else {
      newApplication.intermediary = null;
    }
    req.body.data = newApplication;
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatUpdateApplicationRequest(req) {
  try {
    const isPatch = req.query && req.query.isPatch;
    if (!isPatch) {
      req.controllerData = req.controllerData || {};
      const user = req.user;
      const organization = (user && user.association && user.association.organization) ? user.association.organization : null;
      let updateApplication = req.body.data;
      const productMapByName = req.controllerData.productMapByName;
      const statusMapByName = req.controllerData.statusMapByName;
      const intermediaryMapByName = req.controllerData.intermediaryMapByName;
      const personMap = req.controllerData.personMap;
      const companyMap = req.controllerData.companyMap;
      const labelMapByName = req.controllerData.labelMapByName;
      const teamMemberMapByName = req.controllerData.teamMemberMapByName;
      const application = req.controllerData.application;
      let requiredFields = [ 'product', 'status', 'customer_id', /*'title',*/ ];

      let missingValues = await requiredFieldChecker(requiredFields, updateApplication);

      if (missingValues.length) {
        req.error = `You are missing the following required fields: ${missingValues.join(', ')}`;
        return req;
      }

      const selectedProduct = (updateApplication.product && productMapByName && productMapByName[ updateApplication.product ]) ? productMapByName[ updateApplication.product ] : null;

      const organizationApplicationStatuses = (organization.los && organization.los.statuses) ? organization.los.statuses : [];

      updateApplication.product = (selectedProduct) ? selectedProduct._id : [];

      updateApplication.status = (updateApplication.status && statusMapByName && statusMapByName[ updateApplication.status ]) ? statusMapByName[ updateApplication.status ]._id : organizationApplicationStatuses[ 0 ];

      updateApplication.customer_type = selectedProduct.customer_type;
      updateApplication.coapplicant_customer_type = updateApplication.coapplicant_customer_type || null;
      updateApplication.coapplicant_customer_id = updateApplication.coapplicant_customer_id || null;
      if (updateApplication.coapplicant_customer_id) {
        updateApplication.coapplicant_customer_type = selectedProduct.customer_type;
      }

      if (Array.isArray(updateApplication.team_members)) {
        updateApplication.team_members = updateApplication.team_members.filter(name => teamMemberMapByName[ name ]).map(name => teamMemberMapByName[ name ]._id.toString());
      }
      if (Array.isArray(updateApplication.labels)) {
        updateApplication.labels = updateApplication.labels.filter(name => labelMapByName[ name ]).map(name => labelMapByName[ name ]._id.toString());
      }

      let customer;
      if (selectedProduct.customer_type) {
        if (selectedProduct.customer_type === 'company' && companyMap[ updateApplication.customer_id ]) {
          customer = companyMap[ updateApplication.customer_id ];
        } else if (selectedProduct.customer_type === 'person' && personMap[ updateApplication.customer_id ]) {
          customer = personMap[ updateApplication.customer_id ];
        } else {
          customer = null;
        }
      }
      if (intermediaryMapByName && updateApplication.intermediary && intermediaryMapByName[ updateApplication.intermediary ]) {
        updateApplication.intermediary = intermediaryMapByName[ updateApplication.intermediary ]._id.toString();
      } else {
        updateApplication.intermediary = null;
      }

      let keyInfo = unflatten(Object.assign({}, flatten(selectedProduct.template || {}), flatten(updateApplication.key_information || {})));
      updateApplication.key_information = keyInfo;

      updateApplication.title = updateApplication.name ? updateApplication.name
        : selectedProduct ? `${customer.name} ${selectedProduct.name}`
          : `${customer.name}`;

      updateApplication.user = {
        creator: application.user ? application.user.creator : '',
        updater: (user && user.name) ? user.name : '',
      };
      updateApplication.createdat = application.createdat;
      updateApplication.updatedat = application.updatedat;
      req.body.data = updateApplication;
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatPatchApplicationRequest(req) {
  try {
    const isPatch = req.query && req.query.isPatch;
    if (isPatch) {
      req.controllerData = req.controllerData || {};
      const user = req.user;
      const organization = (user && user.association && user.association.organization) ? user.association.organization : null;
      let updateApplication = req.body.data;
      const productMapByName = req.controllerData.productMapByName;
      const statusMapByName = req.controllerData.statusMapByName;
      const intermediaryMapByName = req.controllerData.intermediaryMapByName;
      const personMap = req.controllerData.personMap;
      const companyMap = req.controllerData.companyMap;
      const labelMapByName = req.controllerData.labelMapByName;
      const teamMemberMapByName = req.controllerData.teamMemberMapByName;
      const application = req.controllerData.application;
      const prevKeyInfo = application.key_information;

      const selectedProduct = (updateApplication.product && productMapByName && productMapByName[ updateApplication.product ]) ? productMapByName[ updateApplication.product ] : null;

      const organizationApplicationStatuses = (organization.los && organization.los.statuses) ? organization.los.statuses : [];

      const applicationStatus = (updateApplication.status && statusMapByName && statusMapByName[ updateApplication.status ]) ? statusMapByName[ updateApplication.status ]._id : organizationApplicationStatuses[ 0 ];
      if (selectedProduct) {
        updateApplication.product = selectedProduct._id.toString();
        updateApplication.customer_type = selectedProduct.customer_type;
        updateApplication.coapplicant_customer_type = selectedProduct.customer_type;
      }

      if (applicationStatus) updateApplication.status = applicationStatus._id.toString();

      if (Array.isArray(updateApplication.team_members)) {
        updateApplication.team_members = updateApplication.team_members.filter(name => teamMemberMapByName[ name ]).map(name => teamMemberMapByName[ name ]._id.toString());
      }
      if (Array.isArray(updateApplication.labels)) {
        updateApplication.labels = updateApplication.labels.filter(name => labelMapByName[ name ]).map(name => labelMapByName[ name ]._id.toString());
      }

      if (updateApplication.customer_id && companyMap[ updateApplication.customer_id ]) {
        updateApplication.customer_type = 'company';
      } else if (updateApplication.customer_id &&personMap[ updateApplication.customer_id ]) {
        updateApplication.customer_type = 'person';
      }

      if (intermediaryMapByName && updateApplication.intermediary && intermediaryMapByName[ updateApplication.intermediary ]) {
        updateApplication.intermediary = intermediaryMapByName[ updateApplication.intermediary ]._id.toString();
      }

      if (updateApplication.key_information) {
        let updatedKeyInfo = unflatten(Object.assign({}, flatten(prevKeyInfo || {}), flatten(updateApplication.key_information || {})));
        updateApplication.key_information = updatedKeyInfo;
      }
      
      req.body.data = updateApplication;
    }
    return req;
  } catch (err) {
    console.log({ err });
    req.error = err.message;
    return req;
  }
}

async function formatNewApplicationResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { application, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: application,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatApplicationSearchResult(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { applications, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: applications,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatApplicationLookup(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { application, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: application,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatUpdateApplicationResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { application, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: application,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatDeleteApplicationResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { application, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatDeleteIntermediaryResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { intermediary, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}


async function formatNewPersonRequest(req) {
  try {
    req.controllerData = req.controllerData || {};
    let newPerson = req.body.data;
    let companyMap = req.controllerData.companyMap;
    let customerTemplateMapByType = req.controllerData.customerTemplateMapByType;
    let personTemplateMap = (customerTemplateMapByType && customerTemplateMapByType.person && customerTemplateMapByType.person.template) ? customerTemplateMapByType.person.template : {};

    newPerson.key_information = newPerson.key_information || {};
    newPerson.company = (newPerson.company && companyMap && companyMap[ newPerson.company ]) ? companyMap[ newPerson.company ]._id.toString() : null;
    newPerson.key_information = unflatten(Object.assign({}, flatten(personTemplateMap), flatten(newPerson.key_information)));
    req.controllerData.person = newPerson;
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}


async function formatNewCompanyRequest(req) {
  try {
    req.controllerData = req.controllerData || {};
    let newCompany = req.body.data;
    let personMap = req.controllerData.personMap;
    let customerTemplateMapByType = req.controllerData.customerTemplateMapByType;
    let companyTemplateMap = (customerTemplateMapByType && customerTemplateMapByType.company && customerTemplateMapByType.company.template) ? customerTemplateMapByType.company.template : {};

    newCompany.key_information = newCompany.key_information || {};
    newCompany.primary_contact = (newCompany.primary_contact && personMap && personMap[ newCompany.primary_contact ]) ? personMap[ newCompany.primary_contact ]._id.toString() : null;
    newCompany.key_information = unflatten(Object.assign({}, flatten(companyTemplateMap), flatten(newCompany.key_information)));
    req.body = Object.assign({}, req.body, newCompany);
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatNewPersonResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { person, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: person,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatUpdatePersonResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { person, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: person,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatDeletePersonResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { person, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatDeleteCommunicationResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { communication, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatPersonSearchResult(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { people, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: people,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatCompanySearchResult(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { companies, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: companies,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatPersonLookup(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { person, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: person,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatSearchDocumentsResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { documents, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: documents,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatCompanyLookup(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { company, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: company,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatUpdateCompanyResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { company, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: company,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}


async function formatNewCompanyResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { company, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: company,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatCompanyResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { company, companies, } = req.controllerData;
    if (companies && Array.isArray(companies)) {
      if (req.query && req.query.return_full_detail === 'true') {
        companies = companies.map(company => {
          const { name, industry, company_type, primary_contact, address, website, ein, key_information, } = company;
          return {
            name,
            industry,
            company_type,
            primary_contact,
            address,
            website,
            ein,
            key_information,
            company_id: company._id,
          };
        });
      } else {
        companies = companies.map(company => company._id.toString());
      }
      req.controllerData.companies = companies;
    }
    if (company && company._id) {
      const { name, industry, company_type, primary_contact, address, website, ein, key_information, } = company;
      req.controllerData.company = {
        name,
        industry,
        company_type,
        primary_contact,
        address,
        website,
        ein,
        key_information,
        company_id: company._id,
      };
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatPersonResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { person, people, } = req.controllerData;
    if (people && Array.isArray(people)) {
      if (req.query && req.query.return_full_detail === 'true') {
        people = people.map(person => {
          const { name, job_title, phone, email, address, dob, ssn, company, key_information, } = person;
          return {
            name,
            job_title,
            phone,
            email,
            address,
            dob,
            ssn,
            company,
            key_information,
            person_id: person._id,
          };
        });
      } else {
        people = people.map(person => person._id.toString());
      }
      req.controllerData.people = people;
    }
    if (person && person._id) {
      const { name, job_title, phone, email, address, dob, ssn, company, key_information, } = person;
      req.controllerData.person = {
        name,
        job_title,
        phone,
        email,
        address,
        dob,
        ssn,
        company,
        key_information,
        person_id: person._id,
      };
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatRulesEngineResultResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { rules_engine_result, rules_engine_results, } = req.controllerData;
    if (rules_engine_results && Array.isArray(rules_engine_results)) {
      if (req.query && req.query.return_full_detail === 'true') {
        rules_engine_results = rules_engine_results.map(rules_engine_result => {
          const { strategy, inputs, outputs, passed, decline_reasons, application, } = rules_engine_result;
          return {
            passed,
            decline_reasons,
            application,
            input_variables: inputs,
            output_variables: outputs,
            case_id: rules_engine_result._id,
            strategy_name: strategy.display_title,
            strategy_version: strategy.version,
            strategy_status: strategy.status,
          };
        });
      } else {
        rules_engine_results = rules_engine_results.map(rules_engine_result => rules_engine_result._id.toString());
      }
      req.controllerData.rules_engine_results = rules_engine_results;
    }
    if (rules_engine_result && rules_engine_result._id) {
      const { strategy, inputs, outputs, passed, decline_reasons, application, } = rules_engine_result;
      req.controllerData.rules_engine_result = {
        passed,
        decline_reasons,
        application,
        input_variables: inputs,
        output_variables: outputs,
        case_id: rules_engine_result._id,
        strategy_name: strategy.display_title,
        strategy_version: strategy.version,
        strategy_status: strategy.status,
      };
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatApplicationResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { application, applications } = req.controllerData;
    if (applications && Array.isArray(applications)) {
      if (req.query && req.query.return_full_detail === 'true') {
        applications = applications.map(application => {
          const {
            customer_id,
            intermediary,
            estimated_close,
            decision_date,
            reason,
            key_information,
            title,
            loan_amount,
            coapplicant_customer_id,
          } = application;
          return {
            customer_id,
            intermediary: intermediary? intermediary.name : null,
            coapplicant_customer_id,
            estimated_close,
            decision_date,
            reason,
            key_information,
            title,
            loan_amount,
            application_id: application._id,
            labels: application.labels.map(label => label.name),
            team_members: application.team_members.map(member => `${member.first_name} ${member.last_name}`),
            status: application.status.name,
            product: application.product.name,
          };
        });
      } else {
        applications = applications.map(application => application._id.toString());
      }
      req.controllerData.applications = applications;
    }
    if (application && application._id) {
      const {
        customer_id,
        estimated_close,
        intermediary,
        decision_date,
        reason,
        key_information,
        title,
        loan_amount,
        coapplicant_customer_id,
      } = application;
      req.controllerData.application = {
        customer_id,
        coapplicant_customer_id,
        intermediary: intermediary? intermediary.name : null,
        estimated_close,
        decision_date,
        reason,
        key_information,
        title,
        loan_amount,
        application_id: application._id,
        labels: application.labels.map(label => label.name),
        team_members: application.team_members.map(member => `${member.first_name} ${member.last_name}`),
        status: application.status.name,
        product: application.product.name,
      };
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatDeleteCompanyResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { company, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatUpdateCompanyRequest(req) {
  try {
    req.controllerData = req.controllerData || {};
    const isPatch = req.query && req.query.isPatch;
    if (isPatch) {
      return req;
    } else if (req.controllerData.company) {
      const user = req.user;
      const organization = (user && user.association && user.association.organization) ? user.association.organization : null;
      const originalCompany = req.controllerData.company;
      const updateCompany = req.body.data;
      const personMap = req.controllerData.personMap;
      const requiredFields = [ 'name', 'customer_id', /*'title',*/ ];
      const missingValues = await requiredFieldChecker(requiredFields, updateCompany);
      if (missingValues.length) {
        req.error = `You are missing the following required fields: ${missingValues.join(', ')}`;
        return req;
      }
      updateCompany.organization = organization._id.toString();
      updateCompany._id = originalCompany._id.toString();
      updateCompany.createdat = originalCompany.createdat;
      updateCompany.updatedat = originalCompany.updatedat;
      updateCompany.key_information = updateCompany.key_information || {};
      updateCompany.industry = updateCompany.industry || '';
      updateCompany.company_type = updateCompany.company_type || '';
      updateCompany.address = updateCompany.address || '';
      updateCompany.website = updateCompany.website || '';
      updateCompany.ein = updateCompany.ein || '';
      updateCompany.primary_contact = (updateCompany.primary_contact && personMap && personMap[ updateCompany.primary_contact ]) ? personMap[ updateCompany.primary_contact ]._id.toString() : null;
      delete updateCompany.company_id;
      req.body = Object.assign({}, req.body, { data: updateCompany, });
    } else {
      req.error = 'Could not find the company to update';
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatPatchCompanyRequest(req) {
  try {
    req.controllerData = req.controllerData || {};
    const isPatch = req.query && req.query.isPatch;
    if (!isPatch) {
      return req;
    } else if (req.controllerData.company) {
      const originalCompany = req.controllerData.company;
      const updateCompany = req.body.data;
      const personMap = req.controllerData.personMap;
      if (updateCompany.key_information) updateCompany.key_information = unflatten(Object.assign({}, flatten(originalCompany.key_information || {}), flatten(updateCompany.key_information || {})));
      if (updateCompany.primary_contact && personMap && personMap[ updateCompany.primary_contact ]) updateCompany.primary_contact = personMap[ updateCompany.primary_contact ]._id.toString();
      delete updateCompany.company_id;
      req.body = Object.assign({}, req.body, { data: updateCompany, });
    } else {
      req.error = 'Could not find the company to update';
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatUpdatePersonRequest(req) {
  try {
    req.controllerData = req.controllerData || {};
    const isPatch = req.query && req.query.isPatch;
    if (isPatch) {
      return req;
    } else if (req.controllerData.person) {
      const user = req.user;
      const organization = (user && user.association && user.association.organization) ? user.association.organization : null;
      const originalPerson = req.controllerData.person;
      const updatePerson = req.body.data;
      const companyMap = req.controllerData.companyMap;
      const requiredFields = [ 'name', 'customer_id', /*'title',*/ ];
      const missingValues = await requiredFieldChecker(requiredFields, updatePerson);
      if (missingValues.length) {
        req.error = `You are missing the following required fields: ${missingValues.join(', ')}`;
        return req;
      }
      updatePerson.organization = organization._id.toString();
      updatePerson._id = originalPerson._id.toString();
      updatePerson.createdat = originalPerson.createdat;
      updatePerson.updatedat = originalPerson.updatedat;
      updatePerson.job_title = updatePerson.job_title || '';
      updatePerson.phone = updatePerson.phone || '';
      updatePerson.email = updatePerson.email || '';
      updatePerson.address = updatePerson.address || '';
      updatePerson.dob = updatePerson.dob || '';
      updatePerson.ssn = updatePerson.ssn || '';
      updatePerson.key_information = updatePerson.key_information || {};
      updatePerson.company = (updatePerson.company && companyMap && companyMap[ updatePerson.company ]) ? companyMap[ updatePerson.company ]._id.toString() : null;
      delete updatePerson.person_id;
      req.body = Object.assign({}, req.body, { data: updatePerson, });
    } else {
      req.error = 'Could not find the person to update';
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatPatchPersonRequest(req) {
  try {
    req.controllerData = req.controllerData || {};
    const isPatch = req.query && req.query.isPatch;
    if (!isPatch) {
      return req;
    } else if (req.controllerData.person) {
      const originalPerson = req.controllerData.person;
      const updatePerson = req.body.data;
      const companyMap = req.controllerData.companyMap;
      if (updatePerson.key_information) updatePerson.key_information = unflatten(Object.assign({}, flatten(originalPerson.key_information || {}), flatten(updatePerson.key_information || {})));
      if (updatePerson.company && companyMap && companyMap[ updatePerson.company ]) updatePerson.company = companyMap[ updatePerson.company ]._id.toString();
      req.body = Object.assign({}, req.body, { data: updatePerson, });
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatUpdateIntermediaryRequest(req) {
  try {
    req.controllerData = req.controllerData || {};
    const isPatch = req.query && req.query.isPatch;
    if (isPatch) {
      return req;
    } else if (req.controllerData.intermediary) {
      const user = req.user;
      const organization = (user && user.association && user.association.organization) ? user.association.organization : null;
      const originalIntermediary = req.controllerData.intermediary;
      const updateIntermediary = req.body.data;
      const personMap = req.controllerData.personMap;
      const requiredFields = [ 'name', 'intermediary_id', /*'title',*/ ];
      const missingValues = await requiredFieldChecker(requiredFields, updateIntermediary);
      if (missingValues.length) {
        req.error = `You are missing the following required fields: ${missingValues.join(', ')}`;
        return req;
      }
      updateIntermediary.organization = organization._id.toString();
      updateIntermediary._id = originalIntermediary._id.toString();
      updateIntermediary.createdat = originalIntermediary.createdat;
      updateIntermediary.updatedat = originalIntermediary.updatedat;
      updateIntermediary.key_information = updateIntermediary.key_information || {};
      updateIntermediary.primary_contact = (updateIntermediary.primary_contact && personMap && personMap[ updateIntermediary.primary_contact ]) ? personMap[ updateIntermediary.primary_contact ]._id.toString() : null;
      updateIntermediary.type = updateIntermediary.type || '';
      updateIntermediary.address = updateIntermediary.address || '';
      updateIntermediary.website = updateIntermediary.website || '';
      updateIntermediary.ein = updateIntermediary.ein || '';
      updateIntermediary.description = updateIntermediary.description || '';
      delete updateIntermediary.intermediary_id;
      req.body = Object.assign({}, req.body, { data: updateIntermediary, });
    } else {
      req.error = 'Could not find the person to update';
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatPatchIntermediaryRequest(req) {
  try {
    req.controllerData = req.controllerData || {};
    const isPatch = req.query && req.query.isPatch;
    if (!isPatch) {
      return req;
    } else if (req.controllerData.intermediary) {
      const originalIntermediary = req.controllerData.intermediary;
      const updateIntermediary = req.body.data;
      const personMap = req.controllerData.personMap;
      if (updateIntermediary.key_information) updateIntermediary.key_information = unflatten(Object.assign({}, flatten(originalIntermediary.key_information || {}), flatten(updateIntermediary.key_information || {})));
      if (updateIntermediary.primary_contact && personMap && personMap[ updateIntermediary.primary_contact ]) updateIntermediary.primary_contact = personMap[ updateIntermediary.primary_contact ]._id.toString();
      req.body = Object.assign({}, req.body, { data: updateIntermediary, });
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatUpdateCommunicationRequest(req) {
  try {
    req.controllerData = req.controllerData || {};
    const isPatch = req.query && req.query.isPatch;
    if (isPatch) {
      return req;
    } else if (req.controllerData.communication) {
      const user = req.user;
      const organization = (user && user.association && user.association.organization) ? user.association.organization : null;
      const originalCommunication = req.controllerData.communication;
      const updateCommunication = req.body.data;
      const teamMemberMapByName = req.controllerData.teamMemberMapByName;
      const requiredFields = [ 'type', 'communication_id', /*'title',*/ ];
      const missingValues = await requiredFieldChecker(requiredFields, updateCommunication);
      if (missingValues.length) {
        req.error = `You are missing the following required fields: ${missingValues.join(', ')}`;
        return req;
      }
      updateCommunication.organization = organization._id.toString();
      updateCommunication._id = originalCommunication._id.toString();
      updateCommunication.createdat = originalCommunication.createdat;
      updateCommunication.updatedat = originalCommunication.updatedat;
      updateCommunication.team_members = updateCommunication.team_members && updateCommunication.team_members.length ? updateCommunication.team_members.filter(name => teamMemberMapByName[ name ]).map(name => teamMemberMapByName[ name ]._id.toString()) : [];
      updateCommunication.subject = updateCommunication.subject || '';
      updateCommunication.date = updateCommunication.date || '';
      updateCommunication.description = updateCommunication.description || '';
      updateCommunication.people = updateCommunication.people || [];
      delete updateCommunication.communication_id;
      req.body = Object.assign({}, req.body, { data: updateCommunication, });
    } else {
      req.error = 'Could not find the company to update';
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatPatchCommunicationRequest(req) {
  try {
    req.controllerData = req.controllerData || {};
    const isPatch = req.query && req.query.isPatch;
    if (!isPatch) {
      return req;
    } else if (req.controllerData.communication) {
      const updateCommunication = req.body.data;
      const teamMemberMapByName = req.controllerData.teamMemberMapByName;
      if (updateCommunication.team_members && updateCommunication.team_members.length) updateCommunication.team_members = updateCommunication.team_members.filter(name => teamMemberMapByName[ name ]).map(name => teamMemberMapByName[ name ]._id.toString());
      delete updateCommunication.communication_id;
      req.body = Object.assign({}, req.body, { data: updateCommunication, });
    } else {
      req.error = 'Could not find the communication to update';
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatUpdateTaskRequest(req) {
  try {
    req.controllerData = req.controllerData || {};
    const isPatch = req.query && req.query.isPatch;
    if (isPatch) {
      return req;
    } else if (req.controllerData.task) {
      const user = req.user;
      const organization = (user && user.association && user.association.organization) ? user.association.organization : null;
      const originalTask = req.controllerData.task;
      const updateTask = req.body.data;
      const teamMemberMapByName = req.controllerData.teamMemberMapByName;
      const requiredFields = [ 'type', 'task_id', /*'title',*/ ];
      const missingValues = await requiredFieldChecker(requiredFields, updateTask);
      if (missingValues.length) {
        req.error = `You are missing the following required fields: ${missingValues.join(', ')}`;
        return req;
      }
      updateTask.organization = organization._id.toString();
      updateTask._id = originalTask._id.toString();
      updateTask.createdat = originalTask.createdat;
      updateTask.updatedat = originalTask.updatedat;
      updateTask.team_members = updateTask.team_members && updateTask.team_members.length ? updateTask.team_members.filter(name => teamMemberMapByName[ name ]).map(name => teamMemberMapByName[ name ]._id.toString()) : [];
      updateTask.company = updateTask.company || null;
      updateTask.people = updateTask.people || [];
      updateTask.application = updateTask.application || null;
      updateTask.due_date = updateTask.due_date || '';
      delete updateTask.task_id;
      req.body = Object.assign({}, req.body, { data: updateTask, });
    } else {
      req.error = 'Could not find the task to update';
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatPatchTaskRequest(req) {
  try {
    req.controllerData = req.controllerData || {};
    const isPatch = req.query && req.query.isPatch;
    if (!isPatch) {
      return req;
    } else if (req.controllerData.task) {
      const updateTask = req.body.data;
      const teamMemberMapByName = req.controllerData.teamMemberMapByName;
      if (updateTask.team_members && updateTask.team_members.length) updateTask.team_members = updateTask.team_members.filter(name => teamMemberMapByName[ name ]).map(name => teamMemberMapByName[ name ]._id.toString());
      delete updateTask.task_id;
      req.body = Object.assign({}, req.body, { data: updateTask, });
    } else {
      req.error = 'Could not find the task to update';
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatDeleteTaskResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { task, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatDeleteDocumentResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { document_id, } = req.controllerData;
    if (document_id) {
      req.controllerData = {
        client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
        status_code: 200,
        status_message: 'Success',
        request_date: new Date().toISOString(),
        response_date: new Date().toISOString(),
      };
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatDocumentLookup(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { file, fileBuffer } = req.controllerData;
    if (file) {
      req.controllerData = {
        client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
        status_code: 200,
        status_message: 'Success',
        request_date: new Date().toISOString(),
        response_date: new Date().toISOString(),
        data: file,
      };
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatIntermediaryResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { intermediary, intermediaries, } = req.controllerData;
    if (intermediaries && Array.isArray(intermediaries)) {
      if (req.query && req.query.return_full_detail === 'true') {
        intermediaries = intermediaries.map(intermediary => {
          const { name, type, website, address, ein, description, primary_contact, key_information } = intermediary;
          return {
            name,
            type,
            website,
            address,
            ein,
            description,
            primary_contact,
            key_information,
            intermediary_id: intermediary._id,
          };
        });
      } else {
        intermediaries = intermediaries.map(intermediary => intermediary._id.toString());
      }
      req.controllerData.intermediaries = intermediaries;
    }
    if (intermediary && intermediary._id) {
      const { name, type, website, address, ein, description, primary_contact, key_information } = intermediary;
      req.controllerData.intermediary = {
        name,
        type,
        website,
        address,
        ein,
        description,
        primary_contact,
        key_information,
        intermediary_id: intermediary._id,
      };
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatIntermediaryLookup(req) {
  try {
    req.controllerData = req.controllerData || {};
    const { intermediary, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: intermediary,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatIntermediarySearchResult(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { intermediaries, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: intermediaries,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatRulesEngineResultLookup(req) {
  try {
    req.controllerData = req.controllerData || {};
    const { rules_engine_result, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: rules_engine_result,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatRulesEngineSearchResult(req) {
  try {
    req.controllerData = req.controllerData || {};
    const { rules_engine_results, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_data: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: rules_engine_results,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatTaskResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { task, tasks, } = req.controllerData;
    if (tasks && Array.isArray(tasks)) {
      if (req.query && req.query.return_full_detail === 'true') {
        tasks = tasks.map(task => {
          const { description, due_date, done, team_members = [], company, people = [], application } = task;
          return {
            description, 
            due_date, 
            done, 
            team_members, 
            company, 
            people, 
            application,
            task_id: task._id,
          };
        });
      } else {
        tasks = tasks.map(task => task._id.toString());
      }
      req.controllerData.tasks = tasks;
    }
    if (task && task._id) {
      const { description, due_date, done, team_members = [], company, people = [], application } = task;
      req.controllerData.task = {
        description,
        due_date,
        done,
        team_members, 
        company, 
        people, 
        application,
        task_id: task._id,
      };
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatTaskSearchResult(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { tasks, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: tasks,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatTaskLookup(req) {
  try {
    req.controllerData = req.controllerData || {};
    const { task, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: task,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatUpdateRulesEngineResultResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    const { rules_engine_result, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: rules_engine_result,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatUpdateRulesEngineIndividualResult(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.rules_engine_result) {
      const updateCase = req.body.data;
      const originalCase = req.controllerData.rules_engine_result;
      const updatedCase = Object.assign({}, originalCase, {
        passed: updateCase.passed,
        decline_reasons: updateCase.decline_reasons,
        inputs: updateCase.input_variables,
        outputs: updateCase.output_variables,
        error: updateCase.error,
        application: updateCase.application,
      });
      req.body.data = updatedCase;
    } else {
      req.error = 'Could not find the rules engine result';
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatCommunicationResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { communication, communications, } = req.controllerData;
    if (communications && Array.isArray(communications)) {
      if (req.query && req.query.return_full_detail === 'true') {
        communications = communications.map(communication => {
          const { description, subject, date, type, team_members = [], people = [] } = communication;
          return {
            description,
            subject,
            date, 
            type, 
            team_members, 
            people, 
            communication_id: communication._id,
          };
        });
      } else {
        communications = communications.map(communication => communication._id.toString());
      }
      req.controllerData.communications = communications;
    }
    if (communication && communication._id) {
      const { description, subject, date, type, team_members = [], people = [] } = communication;
      req.controllerData.communication = {
        description,
        subject,
        date, 
        type, 
        team_members, 
        people, 
        communication_id: communication._id,
      };
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatUpdateRulesEngineBatchResult(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (Array.isArray(req.controllerData.rules_engine_results) && Array.isArray(req.body.data)) {
      const updateBatchCaseMap = {};
      const originalBatchCaseMap = {};
      req.body.data.forEach(cs => {
        updateBatchCaseMap[ cs.case_id ] = cs;
      });
      req.controllerData.rules_engine_results.forEach(cs => {
        originalBatchCaseMap[ cs._id.toString() ] = cs;
      });
      const updateBatchCase = req.body.data.filter(cs => updateBatchCaseMap[ cs.case_id ] && originalBatchCaseMap[ cs.case_id ]).map(cs => {
        const updateCase = updateBatchCaseMap[ cs.case_id ];
        const originalCase = originalBatchCaseMap[ cs.case_id ];
        return Object.assign({}, originalCase, {
          passed: updateCase.passed,
          decline_reasons: updateCase.decline_reasons,
          inputs: updateCase.input_variables,
          outputs: updateCase.output_variables,
          error: updateCase.error,
          application: updateCase.application,
        });
      });
      req.body.data = updateBatchCase || [];
    } else {
      req.error = 'Could not find the rules engine result';
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatCommunicationSearchResult(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { communications, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: communications,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatCommunicationLookup(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { communication } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: communication,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatDocumentResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let doc = req.controllerData.document;
    if (doc && doc._id) {
      const { name, file_extension, filesize, createdat, } = doc;
      req.controllerData.document = {
        document_id: doc._id.toString(),
        name,
        file_extension,
        filesize,
        createdat
      };
    }
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatNewDocumentResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let doc = req.controllerData.document;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: doc,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatNewTaskResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { task, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: task,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatNewCommunicationResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { communication, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: communication,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatNewIntermediaryResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { intermediary, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: intermediary,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatUpdateTaskResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { task, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: task,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatUpdateCommunicationResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { communication, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: communication,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

async function formatUpdateIntermediaryResponse(req) {
  try {
    req.controllerData = req.controllerData || {};
    let { intermediary, } = req.controllerData;
    req.controllerData = {
      client_id: req.body.client_id || req.headers.client_id || req.query.client_id,
      status_code: 200,
      status_message: 'Success',
      request_date: new Date().toISOString(),
      response_date: new Date().toISOString(),
      data: intermediary,
    };
    return req;
  } catch (err) {
    req.error = err.message;
    return req;
  }
}

module.exports = {
  formatNewApplicationRequest,
  formatNewApplicationResponse,
  formatApplicationLookup,
  formatUpdateApplicationResponse,
  formatDeleteApplicationResponse,
  formatApplicationSearchResult,
  formatNewPersonRequest,
  formatNewPersonResponse,
  formatUpdatePersonResponse,
  formatDeletePersonResponse,
  formatPersonSearchResult,
  formatPersonLookup,
  formatNewCompanyRequest,
  formatNewCompanyResponse,
  formatCompanyLookup,
  formatUpdateCompanyRequest,
  formatPatchCompanyRequest,
  formatUpdateCompanyResponse,
  formatDeleteCompanyResponse,
  formatCompanySearchResult,
  formatRulesEngineSearchResult,
  formatDeleteDocumentResponse,
  formatSearchDocumentsResponse,
  formatDocumentLookup,
  formatNewDocumentResponse,
  formatDocumentResponse,
  formatTaskResponse,
  formatTaskLookup,
  formatTaskSearchResult,
  formatNewTaskResponse,
  formatUpdateTaskResponse,
  formatDeleteTaskResponse,
  formatIntermediarySearchResult,
  formatIntermediaryResponse,
  formatIntermediaryLookup,
  formatDeleteIntermediaryResponse,
  formatNewIntermediaryResponse,
  formatUpdateIntermediaryResponse,
  formatCommunicationResponse,
  formatCommunicationLookup,
  formatNewCommunicationResponse,
  formatUpdateCommunicationResponse,
  formatCommunicationSearchResult,
  formatDeleteCommunicationResponse,
  formatRulesEngineResultLookup,
  formatUpdateRulesEngineResultResponse,
  formatCompanyResponse,
  formatPersonResponse,
  formatUpdatePersonRequest,
  formatPatchPersonRequest,
  formatApplicationResponse,
  formatUpdateApplicationRequest,
  formatPatchApplicationRequest,
  formatRulesEngineResultResponse,
  formatUpdateRulesEngineIndividualResult,
  formatUpdateRulesEngineBatchResult,
  formatUpdateIntermediaryRequest,
  formatPatchIntermediaryRequest,
  formatUpdateCommunicationRequest,
  formatPatchCommunicationRequest,
  formatUpdateTaskRequest,
  formatPatchTaskRequest,
};
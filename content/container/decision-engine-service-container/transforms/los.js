'use strict';
const periodic = require('periodicjs');
const capitalize = require('capitalize');
const mongodb = require('mongodb');
const ObjectID = mongodb.ObjectID;
const numeral = require('numeral');
const url = require('url');
const moment = require('moment');
const flatten = require('flat');
const randomKey = Math.random;
const unflatten = flatten.unflatten;
const REACTAPPSETTINGS = periodic.settings.extensions[ 'periodicjs.ext.reactapp' ];
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const logger = periodic.logger;
const utilities = require('../utilities');
const prettysize = utilities.helpers.formatFileSize;
const los_transform_util = utilities.transforms.los;
const CONSTANTS = utilities.constants;
const styles = utilities.views.constants.styles;
const transformhelpers = utilities.transformhelpers;
const shared = utilities.views.shared;
const cardprops = shared.props.cardprops;
const losTabs = utilities.views.los.components.losTabs;
const intermediaryTabs = utilities.views.los.components.intermediaryTabs;
const applicationsTabs = utilities.views.los.components.applicationsTabs;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const simpleAsyncHeaderTitle = utilities.views.shared.component.layoutComponents.simpleAsyncHeaderTitle;
const buttonAsyncHeaderTitle = utilities.views.shared.component.layoutComponents.buttonAsyncHeaderTitle;
const documents = utilities.constants.documents;

async function formatCreateApplication(req) {
  try {
    const Product = periodic.datas.get('standard_losproduct');
    if (req.body.product) {
      const product = await Product.model.findOne({ _id: req.body.product, }).lean();
      req.body.customer_type = product.customer_type;
    }
    if (req.body.loan_amount) {
      req.body.loan_amount = numeral(req.body.loan_amount)._value;
    }
    const user = req.user || {};
    const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
    if (req.body && req.body.team_members) req.body.team_members = req.body.team_members.filter(Boolean);
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatNewApplicationFormData(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.formoptions = req.controllerData.formoptions || {};
    req.controllerData.formdata = req.controllerData.formdata || {};
    const user = req.user || {};
    let parsed = url.parse(req.headers.referer).pathname.slice(1).split('/');
    if (req.controllerData.products) {
      if (parsed[ 1 ] && parsed[ 1 ] === 'companies') {
        req.controllerData.products = req.controllerData.products.filter(product => product.customer_type === 'company');
      } else if (parsed[ 1 ] && parsed[ 1 ] === 'people') {
        req.controllerData.products = req.controllerData.products.filter(product => product.customer_type === 'person');
      }
      const productDropdown = req.controllerData.products.map(product => ({
        label: product.name,
        value: product._id.toString(),
      }));
      req.controllerData.formoptions.product = productDropdown;
      req.controllerData.formdata.product_types = req.controllerData.products.reduce((acc, product) => {
        acc[ product._id ] = product.customer_type;
        return acc;
      }, {});
      delete req.controllerData.products;
    }

    if (req.controllerData.labels) {
      const labelDropdown = req.controllerData.labels.map(label => ({
        label: label.name,
        value: label._id.toString(),
        selectedLabelStyle: {
          backgroundColor: label.color,
          color: los_transform_util._pickContrastingFontColor(label.color),
        },
        content: {
          component: 'span',
          children: label.name,
          props: {
            style: {
              padding: '3px 6px',
              borderRadius: '4px',
              backgroundColor: label.color,
              color: los_transform_util._pickContrastingFontColor(label.color),
              fontWeight: 700,
            },
          },
        },
      })).sort((a, b) => a.label > b.label ? 1 : -1);
      req.controllerData.formoptions.labels = labelDropdown;
      delete req.controllerData.labels;
    }

    if (req.controllerData.team_members) {
      const teamMemberDropdown = req.controllerData.team_members.map(member => ({
        label: `${member.first_name} ${member.last_name}`,
        value: member._id.toString(),
        image: member.primaryasset && member.primaryasset.fileurl ? member.primaryasset.fileurl : REACTAPPSETTINGS.default_user_image,
      })).sort((a, b) => a > b ? 1 : -1);
      req.controllerData.formoptions.team_members = teamMemberDropdown;
      delete req.controllerData.team_members;
    }
    if (req.controllerData.los_statuses) {
      const statusOptions = req.controllerData.los_statuses.map((status, idx) => ({
        title: status.name,
        checked: (idx == 0) ? true : null,
        value: status._id.toString(),
      }));
      req.controllerData.formoptions.status = statusOptions;
      delete req.controllerData.los_statuses;
    }
    if (req.controllerData.intermediaries) {
      const intermediaryDropdown = req.controllerData.intermediaries.map(intermediary => ({
        label: intermediary.name,
        value: intermediary._id.toString(),
      }));
      req.controllerData.formoptions.intermediary = intermediaryDropdown;
      delete req.controllerData.intermediaries;
    }

    if (req.controllerData.people || req.controllerData.companies) {
      let peopleDropdown = req.controllerData.people || [];
      let companiesDropdown = req.controllerData.companies || [];
      peopleDropdown = peopleDropdown.map(person => ({
        label: person.name,
        value: `person.${person._id.toString()}`,
      })).sort((a, b) => a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1);
      companiesDropdown = companiesDropdown.map(company => ({
        label: company.name,
        value: `company.${company._id.toString()}`,
      })).sort((a, b) => a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1);
      if (parsed[ 1 ] === 'companies') {
        req.controllerData.formdata.customer_name = `company.${parsed[ 2 ]}`;
      } else if (parsed[ 1 ] === 'people') {
        req.controllerData.formdata.customer_name = `person.${parsed[ 2 ]}`;
      } else if (parsed[ 1 ] === 'intermediaries' && parsed[ 2 ]) {
        req.controllerData.formdata.intermediary = parsed[ 2 ];
      }
      req.controllerData.formoptions.peopleDropdown = peopleDropdown;
      req.controllerData.formoptions.companiesDropdown = companiesDropdown;
    }
    req.controllerData.formdata = Object.assign({}, req.controllerData.formdata, {
      createdat: transformhelpers.formatDateNoTime(new Date(), req.user.time_zone),
      team_members: [ user._id.toString(), ],
      estimated_close_date: moment(new Date()).add(1, 'M').toISOString(),
    });
    delete req.controllerData.people;
    delete req.controllerData.companies;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatApplicationsIndexTable(req) {
  try {
    if (req.controllerData.rows) {
      const User = periodic.datas.get('standard_user');
      const user = req.user || {};
      const userImageMap = req.controllerData.userImageMap || {};
      const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
      const users = await User.model.find({ 'association.organization': organization, }, { first_name: 1, last_name: 1, }).lean();
      const userNameMap = users.reduce((acc, user) => {
        const user_id = user._id.toString();
        acc[ user_id ] = `${user.first_name} ${user.last_name}`;
        return acc;
      }, {});
      const team_members = req.controllerData.team_members.map(member => ({
        value: member._id.toString(),
        text: `${member.first_name} ${member.last_name}`,
        image: {
          avatar: true,
          spaced: 'right',
          src: member.primaryasset && member.primaryasset.fileurl ? member.primaryasset.fileurl : REACTAPPSETTINGS.default_user_image,
        },
      }));
      const los_statuses = req.controllerData.los_statuses.map(status => ({
        value: status._id.toString(),
        text: status.name,
      })).sort((a, b) => (a.text.toLowerCase() > b.text.toLowerCase()) ? 1 : -1);
      req.controllerData.filterButtons = [ {
        headername: 'team_members',
        placeholder: 'FILTER TEAM MEMBERS',
        className: 'global-table-search',
        selection: true,
        multiple: true,
        fluid: true,
        search: true,
        options: team_members,
      }, {
        headername: 'status',
        placeholder: 'FILTER STATUS',
        className: 'global-table-search',
        selection: true,
        multiple: true,
        fluid: true,
        search: true,
        options: los_statuses,
      }, ];
      req.controllerData.rows = req.controllerData.rows.map((row, i) => {
        const filteredTeamMembers = row.team_members.filter(team_member => !!team_member);
        const team_members = {
          component: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
            },
          },
          children: [ filteredTeamMembers.length ?
            los_transform_util.generateTableIcon(filteredTeamMembers[ 0 ]._id && userImageMap[ filteredTeamMembers[ 0 ]._id.toString() ] || REACTAPPSETTINGS.default_user_image, filteredTeamMembers.length) :
            null, {
            component: 'span',
            props: {
              style: {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            },
            children: row.team_members.reduce((aggregate, member) => userNameMap[ member ] ? aggregate.concat(userNameMap[ member ]) : aggregate, []).join(', '),
          }, ],
        };
        const createdat = (row.user && row.user.creator) ? `${transformhelpers.formatDateNoTime(row.createdat, req.user.time_zone)} by ${row.user.creator}` : transformhelpers.formatDateNoTime(row.createdat, req.user.time_zone);
        const updatedat = (row.user && row.user.updater) ? `${transformhelpers.formatDateNoTime(row.updatedat, req.user.time_zone)} by ${row.user.updater}` : transformhelpers.formatDateNoTime(row.createdat, req.user.time_zone);
        return {
          team_members,
          createdat,
          updatedat,
          _id: row._id,
          title: row.title,
          loan_amount: row.loan_amount ? numeral(row.loan_amount).format('$0,0') : '',
          status: row.status ? row.status.name : '',
        };
      });
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatCustomersIndexTable(req) {
  try {
    if (req.controllerData.rows && req.query && req.query.customer_type === 'company') {
      req.controllerData.rows = req.controllerData.rows.map(row => {
        const primary_contact = row.primary_contact;
        const createdat = `${transformhelpers.formatDateNoTime(row.createdat, req.user.time_zone)}`;
        const updatedat = `${transformhelpers.formatDateNoTime(row.updatedat, req.user.time_zone)}`;
        return Object.assign({}, row, {
          primary_contact_name: primary_contact ? primary_contact.name : '',
          primary_contact_phone: primary_contact ? transformhelpers.formatPhoneNumber(primary_contact.phone) : '',
          primary_contact_email: primary_contact ? primary_contact.email : '',
          createdat,
          updatedat,
          _id: row._id,
        });
      });
    } else if (req.controllerData.rows && req.query && req.query.customer_type === 'people') {
      req.controllerData.rows = req.controllerData.rows.map(row => {
        const company = row.company;
        const createdat = `${transformhelpers.formatDateNoTime(row.createdat, req.user.time_zone)}`;
        return Object.assign({}, row, {
          name: row.name,
          company: company ? company.name : '',
          job_title: row.job_title,
          phone: transformhelpers.formatPhoneNumber(row.phone),
          email: row.email,
          company_id: company ? company._id.toString() : '',
          createdat,
          _id: row._id,
        });
      });
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatCompanyPeoplesIndexTable(req) {
  try {
    if (req.controllerData.rows) {
      req.controllerData.rows = req.controllerData.rows.map(row => {
        const createdat = `${transformhelpers.formatDateNoTime(row.createdat, req.user.time_zone)}`;
        return Object.assign({}, row, {
          name: row.name,
          company: (req.controllerData.company) ? req.controllerData.company.name : row.company,
          job_title: row.job_title,
          phone: transformhelpers.formatPhoneNumber(row.phone),
          email: row.email,
          createdat,
          company_id: req.params.id,
          _id: row._id,
        });
      });
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatIntermediaryPeoplesIndexTable(req) {
  try {
    if (req.controllerData.rows) {
      req.controllerData.rows = req.controllerData.rows.map(row => {
        const createdat = `${transformhelpers.formatDateNoTime(row.createdat, req.user.time_zone)}`;
        return Object.assign({}, row, {
          name: row.name,
          job_title: row.job_title,
          phone: transformhelpers.formatPhoneNumber(row.phone),
          email: row.email,
          createdat,
          intermediary: req.params.id,
          _id: row._id,
        });
      });
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatApplicationDetail(req) {
  try {
    if (req.controllerData && req.controllerData.application) {
      const Person = periodic.datas.get('standard_losperson');
      const Company = periodic.datas.get('standard_loscompany');
      const application = req.controllerData.application;
      const user = req.user || {};
      const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
      const orgApplicationStatus = (user && user.association && user.association.organization && user.association.organization.los && user.association.organization.los.statuses) ? user.association.organization.los.statuses : [];
      const Customer = application.customer_type === 'company' ? Company : Person;
      req.controllerData.data = {
        display_title: req.controllerData.application.title,
      };
      application.labels = application.labels || [];

      if (req.query && req.query.action_type === 'edit') {
        req.controllerData.formoptions = req.controllerData.formoptions || {};
        if (req.controllerData.labels) {
          const labelDropdown = req.controllerData.labels.map(label => ({
            label: label.name,
            value: label._id.toString(),
            selectedLabelStyle: {
              backgroundColor: label.color,
              color: los_transform_util._pickContrastingFontColor(label.color),
            },
            content: {
              component: 'span',
              children: label.name,
              props: {
                style: {
                  padding: '3px 6px',
                  borderRadius: '4px',
                  backgroundColor: label.color,
                  color: los_transform_util._pickContrastingFontColor(label.color),
                  fontWeight: 700,
                },
              },
            },
          }));
          req.controllerData.formoptions.labels = labelDropdown;
          delete req.controllerData.labels;
        }
      } else {
        const customer_baseurl = application.customer_type === 'company' ? `companies/${application.customer_id}` : `people/${application.customer_id}`;

        const customer = await Customer.model.findOne({
          _id: application.customer_id,
          organization,
        }).lean();

        const customer_name = customer ? `${customer.name} (${capitalize(application.customer_type)})` : '';

        let coapplicant_baseurl = '';
        let coapplicant = '';
        if (application.coapplicant_customer_id) {
          coapplicant_baseurl = (application.customer_type === 'company') ? `companies/${application.coapplicant_customer_id}` : (application.customer_type === 'person') ? `people/${application.coapplicant_customer_id}` : '';
          const foundCoapplicant = await Customer.model.findOne({
            _id: application.coapplicant_customer_id,
            organization,
          }).lean();
          coapplicant = foundCoapplicant ? `${foundCoapplicant.name} (${capitalize(application.customer_type)})` : '';
        }

        const createdat = `${transformhelpers.formatDateNoTime(application.createdat, req.user.time_zone)} by ${application.user.creator}`;
        const updatedat = `${transformhelpers.formatDateNoTime(application.updatedat, req.user.time_zone)} by ${application.user.updater}`;

        application.key_information = application.key_information || {};
        const valueCategoriesMap = {};
        const loan_info = Object.entries(application.key_information).map(([ name, detail, ], idx) => {
          if (detail.value_category && !valueCategoriesMap[detail.value_category]) valueCategoriesMap[detail.value_category] = { value: detail.value_category.toLowerCase(), text: detail.value_category };
          let value;
          if (detail.value === null) value = '';
          else value = los_transform_util.formatByValueType({ value: detail.value, value_type: detail.value_type, });
          return { name, value, idx, _id: application._id.toString(), value_type: detail.value_type, };
        });

        const loan_amount = (application && application.loan_amount !== undefined) ? numeral(application.loan_amount).format('$0,0') : undefined;
        req.controllerData.application = Object.assign({}, application, {
          createdat,
          updatedat,
          customer_name,
          customer_baseurl,
          coapplicant_baseurl,
          coapplicant,
          loan_amount,
          loan_info,
        });

        const application_status = req.controllerData.los_statuses.find(statusObj => statusObj && statusObj._id.toString() === application.status.toString());
        req.controllerData.application.status_name = (application_status && application_status.name) ? application_status.name : '';

        if (application_status && application_status.name === 'Approved' && req.controllerData.application.decision_date) {
          req.controllerData.application.decision_date_approved = transformhelpers.formatDateNoTime(req.controllerData.application.decision_date, req.user.time_zone);
          req.controllerData.application.estimated_close_date = null;
        } else if (application_status && application_status.name === 'Rejected' && req.controllerData.application.decision_date) {
          req.controllerData.application.decision_date_rejected = transformhelpers.formatDateNoTime(req.controllerData.application.decision_date, req.user.time_zone);
          req.controllerData.application.estimated_close_date = null;
        }

        req.controllerData.formoptions = req.controllerData.formoptions || {};

        if (req.controllerData.products) {
          const productDropdown = req.controllerData.products.map(product => ({
            label: product.name,
            value: product._id.toString(),
          }));
          req.controllerData.formoptions.product = productDropdown;
          delete req.controllerData.products;
        }
        if (req.controllerData.team_members) {
          const teamMemberDropdown = req.controllerData.team_members.map(member => ({
            label: `${member.first_name} ${member.last_name}`,
            value: member._id.toString(),
            image: member.primaryasset && member.primaryasset.fileurl ? member.primaryasset.fileurl : REACTAPPSETTINGS.default_user_image,
          })).sort((a, b) => a > b ? 1 : -1);
          req.controllerData.formoptions.team_members = teamMemberDropdown;
          delete req.controllerData.team_members;
        }

        if (req.controllerData.los_statuses) {
          const statusOptions = [];
          const statusMap = {};
          req.controllerData.los_statuses.forEach(status => {
            statusMap[ status._id.toString() ] = status;
          });
          orgApplicationStatus.forEach(statusId => {
            const status = statusMap[ statusId ];
            if (status.name !== 'Approved' && status.name !== 'Rejected') {
              statusOptions.push({
                stepProps: {
                  disabled: (application_status.name === 'Approved' || application_status.name === 'Rejected') ? true : null,
                  className: (application_status.name === 'Approved')
                    ? 'approved'
                    : (application_status.name === 'Rejected')
                      ? 'rejected'
                      : '',
                },
                title: status.name,
                value: status._id.toString(),
              });
            }
          });

          req.controllerData.formoptions.status = statusOptions;
          delete req.controllerData.los_statuses;
        }
        if (req.controllerData.labels) {
          let labelFormatted = application.labels.map(label => {
            let labelFound = req.controllerData.labels.find(function (obj) {
              return obj._id.toString() === label.toString();
            });
            if (labelFound) {
              return {
                component: 'span',
                children: labelFound.name,
                props: {
                  style: {
                    padding: '4px 10px',
                    display: 'inline-block',
                    borderRadius: '4px',
                    backgroundColor: labelFound.color,
                    color: los_transform_util._pickContrastingFontColor(labelFound.color),
                    fontWeight: 700,
                    margin: '3px',
                    fontSize: '1rem',
                  },
                },
              };
            } else {
              return {
                component: 'span',
              };
            }
          });
          delete req.controllerData.labels;
          req.controllerData.labelFormatted = labelFormatted;
        }
        if (req.controllerData.intermediaries) {
          const intermediaryDropdown = req.controllerData.intermediaries.map(intermediary => ({
            label: intermediary.name,
            value: intermediary._id.toString(),
          }));
          req.controllerData.formoptions.intermediary = intermediaryDropdown;
          delete req.controllerData.intermediaries;
        }

        req.controllerData.application.filterButtons = [ {
          headername: 'value_category',
          placeholder: 'FILTER CATEGORIES',
          // className: 'global-table-search',
          selection: true,
          multiple: true,
          fluid: true,
          search: true,
          options: Object.values(valueCategoriesMap),
        }];

        req.controllerData._children = [ los_transform_util._createApplicationDetailPage({
          applicationId: req.controllerData.application._id.toString(),
          application_status,
          keyInfoLength: Object.keys(application.key_information).length
        }), ];
      }
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatApplicationLoanInformation(req) {
  try {
    if (req.controllerData && req.controllerData.application) {
      const application = req.controllerData.application;
      let valueCategories = [];
      if (req.query && req.query.headerFilters) {
        valueCategories = req.query.headerFilters.replace('value_category=', '').split(',');
      }
      const searchString = req.query && req.query.query || '';
      application.key_information = application.key_information || {};

      const loan_info = Object.entries(application.key_information).reduce((aggregate, [ name, detail, ], idx) => {
        if (valueCategories.length && valueCategories[0] !== '') {
          if (valueCategories.includes((detail.value_category || '').toLowerCase()) && name.match(new RegExp(searchString, 'gi'))) {
            let value;
            if (detail.value === null) value = '';
            else value = los_transform_util.formatByValueType({ value: detail.value, value_type: detail.value_type, });
            aggregate.push({ name, value, idx, _id: application._id.toString(), value_type: detail.value_type, });
          }
        } else {
          if (name.match(new RegExp(searchString, 'gi'))) {
            let value;
            if (detail.value === null) value = '';
            else value = los_transform_util.formatByValueType({ value: detail.value, value_type: detail.value_type, });
            aggregate.push({ name, value, idx, _id: application._id.toString(), value_type: detail.value_type, });
          }
        }
        return aggregate;
      }, []);

      req.controllerData.rows = loan_info;
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatCompanyDetail(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData && req.controllerData.company) {
      const company = req.controllerData.company;
      const Person = periodic.datas.get('standard_losperson');
      const user = req.user || {};
      const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
      let company_people = await Person.model.find({ company: company._id.toString(), organization, });
      company_people = company_people.map(person => person.toJSON ? person.toJSON() : person);
      let createdat = `${transformhelpers.formatDateNoTime(company.createdat, req.user.time_zone)}`;
      let updatedat = `${transformhelpers.formatDateNoTime(company.updatedat, req.user.time_zone)}`;
      if (company.user && company.user.creator) createdat += ` by ${company.user.creator}`;
      if (company.user && company.user.updater) updatedat += ` by ${company.user.updater}`;
      const key_information = (company.key_information) ? Object.keys(company.key_information).map((name, idx) => {
        const detail = company.key_information[ name ];
        let value;
        if (detail.value === undefined || detail.value === null) value = '';
        else value = los_transform_util.formatByValueType({ value: detail.value, value_type: detail.value_type, });
        return { name, value, idx, _id: company._id.toString(), value_type: detail.value_type, };
      }) : [];

      if (company.primary_contact) {
        const primary_contact = company_people.find(person => person._id.toString() === company.primary_contact.toString());
        req.controllerData.company = Object.assign({}, company, {
          primary_contact: primary_contact ? primary_contact._id.toString() : '',
          primary_contact_phone: primary_contact ? transformhelpers.formatPhoneNumber(primary_contact.phone) : '',
          primary_contact_email: primary_contact ? primary_contact.email : '',
          createdat, updatedat, key_information,
        });
      } else {
        req.controllerData.company = Object.assign({}, company, { createdat, updatedat, key_information, });
      }

      req.controllerData.formoptions = req.controllerData.formoptions || {};

      if (company_people && company_people.length) {
        const primaryContactDropdown = company_people.map(person => ({
          label: person.name,
          value: person._id.toString(),
        }));
        req.controllerData.formoptions.primary_contact = primaryContactDropdown;
      }

      if (company.company_applications && company.company_applications.rows.length) {
        company.company_applications.rows = company.company_applications.rows.map(application => ({
          _id: application._id,
          loan_amount: application.loan_amount ? numeral(application.loan_amount).format('$0,0') : '',
          createdat: transformhelpers.formatDateNoTime(application.createdat, req.user.time_zone),
          product: application.product ? application.product.name : '',
          status: application.status.name,
        }));
      }

      req.controllerData.data = {
        display_title: company.name,
      };
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatPersonDetail(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData && req.controllerData.person) {
      const person = req.controllerData.person;
      let createdat = `${transformhelpers.formatDateNoTime(person.createdat, req.user.time_zone)}`;
      let updatedat = `${transformhelpers.formatDateNoTime(person.updatedat, req.user.time_zone)}`;
      if (person.user && person.user.creator) createdat += ` by ${person.user.creator}`;
      if (person.user && person.user.updater) updatedat += ` by ${person.user.updater}`;
      const key_information = (person.key_information) ? Object.keys(person.key_information).map((name, idx) => {
        const detail = person.key_information[ name ];
        let value;
        if (detail.value === undefined || detail.value === null) value = '';
        else value = los_transform_util.formatByValueType({ value: detail.value, value_type: detail.value_type, });
        return { name, value, idx, _id: person._id.toString(), value_type: detail.value_type, };
      }) : [];

      req.controllerData.person = Object.assign({}, person, { createdat, updatedat, key_information, });

      req.controllerData.formoptions = req.controllerData.formoptions || {};

      if (person.person_applications && person.person_applications.rows.length) {
        person.person_applications.rows = person.person_applications.rows.map(application => ({
          _id: application._id,
          loan_amount: numeral(application.loan_amount).format('$0,0'),
          createdat: transformhelpers.formatDateNoTime(application.createdat, req.user.time_zone),
          product: application.product.name,
          status: application.status.name,
        }));
      }

      req.controllerData.data = {
        display_title: person.name,
      };
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatApplicationSwimlane(req) {
  try {
    req.controllerData = req.controllerData || {};
    const applications = req.controllerData.applications || [];
    const los_statuses = req.controllerData.los_statuses || [];
    const userImageMap = req.controllerData.userImageMap || {};
    const droppableList = los_statuses.map(losStatusObj => ({
      cardProps: cardprops({
        cardProps: {
          className: 'orange-card-gradient swim-lane-card',
        },
        cardTitle: {
          component: 'ResponsiveButton',
          props: {
            onClick: 'func:this.props.createModal',
            onclickProps: {
              title: 'Edit Status',
              pathname: `/los/statuses/${losStatusObj._id.toString()}`,
            },
          },
          children: losStatusObj.name,
        },
        headerTitleStyle: {
          fontSize: '16px',
        },
        cardStyle: {
          margin: 0,
          boxShadow: '0 2px 3px rgba(17,17,17,.1), 0 0 0 1px rgba(17,17,17,.1)',
          borderRadius: 0,
        },
      }),
      headerInfoProps: {
        style: {
          fontSize: '1rem',
          fontWeight: 400,
          marginTop: '5px',
        },
      },
      items: applications.reduce((validApps, application, idx) => {
        if (application.status && application.status.toString() === losStatusObj._id.toString()) {
          validApps.push({
            id: application._id.toString(),
            itemName: application.title,
            teamMemberCount: (application.team_members && application.team_members.length) ? application.team_members.length : 0,
            image: (application.team_members && application.team_members.length && userImageMap[ application.team_members[ 0 ].toString() ]) ? userImageMap[ application.team_members[ 0 ].toString() ] : REACTAPPSETTINGS.default_user_image,
            amountNum: application.loan_amount ? parseFloat(numeral(application.loan_amount)._value) : 0,
            amount: application.loan_amount ? numeral(application.loan_amount).format('$0,0') : '',
            date: transformhelpers.formatDateNoTime(application.createdat),
            footer: (application.labels && application.labels.length) ? {
              component: 'div',
              props: {
                style: {
                  marginBottom: '-2px',
                },
              },
              children: [ {
                component: 'div',
                props: {
                  style: {
                    borderTop: '1px solid #ccc',
                    width: 'calc(100% + 14px)',
                    margin: '5px 0 3px -7px',
                  },
                },
              }, ].concat(application.labels.map(label => {
                return {
                  component: 'span',
                  children: label.name,
                  props: {
                    style: {
                      display: 'inline-block',
                      margin: '2px 2px 2px 0',
                      fontWeight: 'bold',
                      borderRadius: '5px',
                      color: los_transform_util._pickContrastingFontColor(label.color),
                      padding: '3px 7px',
                      fontSize: '11px',
                      boxShadow: 'rgba(17, 17, 17, 0.1) 0px 1px 2px, rgba(17, 17, 17, 0.1) 0px 0px 0px 1px',
                      backgroundColor: label.color,
                    },
                  },
                };
              })),
            } : null,
          });
        }
        return validApps;
      }, []),
    }));
    req.controllerData.droppableList = droppableList;
    req.controllerData._children = [
      losTabs('Applications'),
      {
        component: 'div',
        props: {
          style: {
            margin: '1rem 0px 1.5rem',
          },
        },
      },
      plainGlobalButtonBar({
        left: [ {
          component: 'Semantic.Dropdown',
          asyncprops: {
            privilege_id: [ 'checkdata', 'permissionCode', ],
          },
          comparisonorprops: true,
          comparisonprops: [ {
            left: [ 'privilege_id', ],
            operation: 'eq',
            right: 101,
          }, {
            left: [ 'privilege_id', ],
            operation: 'eq',
            right: 102,
          }, {
            left: [ 'privilege_id', ],
            operation: 'eq',
            right: 103,
          } ],
          props: {
            className: '__re-bulma_button __re-bulma_is-success',
            text: 'CREATE APPLICATION',
          },
          children: [ {
            component: 'Semantic.DropdownMenu',
            children: [ {
              component: 'Semantic.Item',
              children: [ {
                component: 'ResponsiveButton',
                children: 'NEW CUSTOMER',
                asyncprops: {
                  buttondata: [ 'strategydata', 'data', ],
                },
                props: {
                  onclickThisProp: [ 'buttondata', ],
                  onClick: 'func:this.props.createModal',
                  onclickProps: {
                    pathname: '/los/applications/new/new_customer',
                    title: 'Create Application (New Customer)',
                  },
                },
              }, ],
            }, {
              component: 'Semantic.Item',
              children: [ {
                component: 'ResponsiveButton',
                children: 'EXISTING CUSTOMER',
                asyncprops: {
                  buttondata: [ 'strategydata', 'data', ],
                },
                props: {
                  onclickThisProp: [ 'buttondata', ],
                  onclickProps: {
                    title: 'Create Application (Existing Customer)',
                    pathname: '/los/applications/new/existing_customer',
                  },
                  onClick: 'func:this.props.createModal',
                },
              }, ],
            }, ],
          }, ],
        }, ],
        right: [ {
          component: 'div',
          children: [ {
            component: 'Link',
            props: {
              to: '/los/applicationsdashboard',
              className: '__re-bulma_button __icon_button __icon-large active',
              style: {
                margin: 0,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              },
            },
            children: [ {
              component: 'Icon',
              props: {
                icon: 'fa fa-th-large',
              },
            }, ],
          }, {
            component: 'Link',
            props: {
              to: '/los/applications',
              className: '__re-bulma_button __icon_button __icon-large',
              style: {
                margin: 0,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
              },
            },
            children: [ {
              component: 'Icon',
              props: {
                icon: 'fa fa-list-ul',
                // size: 'large',
              },
            }, ],
          }, ],
        },
          // {
          //   component: 'ResponsiveButton',
          //   props: {
          //     onClick: 'func:this.props.createModal',
          //     onclickProps: {
          //       title: 'Machine Learning - Tutorial',
          //       pathname: '/ml/tutorial',
          //     },
          //     buttonProps: {
          //       color: 'isPrimary',
          //     },
          //   },
          //   children: 'DOWNLOAD',
          // }, 
        ],
      }), {
        component: 'Container',
        props: {},
        children: [ {
          component: 'SwimLane',
          props: {
            contextProps: {
              style: {},
            },
            fetchOptions: {
              url: '/los/api/applications/:id?type=swimlane',
              params: [ {
                key: ':id',
                val: '_id',
              }, ],
              options: {
                headers: {
                  'Content-Type': 'application/json',
                },
                method: 'PUT',
                timeout: 500000,
              },
            },
            searchOptions: {
              url: '/los/api/applications/swimlane?populate=labels',
              options: {
                headers: {
                  'Content-Type': 'application/json',
                },
                method: 'GET',
                timeout: 500000,
              },
              searchProps: {
                className: 'global-table-search',
                placeholder: 'SEARCH APPLICATIONS',
                hasIconRight: false,
              },
            },
            filterOptions: {
              labelProps: {},
              dropdownProps: {
                className: 'global-table-search',
                selection: true,
                multiple: true,
                fluid: true,
                search: true,
                placeholder: 'FILTER TEAM MEMBERS',
                options: req.controllerData.team_members.map(team_member => ({
                  value: team_member._id.toString(),
                  text: `${team_member.first_name} ${team_member.last_name}`,
                  image: {
                    avatar: true,
                    spaced: 'right',
                    src: team_member.primaryasset && team_member.primaryasset.fileurl ? team_member.primaryasset.fileurl : REACTAPPSETTINGS.default_user_image,
                  },
                })),
              },
            },
            droppableListProps: {
              style: {
                dragBackground: '#ecf4f7',
                borderRadius: '3px',
                padding: '0.5rem 0 1rem',
                margin: '0',
                minHeight: '100px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              },
            },
            draggableProps: {
              style: {
                dragBackground: '#fbfbfb',
                nonDragBackground: '#f2f2f2',
                borderRadius: '3px',
                padding: '5px 7px',
                margin: '0px 0px 6px',
                boxShadow: '0 2px 3px rgba(17, 17, 17, 0.1), 0 0 0 1px rgba(17, 17, 17, 0.1)',
              },
            },
            itemProps: {
              style: {
                marginTop: '2px',
                color: '#969696',
                fontSize: '13px',
              },
            },
            itemTitleProps: {
              buttonProps: {
                onclickBaseUrl: '/los/applications/:id',
                onclickLinkParams: [ { key: ':id', val: 'id', }, ],
                onClick: 'func:this.props.reduxRouter.push',
              },
              style: {
                fontWeight: '700',
                fontSize: '14px',
                padding: '0px',
              },
            },
            droppableList,
          },
        }, ],
      }, ];

    delete req.controllerData.team_members;
    delete req.controllerData.los_statuses;
    delete req.controllerData.userImageMap;
    delete req.controllerData.applications;
    return req;
  } catch (e) {
    req.error = e;
    return req;
  }
}

async function formatApplicationDataForUpdate(req) {
  try {
    if (req.query && req.query.type === 'patch_loan_info' || req.query.type === 'patch_key_information') {
      const { name, value, value_type, value_category } = los_transform_util.coerceLoanDataType(req.body);
      req.body = Object.assign({}, req.body, { name, value, value_type, value_category });
    } else if (req.query.status) {
      const user = req.user || {};
      const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
      const LosStatus = periodic.datas.get('standard_losstatus');
      if (req.query.status === 'approve') {
        const approvedStatus = await LosStatus.model.findOne({ organization, name: 'Approved', }).lean();
        req.body.status = approvedStatus._id.toString();
        req.body.decision_date = new Date();
      } else if (req.query.status === 'reject') {
        const rejectedStatus = await LosStatus.model.findOne({ organization, name: 'Rejected', }).lean();
        req.body.status = rejectedStatus._id.toString();
        req.body.decision_date = new Date();
      }
    }
    if (req.body && req.body.team_members) req.body.team_members = req.body.team_members.filter(Boolean);
    if (req.body && req.body.labels) req.body.labels = req.body.labels.filter(Boolean);
    if (req.body.loan_amount) {
      req.body.loan_amount = numeral(req.body.loan_amount)._value;
    }
    delete req.body.null;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatApplicationAttributeDetail(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.application) {
      const application = req.controllerData.application;
      req.controllerData.data = req.controllerData.data || {};
      const loan_info = Object.entries(application.key_information).map(([ name, detail, ], idx) => ({ name, value: los_transform_util.formatByValueType(detail), idx, _id: application._id.toString(), value_type: detail.value_type, value_category: detail.value_category }));
      req.controllerData.data = Object.assign({}, req.controllerData.data, loan_info[ req.params.idx ]);
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatCompanyAttributeDetail(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.company) {
      const company = req.controllerData.company;
      req.controllerData.data = req.controllerData.data || {};
      const key_information = Object.entries(company.key_information).map(([ name, detail, ], idx) => ({ name, value: los_transform_util.formatByValueType({ value: detail.value, value_type: detail.value_type, }), idx, _id: company._id.toString(), value_type: detail.value_type, }));
      req.controllerData.data = Object.assign({}, req.controllerData.data, key_information[ req.params.idx ]);
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatPersonAttributeDetail(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.person) {
      const person = req.controllerData.person;
      req.controllerData.data = req.controllerData.data || {};
      const key_information = Object.entries(person.key_information).map(([ name, detail, ], idx) => ({ name, value: los_transform_util.formatByValueType({ value: detail.value, value_type: detail.value_type, }), idx, _id: person._id.toString(), value_type: detail.value_type, }));
      req.controllerData.data = Object.assign({}, req.controllerData.data, key_information[ req.params.idx ]);
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatApplicationDocsIndexTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.data = {
      display_title: req.controllerData.application.title,
    };
    req.controllerData.application.labels = req.controllerData.application.labels || [];
    const breadCrumbSection = [ {
      component: 'Semantic.BreadcrumbSection',
      children: [ {
        component: 'ResponsiveButton',
        props: {
          onclickBaseUrl: `/los/applications/${req.params.id}/docs`,
          onClick: 'func:this.props.reduxRouter.push',
        },
        children: 'All Files',
      }, ],
    }, {
      component: 'i',
      props: {
        'aria-hidden': true,
        className: 'icon caret right',
      },
    }, {
      component: 'Semantic.BreadcrumbSection',
      children: [ {
        component: 'ResponsiveButton',
        props: {
          onclickBaseUrl: `/los/applications/${req.params.id}/docs`,
          onClick: 'func:this.props.reduxRouter.push',
        },
        children: req.controllerData.data.display_title,
      }, ],
    }, ];

    if (req.params.file_id) {
      const LosDoc = periodic.datas.get('standard_losdoc');
      const currentFolder = await LosDoc.model.findOne({ _id: req.params.file_id, }).lean();
      const folderLabels = [ { name: currentFolder.name, id: currentFolder._id.toString(), }, ];
      let currDir = currentFolder.parent_directory;
      while (currDir) {
        currDir = await LosDoc.model.findOne({ _id: currDir.toString(), }).lean();
        folderLabels.unshift({ name: currDir.name, id: currDir._id.toString(), });
        currDir = currDir.parent_directory;
      }

      folderLabels.forEach(label => {
        breadCrumbSection.push({
          component: 'i',
          props: {
            'aria-hidden': true,
            className: 'icon caret right',
          },
        }, {
            component: 'Semantic.BreadcrumbSection',
            children: [ {
              component: 'ResponsiveButton',
              props: {
                onclickBaseUrl: `/los/applications/${req.params.id}/docs/${label.id}`,
                onClick: 'func:this.props.reduxRouter.push',
              },
              children: label.name,
            }, ],
          });
      });
    }
    if (req.controllerData.application && req.controllerData.application.labels) {
      let labelFormatted = req.controllerData.application.labels.map(label => {
        let labelFound = req.controllerData.labels.find(function (obj) {
          return obj._id.toString() === label.toString();
        });
        if (labelFound) {
          return {
            component: 'span',
            children: labelFound.name,
            props: {
              style: {
                padding: '4px 10px',
                display: 'inline-block',
                borderRadius: '4px',
                backgroundColor: labelFound.color,
                color: los_transform_util._pickContrastingFontColor(labelFound.color),
                fontWeight: 700,
                margin: '3px',
                fontSize: '1rem',
              },
            },
          };
        } else {
          return {
            component: 'span',
          };
        }
      });
      delete req.controllerData.labels;
      req.controllerData.labelFormatted = labelFormatted;
    }

    req.controllerData.breadCrumbSection = breadCrumbSection;
    req.controllerData.application = { _id: req.params.id, };
    const [ folders, files, ] = req.controllerData.rows.reduce((tuple, row) => {
      if (row.doc_type === 'folder') {
        tuple[ 0 ].push(row);
      } else {
        tuple[ 1 ].push(row);
      }
      return tuple;
    }, [ [], [], ]);
    req.controllerData.rows = [ ...folders, ...files, ].map(row => {
      row = Object.assign({}, row, {
        updatedat: `${transformhelpers.formatDateNoTime(row.updatedat, req.user.time_zone)} by ${row.user.updater}`,
        doc_type: (row.doc_type === 'folder')
          ? 'File Folder'
          : (documents.document_name[ row.file_extension ])
            ? documents.document_name[ row.file_extension ]
            : 'File',
        name: (row.doc_type === 'folder') ?
          {
            component: 'ResponsiveLink',
            props: {
              location: `/los/applications/${row.application}/docs/${row._id}`,
            },
            children: row.name,
          } : row.name,
        filesize: row.filesize ? prettysize(row.filesize, false, false, '0') : '',
        icon: (row.doc_type === 'folder')
          ? {
            component: 'ResponsiveLink',
            props: {
              location: `/los/applications/${row.application}/docs/${row._id}`,
            },
            children: [ {
              component: 'div',
              props: {
                className: 'table-document-icon',
                style: {
                  backgroundImage: `url(${documents.document_icon[ 'folder' ]})`,
                },
              },
            }, ],
          }
          : {
            component: 'div',
            props: {
              className: 'table-document-icon',
              style: {
                backgroundImage: (row.doc_type === 'folder')
                  ? `url(${documents.document_icon[ 'folder' ]})`
                  : documents.document_icon[ row.file_extension ]
                    ? `url(${documents.document_icon[ row.file_extension ]})`
                    : `url('/images/elements/text-document-color.svg')`,
              },
            },
          },
      });
      return row;
    });
    delete req.controllerData.los_docs;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatApplicationTasksIndexTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    const userImageMap = req.controllerData.userImageMap || {};
    const application = req.controllerData.application;
    req.controllerData.data = {
      display_title: application.title,
    };
    req.controllerData.application.labels = req.controllerData.application.labels || [];
    if (req.controllerData.application && req.controllerData.application.labels) {
      let labelFormatted = req.controllerData.application.labels.map(label => {
        let labelFound = req.controllerData.labels.find(function (obj) {
          return obj._id.toString() === label.toString();
        });
        if (labelFound) {
          return {
            component: 'span',
            children: labelFound.name,
            props: {
              style: {
                padding: '4px 10px',
                display: 'inline-block',
                borderRadius: '4px',
                backgroundColor: labelFound.color,
                color: los_transform_util._pickContrastingFontColor(labelFound.color),
                fontWeight: 700,
                margin: '3px',
                fontSize: '1rem',
              },
            },
          };
        } else {
          return {
            component: 'span',
          };
        }
      });
      delete req.controllerData.labels;
      req.controllerData.labelFormatted = labelFormatted;
    }

    req.controllerData.application = { _id: req.params.id, };
    req.controllerData.rows = req.controllerData.rows.map(task => {
      const { team_members = [], company = null, application = null, people = [], due_date, done, description, _id, } = task;
      const application_name = application ? application.title : '';
      const company_name = company ? company.name : '';
      const filteredTeamMembers = team_members.filter(user => !!user);
      const team_member_names = {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
          },
        },
        children: [ filteredTeamMembers.length ?
          los_transform_util.generateTableIcon(filteredTeamMembers[ 0 ]._id && userImageMap[ filteredTeamMembers[ 0 ]._id.toString() ] || REACTAPPSETTINGS.default_user_image, filteredTeamMembers.length) :
          null, {
          component: 'span',
          props: {
            style: {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          },
          children: filteredTeamMembers.map(user => `${user.first_name} ${user.last_name}`).join(', '),
        }, ],
      };
      const person_names = people.map(person => person.name);
      let dueDate = new Date(due_date);
      let currentDate = new Date();
      const className = done
        ? 'task-complete'
        : !done && dueDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)
          ? 'task-overdue'
          : '';
      return {
        _id,
        done,
        description,
        company: company_name,
        company_id: company ? company._id.toString() : '',
        team_members: team_member_names,
        application: application_name,
        application_id: application ? application._id.toString() : '',
        people: person_names,
        due_date: transformhelpers.formatDateNoTime(due_date, req.user.time_zone),
        rowProps: {
          className,
        },
      };
    });
    const team_members = req.controllerData.team_members.map(member => ({
      value: member._id.toString(),
      text: `${member.first_name} ${member.last_name}`,
      image: {
        avatar: true,
        spaced: 'right',
        src: member.primaryasset && member.primaryasset.fileurl ? member.primaryasset.fileurl : REACTAPPSETTINGS.default_user_image,
      },
    })).sort((a, b) => a.text.toLowerCase() > b.text.toLowerCase() ? 1 : -1);
    req.controllerData.filterButtons = [ {
      headername: 'team_members',
      placeholder: 'FILTER TEAM MEMBERS',
      className: 'global-table-search',
      selection: true,
      multiple: true,
      fluid: true,
      search: true,
      options: team_members,
    }, {
      headername: 'done',
      tabFilter: true,
      style: {
        flex: 'none',
      },
      defaultActiveIndex: 2,
      className: 'global-table-search',
      panes: [ {
        value: '',
        menuItem: 'ALL',
      }, {
        value: 'overdue',
        menuItem: 'OVERDUE',
      }, {
        value: 'today',
        menuItem: 'TODAY',
      }, {
        value: 'tomorrow',
        menuItem: 'TMRW',
      }, {
        value: false,
        menuItem: 'OUTSTANDING',
      }, {
        value: true,
        menuItem: 'DONE',
      }, ],
    }, ];
    req.controllerData.baseUrl = `/los/api/applications/${req.params.id}/tasks?paginate=true`;
    delete req.controllerData.tasks;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatTasksIndexTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    const userImageMap = req.controllerData.userImageMap || {};
    req.controllerData.rows = req.controllerData.rows.map(task => {
      const { team_members = [], company = null, application = null, people = [], due_date, done, description, _id, } = task;
      const application_name = application ? application.title : '';
      const company_name = company ? company.name : '';
      const filteredTeamMembers = team_members.filter(user => !!user);
      const team_member_names = {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
          },
        },
        children: [ filteredTeamMembers.length ?
          los_transform_util.generateTableIcon(filteredTeamMembers[ 0 ]._id && userImageMap[ filteredTeamMembers[ 0 ]._id.toString() ] || REACTAPPSETTINGS.default_user_image, filteredTeamMembers.length) :
          null, {
          component: 'span',
          props: {
            style: {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          },
          children: filteredTeamMembers.map(user => `${user.first_name} ${user.last_name}`).join(', '),
        }, ],
      };
      const person_names = people.map(person => person.name);
      let dueDate = new Date(due_date);
      let currentDate = new Date();
      const className = done
        ? 'task-complete'
        : !done && dueDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)
          ? 'task-overdue'
          : '';
      return {
        _id,
        done,
        description,
        application_id: application ? application._id.toString() : '',
        company_id: company ? company._id.toString() : '',
        company: company_name,
        team_members: team_member_names,
        application: application_name,
        people: person_names,
        due_date: transformhelpers.formatDateNoTime(due_date),
        rowProps: {
          className,
        },
      };
    });
    const team_members = req.controllerData.team_members.map(member => ({
      value: member._id.toString(),
      text: `${member.first_name} ${member.last_name}`,
      image: {
        avatar: true,
        spaced: 'right',
        src: member.primaryasset && member.primaryasset.fileurl ? member.primaryasset.fileurl : REACTAPPSETTINGS.default_user_image,
      },
    })).sort((a, b) => a.text.toLowerCase() > b.text.toLowerCase() ? 1 : -1);
    req.controllerData.filterButtons = [ {
      headername: 'team_members',
      placeholder: 'FILTER TEAM MEMBERS',
      className: 'global-table-search',
      selection: true,
      multiple: true,
      fluid: true,
      search: true,
      options: team_members,
    }, {
      headername: 'done',
      tabFilter: true,
      style: {
        flex: 'none',
      },
      className: 'global-table-search',
      defaultActiveIndex: 2,
      panes: [ {
        value: '',
        menuItem: 'ALL',
      }, {
        value: 'overdue',
        menuItem: 'OVERDUE',
      }, {
        value: 'today',
        menuItem: 'TODAY',
      }, {
        value: 'tomorrow',
        menuItem: 'TMRW',
      }, {
        value: false,
        menuItem: 'OUTSTANDING',
      }, {
        value: true,
        menuItem: 'DONE',
      }, ],
    }, ];
    delete req.controllerData.tasks;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatCompanyTasksIndexTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    const userImageMap = req.controllerData.userImageMap || {};
    req.controllerData.rows = req.controllerData.rows.map(task => {
      const { team_members = [], company = null, application = null, people = [], due_date, done, description, _id, } = task;
      const application_name = application ? application.title : '';
      const company_name = company ? company.name : '';
      const filteredTeamMembers = team_members.filter(user => !!user);
      const team_member_names = {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
          },
        },
        children: [ filteredTeamMembers.length ?
          los_transform_util.generateTableIcon(filteredTeamMembers[ 0 ]._id && userImageMap[ filteredTeamMembers[ 0 ]._id.toString() ] || REACTAPPSETTINGS.default_user_image, filteredTeamMembers.length) :
          null, {
          component: 'span',
          props: {
            style: {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          },
          children: filteredTeamMembers.map(user => `${user.first_name} ${user.last_name}`).join(', '),
        },
        ],
      };
      const person_names = people.map(person => person.name);
      let dueDate = new Date(due_date);
      let currentDate = new Date();
      const className = done
        ? 'task-complete'
        : !done && dueDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)
          ? 'task-overdue'
          : '';
      return {
        _id,
        done,
        description,
        company: company_name,
        team_members: team_member_names,
        application: application_name,
        people: person_names,
        due_date: transformhelpers.formatDateNoTime(due_date),
        application_id: application ? application._id.toString() : '',
        company_id: company ? company._id.toString() : '',
        rowProps: {
          className,
        },
      };
    });
    const team_members = req.controllerData.team_members.map(member => ({
      value: member._id.toString(),
      text: `${member.first_name} ${member.last_name}`,
      image: {
        avatar: true,
        spaced: 'right',
        src: member.primaryasset && member.primaryasset.fileurl ? member.primaryasset.fileurl : REACTAPPSETTINGS.default_user_image,
      },
    })).sort((a, b) => a.text.toLowerCase() > b.text.toLowerCase() ? 1 : -1);
    req.controllerData.filterButtons = [ {
      headername: 'team_members',
      placeholder: 'FILTER TEAM MEMBERS',
      className: 'global-table-search',
      selection: true,
      multiple: true,
      fluid: true,
      search: true,
      options: team_members,
    }, {
      headername: 'done',
      defaultActiveIndex: 2,
      tabFilter: true,
      style: {
        flex: 'none',
      },
      className: 'global-table-search',
      panes: [ {
        value: '',
        menuItem: 'ALL',
      }, {
        value: 'overdue',
        menuItem: 'OVERDUE',
      }, {
        value: 'today',
        menuItem: 'TODAY',
      }, {
        value: 'tomorrow',
        menuItem: 'TMRW',
      }, {
        value: false,
        menuItem: 'OUTSTANDING',
      }, {
        value: true,
        menuItem: 'DONE',
      }, ],
    }, ];
    delete req.controllerData.tasks;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatPersonTasksIndexTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    const userImageMap = req.controllerData.userImageMap || {};
    req.controllerData.rows = req.controllerData.rows.map(task => {
      const { team_members = [], company = null, application = null, people = [], due_date, done, description, _id, } = task;
      const application_name = application ? application.title : '';
      const company_name = company ? company.name : '';
      const filteredTeamMembers = team_members.filter(user => !!user);
      const team_member_names = {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
          },
        },
        children: [ filteredTeamMembers.length ?
          los_transform_util.generateTableIcon(filteredTeamMembers[ 0 ]._id && userImageMap[ filteredTeamMembers[ 0 ]._id.toString() ] || REACTAPPSETTINGS.default_user_image, filteredTeamMembers.length) :
          null, {
          component: 'span',
          props: {
            style: {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          },
          children: filteredTeamMembers.map(user => `${user.first_name} ${user.last_name}`).join(', '),
        },
        ],
      };
      const person_names = people.map(person => person.name).join(', ');
      let dueDate = new Date(due_date);
      let currentDate = new Date();
      const className = done
        ? 'task-complete'
        : !done && dueDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)
          ? 'task-overdue'
          : '';
      return {
        _id,
        done,
        description,
        company: company_name,
        company_id: company ? company._id.toString() : '',
        team_members: team_member_names,
        application: application_name,
        application_id: application ? application._id.toString() : '',
        people: person_names,
        due_date: transformhelpers.formatDateNoTime(due_date),
        rowProps: {
          className,
        },
      };
    });
    const team_members = req.controllerData.team_members.map(member => ({
      value: member._id.toString(),
      text: `${member.first_name} ${member.last_name}`,
      image: {
        avatar: true,
        spaced: 'right',
        src: member.primaryasset && member.primaryasset.fileurl ? member.primaryasset.fileurl : REACTAPPSETTINGS.default_user_image,
      },
    })).sort((a, b) => a.text.toLowerCase() > b.text.toLowerCase() ? 1 : -1);
    req.controllerData.filterButtons = [ {
      headername: 'team_members',
      placeholder: 'FILTER TEAM MEMBERS',
      className: 'global-table-search',
      selection: true,
      multiple: true,
      fluid: true,
      search: true,
      options: team_members,
    }, {
      headername: 'done',
      defaultActiveIndex: 2,
      tabFilter: true,
      style: {
        flex: 'none',
      },
      className: 'global-table-search',
      panes: [ {
        value: '',
        menuItem: 'ALL',
      }, {
        value: 'overdue',
        menuItem: 'OVERDUE',
      }, {
        value: 'today',
        menuItem: 'TODAY',
      }, {
        value: 'tomorrow',
        menuItem: 'TMRW',
      }, {
        value: false,
        menuItem: 'OUTSTANDING',
      }, {
        value: true,
        menuItem: 'DONE',
      }, ],
    }, ];
    delete req.controllerData.tasks;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatCreateTask(req) {
  try {

    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatTaskForm(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.formoptions = req.controllerData.formoptions || {};
    req.controllerData.formdata = req.controllerData.formdata || {};
    const Application = periodic.datas.get('standard_losapplication');
    const Company = periodic.datas.get('standard_loscompany');
    let application = null;
    if (req.controllerData.companies) {
      const companyDropdown = req.controllerData.companies.map(company => ({
        label: company.name,
        value: company._id.toString(),
      })).sort((a, b) => a.label > b.label ? 1 : -1);
      req.controllerData.formoptions.company = companyDropdown;
      delete req.controllerData.companies;
    }
    if (req.controllerData.people) {
      const personDropdown = req.controllerData.people.map(person => ({
        label: person.name,
        value: person._id.toString(),
      })).sort((a, b) => a.label > b.label ? 1 : -1);
      req.controllerData.formoptions.people = personDropdown;
      delete req.controllerData.people;
    }
    if (req.controllerData.applications) {
      const applicationDropdown = req.controllerData.applications.map(app => ({
        label: app.title,
        value: app._id.toString(),
      }));
      req.controllerData.formoptions.application = applicationDropdown;
      delete req.controllerData.applications;
    }
    if (req.controllerData.team_members) {
      const teamMemberDropdown = req.controllerData.team_members.map(member => ({
        label: `${member.first_name} ${member.last_name}`,
        value: member._id.toString(),
        image: member.primaryasset && member.primaryasset.fileurl ? member.primaryasset.fileurl : REACTAPPSETTINGS.default_user_image,
      })).sort((a, b) => a.label > b.label ? 1 : -1);
      req.controllerData.formoptions.team_members = teamMemberDropdown;
      delete req.controllerData.team_members;
    }
    req.controllerData.formoptions.done = [ {
      label: 'Not Done',
      value: false,
    }, {
      label: 'Done',
      value: true,
    }, ];
    let [ , losSection, docId, ] = url.parse(req.headers.referer).pathname.slice(1).split('/');
    // if (losSection === 'applications' && !req.params.id && ObjectID.isValid(docId))
    let today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (losSection === 'applications') {
      if (req.query && req.query.action_type === 'create') {
        req.controllerData.formdata = Object.assign({}, req.controllerData.formdata, {
          application: docId,
        });
        application = await Application.model.findOne({ _id: docId, }).lean();
        if (application && application.customer_id && application.customer_type === 'company') {
          const company = await Company.model.findOne({ _id: application.customer_id, }).lean();
          if (company && company.primary_contact) req.controllerData.formdata.people = [ company.primary_contact.toString(), ];
          req.controllerData.formdata.company = application.customer_id;
        } else if (application && application.customer_id && application.customer_type === 'person') {
          req.controllerData.formdata.people = [ application.customer_id, ];
        }
      } else if (req.query && req.query.action_type === 'edit') {
        req.controllerData.formdata = req.controllerData.task;
      }
    }

    if (req.query && req.query.action_type === 'create') {
      req.controllerData.formdata.done = false;
      req.controllerData.formdata.team_members = [ req.user._id.toString(), ];
      req.controllerData.formdata.due_date = tomorrow;
      req.controllerData._children = application && application.customer_type ? los_transform_util._generateCreateTaskManifest(application.customer_type) : los_transform_util._generateCreateTaskManifest('company');

      if (losSection === 'companies') {
        const company = await Company.model.findOne({ _id: docId, }).lean();
        req.controllerData.formdata.company = docId;
        req.controllerData.formdata.people = (company && company.primary_contact) ? [ company.primary_contact.toString(), ] : [];
      } else if (losSection === 'people') {
        req.controllerData.formdata.people = [ docId, ];
      }
    } else if (req.query && req.query.action_type === 'edit') {
      req.controllerData.formdata = req.controllerData.task;
      req.controllerData._children = application && application.customer_type ? los_transform_util._generateEditTaskManifest(application.customer_type) : los_transform_util._generateEditTaskManifest('company');
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}
async function filterEditFileDropdown(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.parent_directory = req.controllerData.parent_directory || [];
    if (req.params && req.params.id && req.controllerData.formoptions && req.controllerData.formoptions.parent_directory) {
      req.controllerData.formoptions.parent_directory = req.controllerData.formoptions.parent_directory.filter(config => config.value !== req.params.id.toString());
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatDropdowns(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.formoptions = req.controllerData.formoptions || {};
    req.controllerData.formdata = req.controllerData.formdata || {};
    if (req.controllerData.companies) {
      const companyDropdown = req.controllerData.companies.map(company => ({
        label: company.name,
        value: company._id.toString(),
      })).sort((a, b) => a.label > b.label ? 1 : -1);
      req.controllerData.formoptions.company = companyDropdown;
      delete req.controllerData.companies;
    }

    if (req.controllerData.labels) {
      const labelDropdown = req.controllerData.labels.map(label => ({
        label: label.name,
        value: label._id.toString(),
        selectedLabelStyle: {
          backgroundColor: label.color,
          color: los_transform_util._pickContrastingFontColor(label.color),
        },
        content: {
          component: 'span',
          children: label.name,
          props: {
            style: {
              padding: '3px 6px',
              borderRadius: '4px',
              backgroundColor: label.color,
              color: los_transform_util._pickContrastingFontColor(label.color),
              fontWeight: 700,
            },
          },
        },
      })).sort((a, b) => a.label > b.label ? 1 : -1);
      req.controllerData.formoptions.labels = labelDropdown;
      delete req.controllerData.labels;
    }

    if (req.controllerData.intermediaries) {
      const intermediaryDropdown = req.controllerData.intermediaries.map(intermediary => ({
        label: intermediary.name,
        value: intermediary._id.toString(),
      })).sort((a, b) => a.intermediary > b.intermediary ? 1 : -1);
      req.controllerData.formoptions.intermediary = intermediaryDropdown;
      delete req.controllerData.intermediaries;
    }

    if (req.controllerData.parent_directory) {
      const folderMap = {};
      req.controllerData.parent_directory = req.controllerData.parent_directory || [];
      req.controllerData.parent_directory.forEach(folder => folderMap[ folder._id.toString() ] = folder);
      const parentDirectoryDropdown = req.controllerData.parent_directory.map(folder => {
        const folderLabel = [ folder.name, ];
        let currDir = folder.parent_directory;
        while (currDir) {
          folderLabel.unshift(folderMap[ currDir.toString() ].name);
          currDir = folderMap[ currDir.toString() ].parent_directory;
        }
        return {
          label: folderLabel.join('/'),
          value: folder._id.toString(),
        };
      }).sort((a, b) => a.label > b.label ? 1 : -1);
      req.controllerData.formoptions.parent_directory = parentDirectoryDropdown;
      req.controllerData.formoptions.parent_directory.unshift({ label: '', value: null, });
      delete req.controllerData.parent_directory;
    }

    if (req.controllerData.people) {
      const personDropdown = req.controllerData.people.map(person => ({
        label: person.name,
        value: person._id.toString(),
      })).sort((a, b) => a.label > b.label ? 1 : -1);
      req.controllerData.formoptions.person = personDropdown;
      delete req.controllerData.people;
    }
    if (req.controllerData.applications) {
      const applicationDropdown = req.controllerData.applications.map(app => ({
        label: app.title,
        value: app._id.toString(),
      }));
      req.controllerData.formoptions.application = applicationDropdown;
      delete req.controllerData.applications;
    }
    if (req.controllerData.team_members) {
      const teamMemberDropdown = req.controllerData.team_members.map(member => ({
        label: `${member.first_name} ${member.last_name}`,
        value: member._id.toString(),
        image: member.primaryasset && member.primaryasset.fileurl ? member.primaryasset.fileurl : REACTAPPSETTINGS.default_user_image,
      })).sort((a, b) => a.label > b.label ? 1 : -1);
      req.controllerData.formoptions.team_members = teamMemberDropdown;
      delete req.controllerData.team_members;
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatProductsIndexTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.application = { _id: req.params.id, };
    if (req.controllerData.products) {
      req.controllerData.rows = req.controllerData.products.map(product => {
        product.createdat = transformhelpers.formatDateNoTime(product.createdat, req.user.time_zone);
        product.updatedat = transformhelpers.formatDateNoTime(product.updatedat, req.user.time_zone);
        product.customer_type = capitalize(product.customer_type);
        return product;
      });
    }
    // req.controllerData.rows = req.controllerData.rows.map(task => {
    //   const { team_members = [], company = null, application = null, people = [], due_date, done, description, _id, } = task;
    //   const application_name = application ? application.title : '';
    //   const company_name = company ? company.name : '';
    //   const team_member_names = team_members.map(user => `${user.first_name} ${user.last_name}`).join(', ');
    //   const person_names = people.map(person => `${person.first_name} ${person.last_name}`).join(', ');
    //   return {
    //     _id,
    //     done,
    //     description,
    //     company: company_name,
    //     team_members: team_member_names,
    //     application: application_name,
    //     people: person_names,
    //     due_date: transformhelpers.formatDateNoTime(due_date),
    //   };
    // })
    delete req.controllerData.products;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function prefillDropdowns(req) {
  try {
    if (req.controllerData.company) {
      req.controllerData = req.controllerData || {};
      req.controllerData.formdata = req.controllerData.formdata || {};
      req.controllerData.formdata = Object.assign({}, req.controllerData.formdata, { company: req.controllerData.company._id.toString(), });
    }
    if (req.controllerData.intermediary) {
      req.controllerData = req.controllerData || {};
      req.controllerData.formdata = req.controllerData.formdata || {};
      req.controllerData.formdata = Object.assign({}, req.controllerData.formdata, { intermediary: req.controllerData.intermediary._id.toString(), });
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}
async function formatProductDetail(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.product) {
      const product = req.controllerData.product;
      product.createdat = transformhelpers.formatDateNoTime(product.createdat, req.user.time_zone);
      if (product.user && product.user.creator) product.createdat += ` by ${product.user.creator}`;
      product.updatedat = transformhelpers.formatDateNoTime(product.updatedat, req.user.time_zone);
      if (product.user && product.user.updater) product.updatedat += ` by ${product.user.updater}`;
      product.template = product.template || {};
      const template_info = Object.entries(product.template).map(([ name, detail, ], idx) => {
        let value;
        if (detail.value === null) value = '';
        else value = los_transform_util.formatByValueType(detail);
        return {
          idx,
          name,
          value_type: detail.value_type === 'boolean' ? 'True/False' : capitalize(detail.value_type || ''),
          _id: product._id.toString(),
          value,
        };
      });
      product.template_info = template_info;
      req.controllerData.product = product;
      req.controllerData.data = {
        display_title: product.name,
      };
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatCustomerTemplateTables(req) {
  try {
    req.controllerData = req.controllerData || {};
    const { companytemplate, persontemplate, intermediarytemplate, } = req.controllerData;

    if (companytemplate) {
      companytemplate.createdat = transformhelpers.formatDateNoTime(companytemplate.createdat, req.user.time_zone);
      if (companytemplate.user && companytemplate.user.creator) companytemplate.createdat += ` by ${companytemplate.user.creator}`;
      companytemplate.updatedat = transformhelpers.formatDateNoTime(companytemplate.updatedat, req.user.time_zone);
      if (companytemplate.user && companytemplate.user.updater) companytemplate.updatedat += ` by ${companytemplate.user.updater}`;
      companytemplate.template = companytemplate.template || {};
      const template_info = Object.entries(companytemplate.template).map(([ name, detail, ], idx) => ({ name, value_type: capitalize(detail.value_type || ''), idx, _id: companytemplate._id.toString(), }));
      companytemplate.template_info = template_info;
      req.controllerData.companytemplate = companytemplate;
    }

    if (persontemplate) {
      persontemplate.createdat = transformhelpers.formatDateNoTime(persontemplate.createdat, req.user.time_zone);
      if (persontemplate.user && persontemplate.user.creator) persontemplate.createdat += ` by ${persontemplate.user.creator}`;
      persontemplate.updatedat = transformhelpers.formatDateNoTime(persontemplate.updatedat, req.user.time_zone);
      if (persontemplate.user && persontemplate.user.updater) persontemplate.updatedat += ` by ${persontemplate.user.updater}`;
      persontemplate.template = persontemplate.template || {};
      const template_info = Object.entries(persontemplate.template).map(([ name, detail, ], idx) => ({ name, value_type: capitalize(detail.value_type || ''), idx, _id: persontemplate._id.toString(), }));
      persontemplate.template_info = template_info;
      req.controllerData.persontemplate = persontemplate;
    }

    if (intermediarytemplate) {
      intermediarytemplate.createdat = transformhelpers.formatDateNoTime(intermediarytemplate.createdat, req.user.time_zone);
      if (intermediarytemplate.user && intermediarytemplate.user.creator) intermediarytemplate.createdat += ` by ${intermediarytemplate.user.creator}`;
      intermediarytemplate.updatedat = transformhelpers.formatDateNoTime(intermediarytemplate.updatedat, req.user.time_zone);
      if (intermediarytemplate.user && intermediarytemplate.user.updater) intermediarytemplate.updatedat += ` by ${intermediarytemplate.user.updater}`;
      intermediarytemplate.template = intermediarytemplate.template || {};
      const template_info = Object.entries(intermediarytemplate.template).map(([ name, detail, ], idx) => ({ name, value_type: capitalize(detail.value_type || ''), idx, _id: intermediarytemplate._id.toString(), }));
      intermediarytemplate.template_info = template_info;
      req.controllerData.intermediarytemplate = intermediarytemplate;
    }

    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatCustomerTemplateDetail(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.customertemplate) {
      const customertemplate = req.controllerData.customertemplate;
      const template_info = Object.entries(customertemplate.template).map(([ name, detail, ], idx) => ({ name, value_type: detail.value_type, idx, _id: customertemplate._id.toString(), }));
      req.controllerData.data = Object.assign({}, req.controllerData.data, template_info[ req.params.idx ]);
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatPersonDataForUpdate(req) {
  try {
    req.body = req.body || {};
    if (req.body.person) req.params.id = req.body.person;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatDocumentDataForUpdate(req) {
  try {
    if (req.body.name && req.controllerData.doc && req.controllerData.doc.doc_type === 'file') {
      const doc = req.controllerData.doc || {};
      let name = req.body.name;
      const dotIdx = name.indexOf('.');
      name = name.substring(0, dotIdx != -1 ? dotIdx : name.length);
      req.body.name = `${name}.${doc.file_extension}`;
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatProductTemplateDetail(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.product) {
      const product = req.controllerData.product;
      const template_info = Object.entries(product.template).map(([ name, detail, ], idx) => ({ name, value_type: detail.value_type, idx, _id: product._id.toString(), value: los_transform_util.formatByValueType(detail), }));
      req.controllerData.data = Object.assign({}, req.controllerData.data, template_info[ req.params.idx ]);
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatTemplatesIndexTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.rows) {
      req.controllerData.rows = req.controllerData.rows.map(template => {
        template.createdat = transformhelpers.formatDateNoTime(template.createdat, req.user.time_zone);
        template.updatedat = transformhelpers.formatDateNoTime(template.updatedat, req.user.time_zone);
        if (template.user && template.user.creator) template.createdat += ` by ${template.user.creator}`;
        if (template.user && template.user.updater) template.updatedat += ` by ${template.user.updater}`;
        return template;
      });
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function setCompanyDisplayTitle(req) {
  try {
    req.controllerData.data = {
      display_title: req.controllerData.company ? req.controllerData.company.name : '',
    };
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function setPersonDisplayTitle(req) {
  try {
    req.controllerData.data = {
      display_title: req.controllerData.person ? req.controllerData.person.name : '',
    };
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatTemplateDetail(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.template) {
      const template = req.controllerData.template;
      template.createdat = transformhelpers.formatDateNoTime(template.createdat, req.user.time_zone);
      if (template.user && template.user.creator) template.createdat += ` by ${template.user.creator}`;
      template.updatedat = transformhelpers.formatDateNoTime(template.updatedat, req.user.time_zone);
      if (template.user && template.user.updater) template.updatedat += ` by ${template.user.updater}`;
      template.fields = template.fields || {};
      const field_info = Object.entries(template.fields).map(([ name, detail, ], idx) => ({ name, value_type: capitalize(detail.value_type || ''), value: detail.value || '', idx, _id: template._id.toString(), }));
      template.field_info = field_info;
      req.controllerData.template = template;
      req.controllerData.data = req.controllerData.data || {};
      req.controllerData.data.display_title = template.name;
      const templatePDFViewer = utilities.views.los.components.templatePDFViewer;
      const templateForm = templatePDFViewer({ template, template_string: req.controllerData.template_string, page: req.params.page, });
      req.controllerData._children = [
        templateForm,
      ];
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatTemplateFieldDetail(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.template) {
      const template = req.controllerData.template;
      const fields_info = Object.entries(template.fields).map(([ name, detail, ], idx) => ({ name, value_type: detail.value_type || '', value: detail.value || '', idx, _id: template._id.toString(), }));
      req.controllerData.data = Object.assign({}, req.controllerData.data, fields_info[ req.params.idx ]);
      const TEMPLATE_DEFAULT_DROPDOWN = CONSTANTS.LOS.TEMPLATE_DEFAULT_DROPDOWN;
      const valueDropdown = [
        ...TEMPLATE_DEFAULT_DROPDOWN.application, ...TEMPLATE_DEFAULT_DROPDOWN.company, ...TEMPLATE_DEFAULT_DROPDOWN.person, ];
      req.controllerData.formoptions = {
        value: valueDropdown,
      };
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatCommunicationForm(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.formoptions = req.controllerData.formoptions || {};
    req.controllerData.formdata = req.controllerData.formdata || {};
    const Application = periodic.datas.get('standard_losapplication');
    const Company = periodic.datas.get('standard_loscompany');
    if (req.controllerData.applications) {
      const applicationDropdown = req.controllerData.applications.map(app => ({
        label: app.title,
        value: app._id.toString(),
      }));
      req.controllerData.formoptions.application = applicationDropdown;
      delete req.controllerData.applications;
    }
    if (req.controllerData.people) {
      const personDropdown = req.controllerData.people.map(person => ({
        label: person.name,
        value: person._id.toString(),
      })).sort((a, b) => a.label > b.label ? 1 : -1);
      req.controllerData.formoptions.people = personDropdown;
      delete req.controllerData.people;
    }
    if (req.controllerData.team_members) {
      const teamMemberDropdown = req.controllerData.team_members.map(member => ({
        label: `${member.first_name} ${member.last_name}`,
        value: member._id.toString(),
        image: member.primaryasset && member.primaryasset.fileurl ? member.primaryasset.fileurl : REACTAPPSETTINGS.default_user_image,
      })).sort((a, b) => a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1);
      req.controllerData.formoptions.team_members = teamMemberDropdown;
      delete req.controllerData.team_members;
    }
    let [ , losSection, docId, ] = url.parse(req.headers.referer).pathname.slice(1).split('/');
    if (req.query && req.query.action_type === 'create') {
      req.controllerData.formdata = {
        date: new Date(),
        team_members: [ req.user._id.toString(), ],
      };

      if (losSection === 'companies') {
        const company = await Company.model.findOne({ _id: docId, }).lean();
        req.controllerData.formdata.people = (company && company.primary_contact) ? [ company.primary_contact.toString(), ] : [];
      } else if (losSection === 'people') {
        req.controllerData.formdata.people = [ docId, ];
      }
    }
    // if (losSection === 'applications' && !req.params.id && ObjectID.isValid(docId))
    if (losSection === 'applications') {
      if (req.query && req.query.action_type === 'create') {
        const application = await Application.model.findOne({ _id: docId, }).lean();
        if (application.customer_type === 'company') {
          const company = await Company.model.findOne({ _id: application.customer_id, }).lean();
          if (company && company.primary_contact) req.controllerData.formdata.people = [ company.primary_contact.toString(), ];
        } else if (application.customer_type === 'person') {
          req.controllerData.formdata.people = application.customer_id ? [ application.customer_id, ] : [];
        }
      } else if (req.query && req.query.action_type === 'edit') {
        req.controllerData.formdata = req.controllerData.communication;
      }
    } else if (req.query && req.query.action_type === 'edit') {
      req.controllerData.formdata = req.controllerData.communication;
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatCommunicationsIndexTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    const userImageMap = req.controllerData.userImageMap || {};
    req.controllerData.rows = req.controllerData.rows.map(communication => {
      const { team_members = [], company = null, application = null, people = [], date, subject, description, _id, type, } = communication;
      const application_name = application ? application.title : '';
      const filteredTeamMembers = team_members.filter(user => !!user);
      const team_member_names = {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
          },
        },
        children: [ filteredTeamMembers.length ?
          los_transform_util.generateTableIcon(filteredTeamMembers[ 0 ]._id && userImageMap[ filteredTeamMembers[ 0 ]._id.toString() ] || REACTAPPSETTINGS.default_user_image, filteredTeamMembers.length) :
          null, {
          component: 'span',
          props: {
            style: {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          },
          children: filteredTeamMembers.map(user => `${user.first_name} ${user.last_name}`).join(', '),
        },
        ],
      };
      const person_names = people.map(person => person.name);
      return {
        _id,
        description,
        subject,
        type: los_transform_util._formatCommunicationType(type),
        application: application_name,
        team_members: team_member_names,
        people: person_names,
        date: transformhelpers.formatDateNoTime(date, req.user.time_zone),
      };
    });
    req.controllerData.filterButtons = [ {
      headername: 'type',
      placeholder: 'TYPE',
      className: 'global-table-search',
      selection: true,
      multiple: true,
      fluid: true,
      search: true,
      options: [ {
        value: 'phone',
        text: 'Phone Call',
        icon: 'phone rotated',
      }, {
        value: 'email',
        text: 'Email',
        icon: 'envelope outline',
      }, {
        value: 'meeting',
        text: 'Meeting',
        icon: 'users',
      }, {
        value: 'other',
        text: 'Other',
        icon: 'ellipsis horizontal',
      }, ],
    }, ];
    delete req.controllerData.communications;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatApplicationCommunicationsIndexTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    const userImageMap = req.controllerData.userImageMap || {};
    const application = req.controllerData.application;
    const application_name = application ? application.title : '';
    req.controllerData.data = {
      display_title: application.title,
    };
    req.controllerData.application.labels = req.controllerData.application.labels || [];
    if (req.controllerData.application && req.controllerData.application.labels) {
      let labelFormatted = req.controllerData.application.labels.map(label => {
        let labelFound = req.controllerData.labels.find(function (obj) {
          return obj._id.toString() === label.toString();
        });
        if (labelFound) {
          return {
            component: 'span',
            children: labelFound.name,
            props: {
              style: {
                padding: '4px 10px',
                display: 'inline-block',
                borderRadius: '4px',
                backgroundColor: labelFound.color,
                color: los_transform_util._pickContrastingFontColor(labelFound.color),
                fontWeight: 700,
                margin: '3px',
                fontSize: '1rem',
              },
            },
          };
        } else {
          return {
            component: 'span',
          };
        }
      });
      delete req.controllerData.labels;
      req.controllerData.labelFormatted = labelFormatted;
    }

    req.controllerData.application = { _id: req.params.id, };
    req.controllerData.rows = req.controllerData.rows.map(communication => {
      const { team_members = [], company = null, application = null, people = [], date, subject, description, _id, type, } = communication;
      const filteredTeamMembers = team_members.filter(user => !!user);
      const team_member_names = {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
          },
        },
        children: [ filteredTeamMembers.length ?
          los_transform_util.generateTableIcon(filteredTeamMembers[ 0 ]._id && userImageMap[ filteredTeamMembers[ 0 ]._id.toString() ] || REACTAPPSETTINGS.default_user_image, team_members.length) :
          null, {
          component: 'span',
          props: {
            style: {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          },
          children: team_members.map(user => `${user.first_name} ${user.last_name}`).join(', '),
        },
        ],
      };

      const person_names = people.map(person => person.name);
      return {
        _id,
        description,
        subject,
        type: los_transform_util._formatCommunicationType(type),
        team_members: team_member_names,
        application: application_name,
        people: person_names,
        date: transformhelpers.formatDateNoTime(new Date(), req.user.time_zone),
      };
    });
    req.controllerData.baseUrl = `/los/api/applications/${req.params.id}/communications?paginate=true`;
    req.controllerData.filterButtons = [ {
      headername: 'type',
      placeholder: 'TYPE',
      className: 'global-table-search',
      selection: true,
      multiple: true,
      fluid: true,
      search: true,
      options: [ {
        value: 'phone',
        text: 'Phone Call',
        icon: 'phone rotated',
      }, {
        value: 'email',
        text: 'Email',
        icon: 'envelope outline',
      }, {
        value: 'meeting',
        text: 'Meeting',
        icon: 'users',
      }, {
        value: 'other',
        text: 'Other',
        icon: 'ellipsis horizontal',
      }, ],
    }, ];

    delete req.controllerData.communications;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatCompanyCommunicationsIndexTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    const userImageMap = req.controllerData.userImageMap || {};
    req.controllerData.rows = req.controllerData.rows.map(communication => {
      const { team_members = [], company = null, application = null, people = [], date, subject, description, _id, type, } = communication;
      const filteredTeamMembers = team_members.filter(user => !!user);
      const team_member_names = {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
          },
        },
        children: [ filteredTeamMembers.length ?
          los_transform_util.generateTableIcon(filteredTeamMembers[ 0 ]._id && userImageMap[ filteredTeamMembers[ 0 ]._id.toString() ] || REACTAPPSETTINGS.default_user_image, filteredTeamMembers.length) :
          null, {
          component: 'span',
          props: {
            style: {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          },
          children: filteredTeamMembers.map(user => `${user.first_name} ${user.last_name}`).join(', '),
        },
        ],
      };
      const person_names = people.map(person => person.name);
      return {
        _id,
        description,
        subject,
        type: los_transform_util._formatCommunicationType(type),
        team_members: team_member_names,
        people: person_names,
        date: transformhelpers.formatDateNoTime(new Date(), req.user.time_zone),
      };
    });
    req.controllerData.baseUrl = `/los/api/customers/companies/${req.params.id}/communications?paginate=true`;
    req.controllerData.filterButtons = [ {
      headername: 'type',
      placeholder: 'TYPE',
      className: 'global-table-search',
      selection: true,
      multiple: true,
      fluid: true,
      search: true,
      options: [ {
        value: 'phone',
        text: 'Phone Call',
        icon: 'phone rotated',
      }, {
        value: 'email',
        text: 'Email',
        icon: 'envelope outline',
      }, {
        value: 'meeting',
        text: 'Meeting',
        icon: 'users',
      }, {
        value: 'other',
        text: 'Other',
        icon: 'ellipsis horizontal',
      }, ],
    }, ];

    req.controllerData.data = {
      display_title: req.controllerData.company.name,
    };
    delete req.controllerData.communications;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatPeopleCommunicationsIndexTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    const userImageMap = req.controllerData.userImageMap || {};
    req.controllerData.rows = req.controllerData.rows.map(communication => {
      const { team_members = [], company = null, people = [], date, subject, description, _id, type, } = communication;
      const filteredTeamMembers = team_members.filter(user => !!user);
      const team_member_names = {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
          },
        },
        children: [ filteredTeamMembers.length ?
          los_transform_util.generateTableIcon(filteredTeamMembers[ 0 ]._id && userImageMap[ filteredTeamMembers[ 0 ]._id.toString() ] || REACTAPPSETTINGS.default_user_image, filteredTeamMembers.length) :
          null, {
          component: 'span',
          props: {
            style: {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          },
          children: team_members.map(user => `${user.first_name} ${user.last_name}`).join(', '),
        },
        ],
      };
      const person_names = people.map(person => person.name);
      return {
        _id,
        description,
        subject,
        type: los_transform_util._formatCommunicationType(type),
        team_members: team_member_names,
        people: person_names,
        date: transformhelpers.formatDateNoTime(new Date(), req.user.time_zone),
      };
    });
    req.controllerData.baseUrl = `/los/api/customers/people/${req.params.id}/communications?paginate=true`;
    req.controllerData.filterButtons = [ {
      headername: 'type',
      placeholder: 'TYPE',
      className: 'global-table-search',
      selection: true,
      multiple: true,
      fluid: true,
      search: true,
      options: [ {
        value: 'phone',
        text: 'Phone Call',
        icon: 'phone rotated',
      }, {
        value: 'email',
        text: 'Email',
        icon: 'envelope outline',
      }, {
        value: 'meeting',
        text: 'Meeting',
        icon: 'users',
      }, {
        value: 'other',
        text: 'Other',
        icon: 'ellipsis horizontal',
      }, ],
    }, ];

    req.controllerData.data = {
      display_title: req.controllerData.person.name,
    };
    delete req.controllerData.communications;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatNotesIndexTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.rows) {
      req.controllerData.rows = req.controllerData.rows.map((row, idx) => {
        row.createdat = transformhelpers.formatDateNoTime(row.createdat, req.user.time_zone);
        row.updatedat = transformhelpers.formatDateNoTime(row.updatedat, req.user.time_zone);
        row.note_id = row._id.toString();
        return row;
      });
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatDocsIndexTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.rows) {
      req.controllerData.rows = req.controllerData.rows.map((row, idx) => {
        row.filesize = prettysize(row.filesize, false, false, '0');
        row.doc_type = (row.doc_type === 'folder')
          ? 'File Folder'
          : (documents.document_name[ row.file_extension ])
            ? documents.document_name[ row.file_extension ]
            : 'File';
        row.icon = (row.doc_type === 'folder')
          ? {
            component: 'ResponsiveLink',
            props: {
              location: `/los/applications/${row.application}/docs/${row._id}`,
            },
            children: [ {
              component: 'div',
              props: {
                className: 'table-document-icon',
                style: {
                  backgroundImage: `url(${documents.document_icon[ 'folder' ]})`,
                },
              },
            }, ],
          }
          : {
            component: 'div',
            props: {
              className: 'table-document-icon',
              style: {
                backgroundImage: (row.doc_type === 'folder')
                  ? `url(${documents.document_icon[ 'folder' ]})`
                  : documents.document_icon[ row.file_extension ]
                    ? `url(${documents.document_icon[ row.file_extension ]})`
                    : `url('/images/elements/text-document-color.svg')`,
              },
            },
          };
        row.createdat = transformhelpers.formatDateNoTime(row.createdat, req.user.time_zone);
        row.updatedat = transformhelpers.formatDateNoTime(row.updatedat, req.user.time_zone);
        if (row.user && row.user.creator) row.createdat += ` by ${row.user.creator}`;
        if (row.user && row.user.updater) row.updatedat += ` by ${row.user.updater}`;
        return row;
      });
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatUploadDocFormDropdown(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.formoptions = req.controllerData.formoptions || {};
    req.controllerData.formdata = req.controllerData.formdata || {};
    if (req.controllerData.application) {
      const applicationDropdown = req.controllerData.application.map(app => ({
        label: app.title,
        value: app._id.toString(),
      }));
      req.controllerData.formoptions.application = applicationDropdown;
      if (req.query && req.query.prepopulate) {
        const parsed = url.parse(req.headers.referer).pathname.slice(1).split('/') || [];
        const applicationIdx = parsed.indexOf('applications');
        req.controllerData.formdata.application = parsed[ applicationIdx + 1 ];
      }
      delete req.controllerData.application;
    } else if (req.controllerData.company) {
      const companyDropdown = req.controllerData.company.map(company => ({
        label: company.name,
        value: company._id.toString(),
      }));
      req.controllerData.formoptions.company = companyDropdown;
      if (req.query && req.query.prepopulate) {
        const parsed = url.parse(req.headers.referer).pathname.slice(1).split('/') || [];
        const companyIdx = parsed.indexOf('companies');
        req.controllerData.formdata.company = parsed[ companyIdx + 1 ];
      }
      delete req.controllerData.company;
    } else if (req.controllerData.person) {
      const personDropdown = req.controllerData.person.map(person => ({
        label: person.name,
        value: person._id.toString(),
      }));
      req.controllerData.formoptions.person = personDropdown;
      if (req.query && req.query.prepopulate) {
        const parsed = url.parse(req.headers.referer).pathname.slice(1).split('/') || [];
        const personIdx = parsed.indexOf('people');
        req.controllerData.formdata.person = parsed[ personIdx + 1 ];
      }
      delete req.controllerData.person;
    } else if (req.controllerData.intermediary) {
      const intermediaryDropdown = req.controllerData.intermediary.map(intermediary => ({
        label: intermediary.name,
        value: intermediary._id.toString(),
      }));
      req.controllerData.formoptions.intermediary = intermediaryDropdown;
      if (req.query && req.query.prepopulate) {
        const parsed = url.parse(req.headers.referer).pathname.slice(1).split('/') || [];
        const intermediaryIdx = parsed.indexOf('intermediaries');
        req.controllerData.formdata.intermediary = parsed[ intermediaryIdx + 1 ];
      }
      delete req.controllerData.intermediary;
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatDocumentDetail(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.doc) {
      const doc = req.controllerData.doc;
      doc.createdat = transformhelpers.formatDateNoTime(doc.createdat, req.user.time_zone);
      if (doc.user && doc.user.creator) doc.createdat += ` by ${doc.user.creator}`;
      doc.updatedat = transformhelpers.formatDateNoTime(doc.updatedat, req.user.time_zone);
      if (doc.user && doc.user.updater) doc.updatedat += ` by ${doc.user.updater}`;
      req.controllerData.formdata = doc;
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatSelectTemplateForm(req) {
  try {
    req.controllerData.formoptions = req.controllerData.formoptions || {};
    req.controllerData.formdata = req.controllerData.application;
    if (req.controllerData.templates) {
      const templateDropdown = req.controllerData.templates.map(template => ({
        label: template.name,
        value: template._id.toString(),
      })).sort((a, b) => a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1);
      req.controllerData.formoptions.template = templateDropdown;
      delete req.controllerData.templates;
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function createGenerateDocumentForm(req) {
  try {
    req.controllerData.formoptions = req.controllerData.formoptions || {};
    req.controllerData.formdata = req.controllerData.application;
    if (req.controllerData.parent_directory) {
      const folderMap = {};
      req.controllerData.parent_directory = req.controllerData.parent_directory || [];
      req.controllerData.parent_directory.forEach(folder => folderMap[ folder._id.toString() ] = folder);
      req.controllerData.formoptions.parent_directory = req.controllerData.parent_directory.map(folder => {
        const folderLabel = [ folder.name, ];
        let currDir = folder.parent_directory;
        while (currDir) {
          folderLabel.unshift(folderMap[ currDir.toString() ].name);
          currDir = folderMap[ currDir.toString() ].parent_directory;
        }
        return {
          label: folderLabel.join('/'),
          value: folder._id.toString(),
        };
      }).sort((a, b) => a.label > b.label ? 1 : -1);
      req.controllerData.formoptions.parent_directory.unshift({ label: '', value: null, });
      delete req.controllerData.parent_directory;
    }
    const template = req.controllerData.template;
    const application = req.controllerData.application;
    const customer = req.controllerData.customer;
    const coapplicant = req.controllerData.coapplicant;
    const intermediary = req.controllerData.intermediary;
    const autoPopulationFieldMap = los_transform_util._generateAutoPopulationMap({ application, customer, coapplicant, intermediary, isFormatted: true, });

    const form = los_transform_util._createGenerateDocForm({ parentDirectoryDropdown: req.controllerData.formoptions.parent_directory, template, application, autoPopulationFieldMap, });
    req.controllerData._children = [ form, ];
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatTemplateFields(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.template) {
      const template = req.controllerData.template;
      const fields_info = Object.entries(template.fields).map(([ name, detail, ], idx) => ({ name, value_type: detail.value_type || '', value: detail.value || '', idx, _id: template._id.toString(), }));
      req.controllerData.data = Object.assign({}, req.controllerData.data, fields_info);
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function assignParentDirectory(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.formdata = req.controllerData.formdata || {};
    let parsed = url.parse(req.headers.referer).pathname.slice(1).split('/') || [];
    let docId = parsed[ parsed.length - 1 ];
    if (ObjectID.isValid(docId)) {
      req.controllerData.application.parent_directory = docId;
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatApplicationCasesIndexTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.rows = req.controllerData.rows || [];
    if (req.controllerData.cases) {
      req.controllerData.rows = req.controllerData.rows.concat(req.controllerData.cases.sort((a, b) => a.createdat > b.createdat ? -1 : 1).map(row => {
        return {
          _id: row._id.toString(),
          case_name: row.case_name,
          result: row.passed ? 'Passed' : (row.error && row.error.length) ? 'Errored' : 'Failed',
          processing_type: 'Automated Process',
          createdat: transformhelpers.formatDateNoTime(row.createdat, req.user.time_zone),
          detail_url: `decision/processing/individual/results/${row._id.toString()}`,
          download_url: `simulation/api/download/case/${row._id.toString()}`,
          delete_url: `simulation/api/individual/results/${row._id.toString()}`,
        };
      }));
    }
    if (req.controllerData.rows) {
      req.controllerData.rows = req.controllerData.rows.map(row => {
        return {
          _id: row._id.toString(),
          case_name: row.case_name,
          result: row.passed ? 'Passed' : (row.error && row.error.length) ? 'Errored' : 'Failed',
          processing_type: 'Automated Process',
          createdat: transformhelpers.formatDateNoTime(row.createdat, req.user.time_zone),
          detail_url: `decision/processing/individual/results/${row._id.toString()}`,
          download_url: `simulation/api/download/case/${row._id.toString()}`,
          delete_url: `simulation/api/individual/results/${row._id.toString()}`,
        };
      });
    }
    if (req.controllerData.mlcases) {
      req.controllerData.rows = req.controllerData.rows.concat(req.controllerData.mlcases.sort((a, b) => a.createdat > b.createdat ? -1 : 1).map(row => {
        let prediction_result;
        if (row.industry) {
          prediction_result = numeral(row.prediction).format('0,0.[0]%');
          prediction_result += ' ADR';
        } else {
          prediction_result = transformhelpers.returnAIDecisionResultData(row).ai_prediction_value;
        }
        return {
          _id: row._id.toString(),
          case_name: row.model_name,
          result: prediction_result,
          processing_type: 'Machine Learning',
          createdat: transformhelpers.formatDateNoTime(row.createdat, req.user.time_zone),
          detail_url: `ml/individual/results/${row._id.toString()}`,
          download_url: `ml/api/download/case/${row._id.toString()}`,
          delete_url: `ml/api/individual/results/${row._id.toString()}`,
        };
      }));
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatRunAutomatedDecisionForm(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.compiled_strategy) {
      const input_variables = (req.controllerData.compiled_strategy && req.controllerData.compiled_strategy.input_variables) ? req.controllerData.compiled_strategy.input_variables.filter(input_variable => Boolean(input_variable)) : [];
      const application = req.controllerData.application;
      const customer = req.controllerData.customer;
      const autoPopulationFieldMap = los_transform_util._generateAutoPopulationMap({ application, customer, isFormatted: false, });
      const mapInputFields = los_transform_util.generateInputFields({ initValues: autoPopulationFieldMap, });
      const inputFields = input_variables.map(mapInputFields);
      const application_id = application._id.toString();
      const strategy_id = req.controllerData.compiled_strategy._id.toString();
      const form = los_transform_util._generateAutomateDecisionForm({ inputs: inputFields, strategy_id, application_id, });
      req.controllerData._children = [
        form,
      ];
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatApplicationLabelsIndexTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.rows) {
      req.controllerData.rows = req.controllerData.rows.map(row => {
        row.createdat = transformhelpers.formatDateNoTime(row.createdat, req.user.time_zone);
        if (row.user && row.user.creator) row.createdat += ` by ${row.user.creator}`;
        row.updatedat = transformhelpers.formatDateNoTime(row.updatedat, req.user.time_zone);
        if (row.user && row.user.updater) row.updatedat += ` by ${row.user.updater}`;
        row.name = los_transform_util._generateLabelTag(row.name, row.color);
        return row;
      });
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatRunAutomatedMLForm(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.mlmodel) {
      const mlmodel = req.controllerData.mlmodel;
      const datasource = mlmodel.datasource || {};
      const included_columns = (datasource && datasource.included_columns) ? JSON.parse(datasource.included_columns) : {};
      const input_variables = [];
      for (let [ key, val, ] of Object.entries(included_columns)) {
        if (key !== 'historical_result') {
          input_variables.push({ title: key, display_title: key, data_type: val.data_type, });
        }
      }
      const application = req.controllerData.application;
      const customer = req.controllerData.customer;
      const autoPopulationFieldMap = los_transform_util._generateAutoPopulationMap({ application, customer, isFormatted: false, });
      Object.keys(autoPopulationFieldMap).forEach(fieldname => {
        const ml_fieldname = fieldname.toLowerCase().replace(/\s+/g, '_');
        autoPopulationFieldMap[ ml_fieldname ] = autoPopulationFieldMap[ fieldname ];
      });
      const mapInputFields = los_transform_util.generateInputFields({ initValues: autoPopulationFieldMap, });
      const inputFields = input_variables.map(mapInputFields);
      const application_id = application._id.toString();
      const mlmodel_id = mlmodel._id.toString();
      const form = los_transform_util._generateAutomateMLForm({ inputs: inputFields, mlmodel_id, application_id, });
      req.controllerData._children = [
        form,
      ];
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatNewPersonModal(req) {
  try {
    req.controllerData = req.controllerData || {};
    const persontemplate = req.controllerData.persontemplate;
    const additional_formelements = [];
    const additionalRenderFormElements = {};
    if (persontemplate && persontemplate.template) {
      const { template, } = persontemplate;
      Object.keys(template).forEach((name, idx) => {
        const { value_type, } = template[ name ];
        const formElement = los_transform_util._createMaskedFormElement({ value_type, name, });
        additional_formelements.push(formElement);
        additionalRenderFormElements[ `key_information.${name}.value` ] = 'func:window.provideAdditionalDependencyFilter';
      });
    }
    const _children = [
      {
        component: 'ResponsiveFormContainer',
        asyncprops: {
          __formOptions: [ 'modaldata', 'formoptions', ],
        },
        props: {
          formgroups: [
            {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'name',
                label: 'Name',
                leftIcon: 'fas fa-user',
                errorIconRight: true,
                validateOnBlur: true,
                onBlur: true,
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
                className: '__dynamic_form_elements',
                style: {
                  textAlign: 'right',
                },
              },
              formElements: [ {
                type: 'Semantic.checkbox',
                name: 'additional',
                label: 'Add detailed customer information',
                passProps: {
                  className: 'reverse-label',
                },
                layoutProps: {
                  style: {
                    textAlign: 'right',
                    display: 'inline-block',
                    verticalAlign: 'top',
                  },
                },
              }, ],
            },
            {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'submit',
                value: 'ADD PERSON',
                passProps: {
                  color: 'isPrimary',
                },
                layoutProps: {},
              },
              ],
            }, ],
          validations: {
            name: {
              'name': 'name',
              'constraints': {
                'name': {
                  'presence': {
                    'message': '^Name is required.',
                  },
                },
              },
            },
          },
          renderFormElements: Object.assign({
            'additional': 'func:window.provideAdditionalPersonFilter',
            'company': 'func:window.provideAdditionalDependencyFilter',
            'email': 'func:window.provideAdditionalDependencyFilter',
            'phone': 'func:window.provideAdditionalDependencyFilter',
            'job_title': 'func:window.provideAdditionalDependencyFilter',
            'address': 'func:window.provideAdditionalDependencyFilter',
            'dob': 'func:window.provideAdditionalDependencyFilter',
            'ssn': 'func:window.provideAdditionalDependencyFilter',
          }, additionalRenderFormElements),
          additionalFormElements: additional_formelements,
          form: {
            setInitialValues: false,
            flattenFormData: true,
            footergroups: false,
            useFormOptions: true,
            hiddenFields: [ {
              form_name: 'customer_type',
              form_static_val: 'people',
            }, ],
            'onSubmit': {
              url: '/los/api/customers?redirect=true&redirectEntity=people',
              options: {
                method: 'POST',
              },
              successCallback: 'func:window.closeModalAndCreateNotification',
              successProps: {
                text: 'Changes saved successfully!',
                timeout: 10000,
                type: 'success',
              },
              responseCallback: 'func:this.props.reduxRouter.push',
            },
          },
        },
      }, ];
    req.controllerData._children = _children;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatNewCompanyModal(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.formoptions = req.controllerData.formoptions || {};
    const companytemplate = req.controllerData.companytemplate;
    const additional_formelements = [];
    const additionalRenderFormElements = {};
    if (companytemplate && companytemplate.template) {
      const { template, } = companytemplate;
      Object.keys(template).forEach((name, idx) => {
        const { value_type, } = template[ name ];
        const formElement = los_transform_util._createMaskedFormElement({ value_type, name, });
        additional_formelements.push(formElement);
        additionalRenderFormElements[ `key_information.${name}.value` ] = 'func:window.provideAdditionalDependencyFilter';
      });
    }
    additional_formelements.push({
      name: 'description',
      type: 'textarea',
      customLabel: {
        component: 'span',
        children: [ {
          component: 'span',
          children: 'Company Description',
        }, {
          component: 'span',
          children: 'Optional',
          props: {
            style: {
              fontStyle: 'italic',
              marginLeft: '2px',
              fontWeight: 'normal',
              color: '#969696',
            },
          },
        }, ],
      },
    });

    const peopleDropdown = (req.controllerData.formoptions.person) ? req.controllerData.formoptions.person : [];
    req.controllerData.formoptions.primary_contact = peopleDropdown;
    delete req.controllerData.formoptions.person;
    const responseCallback = (req.query && req.query.modalType === 'addCompanyToPerson') ? 'func:this.props.refresh' : 'func:this.props.reduxRouter.push';
    const onSubmitUrl = (req.query && req.query.modalType === 'addCompanyToPerson') ? '/los/api/customers?type=addCompanyToPerson' : '/los/api/customers?redirect=true&redirectEntity=companies';
    const _children = [
      {
        component: 'ResponsiveFormContainer',
        asyncprops: {
          __formOptions: [ 'modaldata', 'formoptions', ],
        },
        props: {
          formgroups: [
            {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'name',
                label: 'Company Name',
                leftIcon: 'fas fa-building',
                errorIconRight: true,
                validateOnBlur: true,
                onBlur: true,
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
                className: '__dynamic_form_elements',
              },
              formElements: [ {
                type: 'Semantic.checkbox',
                name: 'additional',
                label: 'Add detailed customer information',
                passProps: {
                  className: 'reverse-label',
                },
                layoutProps: {
                  style: {
                    textAlign: 'right',
                    display: 'inline-block',
                    verticalAlign: 'top',
                  },
                },
              }, ],
            },
            {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'submit',
                value: 'CREATE COMPANY',
                passProps: {
                  color: 'isPrimary',
                },
                layoutProps: {},
              },
              ],
            }, ],
          validations: {
            name: {
              'name': 'name',
              'constraints': {
                'name': {
                  'presence': {
                    'message': '^Company Name is required.',
                  },
                },
              },
            },
          },
          renderFormElements: Object.assign({
            'additional': 'func:window.provideAdditionalCompanyFilter',
            'industry': 'func:window.provideAdditionalDependencyFilter',
            'company_type': 'func:window.provideAdditionalDependencyFilter',
            'primary_contact': 'func:window.provideAdditionalDependencyFilter',
            'address': 'func:window.provideAdditionalDependencyFilter',
            'website': 'func:window.provideAdditionalDependencyFilter',
            'ein': 'func:window.provideAdditionalDependencyFilter',
            'description': 'func:window.provideAdditionalDependencyFilter',
          }, additionalRenderFormElements),
          additionalFormElements: additional_formelements,
          form: {
            setInitialValues: false,
            flattenFormData: true,
            footergroups: false,
            useFormOptions: true,
            hiddenFields: [ {
              form_name: 'customer_type',
              form_static_val: 'company',
            }, ],
            'onSubmit': {
              url: onSubmitUrl,
              options: {
                method: 'POST',
              },
              successCallback: 'func:window.closeModalAndCreateNotification',
              successProps: {
                text: 'Changes saved successfully!',
                timeout: 10000,
                type: 'success',
              },
              responseCallback,
            },
          },
        },
      }, ];
    req.controllerData._children = _children;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}


async function formatNewIntermediaryModal(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.formoptions = req.controllerData.formoptions || {};
    const intermediarytemplate = req.controllerData.intermediarytemplate;
    const additional_formelements = [];
    const additionalRenderFormElements = {};
    if (intermediarytemplate && intermediarytemplate.template) {
      const { template, } = intermediarytemplate;
      Object.keys(template).forEach((name, idx) => {
        const { value_type, } = template[ name ];
        const formElement = los_transform_util._createMaskedFormElement({ value_type, name, });
        additional_formelements.push(formElement);
        additionalRenderFormElements[ `key_information.${name}.value` ] = 'func:window.provideAdditionalDependencyFilter';
      });
    }
    additional_formelements.push({
      name: 'description',
      type: 'textarea',
      customLabel: {
        component: 'span',
        children: [ {
          component: 'span',
          children: 'Intermediary Description',
        }, {
          component: 'span',
          children: 'Optional',
          props: {
            style: {
              fontStyle: 'italic',
              marginLeft: '2px',
              fontWeight: 'normal',
              color: '#969696',
            },
          },
        }, ],
      },
    });

    const peopleDropdown = (req.controllerData.formoptions.person) ? req.controllerData.formoptions.person : [];
    req.controllerData.formoptions.primary_contact = peopleDropdown;
    delete req.controllerData.formoptions.person;
    // const responseCallback = (req.query && req.query.modalType === 'addCompanyToPerson') ? 'func:this.props.refresh' : 'func:this.props.reduxRouter.push';
    // const onSubmitUrl = (req.query && req.query.modalType === 'addCompanyToPerson') ? '/los/api/customers?type=addCompanyToPerson': '/los/api/customers?redirect=true&redirectEntity=companies';
    const _children = [
      {
        component: 'ResponsiveFormContainer',
        asyncprops: {
          __formOptions: [ 'modaldata', 'formoptions', ],
        },
        props: {
          formgroups: [
            {
              gridProps: {
                key: randomKey(),
              },
              formElements: [ {
                name: 'name',
                leftIcon: 'fas fa-seedling',
                label: 'Intermediary Name',
                errorIconRight: true,
                validateOnBlur: true,
                onBlur: true,
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
                className: '__dynamic_form_elements',
              },
              formElements: [ {
                type: 'Semantic.checkbox',
                name: 'additional',
                passProps: {
                  className: 'reverse-label',
                },
                label: 'Add detailed intermediary information',
                layoutProps: {
                  style: {
                    textAlign: 'right',
                    display: 'inline-block',
                    verticalAlign: 'top',
                  },
                },
              }, ],
            },
            {
              gridProps: {
                key: randomKey(),
                className: 'modal-footer-btns',
              },
              formElements: [ {
                type: 'submit',
                value: 'CREATE INTERMEDIARY',
                passProps: {
                  color: 'isPrimary',
                },
                layoutProps: {},
              },
              ],
            }, ],
          validations: {
            name: {
              'name': 'name',
              'constraints': {
                'name': {
                  'presence': {
                    'message': '^Intermediary Name is required.',
                  },
                },
              },
            },
          },
          renderFormElements: Object.assign({
            'additional': 'func:window.provideAdditionalIntermediaryFilter',
            'type': 'func:window.provideAdditionalDependencyFilter',
            'guid': 'func:window.provideAdditionalDependencyFilter',
            'primary_contact': 'func:window.provideAdditionalDependencyFilter',
            'address': 'func:window.provideAdditionalDependencyFilter',
            'website': 'func:window.provideAdditionalDependencyFilter',
            'ein': 'func:window.provideAdditionalDependencyFilter',
            'description': 'func:window.provideAdditionalDependencyFilter',
          }, additionalRenderFormElements),
          additionalFormElements: additional_formelements,
          form: {
            setInitialValues: false,
            flattenFormData: true,
            footergroups: false,
            useFormOptions: true,
            hiddenFields: [],
            'onSubmit': {
              url: '/los/api/intermediaries?redirect=true&type=addIntermediaryToPerson',
              options: {
                method: 'POST',
              },
              successCallback: 'func:window.closeModalAndCreateNotification',
              successProps: {
                text: 'Changes saved successfully!',
                timeout: 10000,
                type: 'success',
              },
              responseCallback: 'func:this.props.reduxRouter.push',
            },
          },
        },
      }, ];
    req.controllerData._children = _children;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatIntermediaryIndexTable(req) {
  try {
    const INTERMEDIARY_TYPE = CONSTANTS.LOS.INTERMEDIARY_TYPE;
    req.controllerData.rows = req.controllerData.rows.map(row => {
      const primary_contact = row.primary_contact;
      const createdat = `${transformhelpers.formatDateNoTime(row.createdat, req.user.time_zone)}`;
      const updatedat = `${transformhelpers.formatDateNoTime(row.updatedat, req.user.time_zone)}`;
      return Object.assign({}, row, {
        type: INTERMEDIARY_TYPE[ row.type ],
        primary_contact_name: primary_contact ? primary_contact.name : '',
        primary_contact_phone: primary_contact ? transformhelpers.formatPhoneNumber(primary_contact.phone) : '',
        primary_contact_email: primary_contact ? primary_contact.email : '',
        createdat,
        updatedat,
        _id: row._id,
      });
    });
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatIntermediaryDetail(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData && req.controllerData.intermediary) {
      const intermediary = req.controllerData.intermediary;
      const Person = periodic.datas.get('standard_losperson');
      const user = req.user || {};
      const organization = (user && user.association && user.association.organization && user.association.organization._id) ? user.association.organization._id.toString() : 'organization';
      let intermediary_people = await Person.model.find({ intermediary: intermediary._id.toString(), organization, });
      intermediary_people = intermediary_people.map(person => person.toJSON ? person.toJSON() : person);
      let createdat = `${transformhelpers.formatDateNoTime(intermediary.createdat, req.user.time_zone)}`;
      let updatedat = `${transformhelpers.formatDateNoTime(intermediary.updatedat, req.user.time_zone)}`;
      if (intermediary.user && intermediary.user.creator) createdat += ` by ${intermediary.user.creator}`;
      if (intermediary.user && intermediary.user.updater) updatedat += ` by ${intermediary.user.updater}`;
      const key_information = (intermediary.key_information) ? Object.keys(intermediary.key_information).map((name, idx) => {
        const detail = intermediary.key_information[ name ];
        let value;
        if (detail.value === undefined || detail.value === null) value = '';
        else value = los_transform_util.formatByValueType({ value: detail.value, value_type: detail.value_type, });
        return { name, value, idx, _id: intermediary._id.toString(), value_type: detail.value_type, };
      }) : [];

      if (intermediary.primary_contact) {
        const primary_contact = intermediary_people.find(person => person._id.toString() === intermediary.primary_contact.toString());
        req.controllerData.intermediary = Object.assign({}, intermediary, {
          primary_contact: primary_contact ? primary_contact._id.toString() : '',
          primary_contact_phone: primary_contact ? transformhelpers.formatPhoneNumber(primary_contact.phone) : '',
          primary_contact_email: primary_contact ? primary_contact.email : '',
          createdat, updatedat, key_information,
        });
      } else {
        req.controllerData.intermediary = Object.assign({}, intermediary, { createdat, updatedat, key_information, });
      }

      req.controllerData.formoptions = req.controllerData.formoptions || {};

      if (intermediary_people && intermediary_people.length) {
        const primaryContactDropdown = intermediary_people.map(person => ({
          label: person.name,
          value: person._id.toString(),
        }));
        req.controllerData.formoptions.primary_contact = primaryContactDropdown;
      }
      // if (intermediary.intermediary_applications && intermediary.intermediary_applications.rows.length) {
      //   intermediary.intermediary_applications.rows = intermediary.intermediary_applications.rows.map(application => ({
      //     _id: application._id,
      //     loan_amount: application.loan_amount ? numeral(application.loan_amount).format('$0,0') : '',
      //     createdat: transformhelpers.formatDateNoTime(application.createdat, req.user.time_zone),
      //     product: application.product ? application.product.name : '',
      //     status: application.status.name,
      //   }));
      // }
      req.controllerData.data = {
        display_title: intermediary.name || '',
      };
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}


async function formatIntermediaryAttributeDetail(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData.intermediary) {
      const intermediary = req.controllerData.intermediary;
      req.controllerData.data = req.controllerData.data || {};
      const key_information = Object.entries(intermediary.key_information).map(([ name, detail, ], idx) => ({ name, value: los_transform_util.formatByValueType({ value: detail.value, value_type: detail.value_type, }), idx, _id: intermediary._id.toString(), value_type: detail.value_type, }));
      req.controllerData.data = Object.assign({}, req.controllerData.data, key_information[ req.params.idx ]);
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatIntermediaryApplicationSwimlane(req) {
  try {
    req.controllerData = req.controllerData || {};
    const intermediary = req.controllerData.intermediary;
    const applications = req.controllerData.applications || [];
    const los_statuses = req.controllerData.los_statuses || [];
    const userImageMap = req.controllerData.userImageMap || {};
    const droppableList = los_statuses.map(losStatusObj => ({
      cardProps: cardprops({
        cardProps: {
          className: 'orange-card-gradient swim-lane-card',
        },
        cardTitle: {
          component: 'ResponsiveButton',
          props: {
            onClick: 'func:this.props.createModal',
            onclickProps: {
              title: 'Edit Status',
              pathname: `/los/statuses/${losStatusObj._id.toString()}`,
            },
          },
          children: losStatusObj.name,
        },
        headerTitleStyle: {
          fontSize: '16px',
        },
        cardStyle: {
          margin: 0,
          boxShadow: '0 2px 3px rgba(17,17,17,.1), 0 0 0 1px rgba(17,17,17,.1)',
          borderRadius: 0,
        },
      }),
      headerInfoProps: {
        style: {
          fontSize: '1rem',
          fontWeight: 400,
          marginTop: '5px',
        },
      },
      items: applications.reduce((validApps, application, idx) => {
        if (application.status.toString() === losStatusObj._id.toString()) {
          validApps.push({
            id: application._id.toString(),
            itemName: application.title,
            teamMemberCount: (application.team_members && application.team_members.length) ? application.team_members.length : 0,
            image: (application.team_members && application.team_members.length && userImageMap[ application.team_members[ 0 ].toString() ]) ? userImageMap[ application.team_members[ 0 ].toString() ] : REACTAPPSETTINGS.default_user_image,
            amountNum: application.loan_amount ? parseFloat(numeral(application.loan_amount)._value) : 0,
            amount: application.loan_amount ? numeral(application.loan_amount).format('$0,0') : '',
            date: transformhelpers.formatDateNoTime(application.createdat),
            footer: (application.labels && application.labels.length) ? {
              component: 'div',
              props: {
                style: {
                  marginBottom: '-2px',
                },
              },
              children: [ {
                component: 'div',
                props: {
                  style: {
                    borderTop: '1px solid #ccc',
                    width: 'calc(100% + 14px)',
                    margin: '5px 0 3px -7px',
                  },
                },
              }, ].concat(application.labels.map(label => {
                return {
                  component: 'span',
                  children: label.name,
                  props: {
                    style: {
                      display: 'inline-block',
                      margin: '2px 2px 2px 0',
                      fontWeight: 'bold',
                      borderRadius: '5px',
                      color: los_transform_util._pickContrastingFontColor(label.color),
                      padding: '3px 7px',
                      fontSize: '11px',
                      boxShadow: 'rgba(17, 17, 17, 0.1) 0px 1px 2px, rgba(17, 17, 17, 0.1) 0px 0px 0px 1px',
                      backgroundColor: label.color,
                    },
                  },
                };
              })),
            } : null,
          });
        }
        return validApps;
      }, []),
    }));
    req.controllerData.droppableList = droppableList;

    req.controllerData._children = [
      losTabs('Intermediaries'),
      buttonAsyncHeaderTitle({
        type: 'intermediary',
        title: true,
      }, {
          component: 'ResponsiveButton',
          props: {
            onclickProps: {
              title: 'Edit Name',
              pathname: '/los/intermediaries/:id/rename',
              params: [ {
                key: ':id',
                val: '_id',
              }, ],
            },
            onClick: 'func:this.props.createModal',
            spanProps: {
              className: '__ra_rb button_page_title',
            },
          },
          asyncprops: {
            onclickPropObject: [ 'intermediarydata', 'intermediary', ],
            children: [ 'intermediarydata', 'data', 'display_title', ],
          },
        }),
      // simpleAsyncHeaderTitle({ type: 'intermediary' }),
      {
        component: 'div',
        props: {
          style: {
            margin: '10px 0px 0rem',
          },
        },
      },
      intermediaryTabs('applications_dashboard'),
      plainGlobalButtonBar({
        left: [ {
          component: 'Semantic.Dropdown',
          asyncprops: {
            privilege_id: [ 'checkdata', 'permissionCode', ],
          },
          comparisonorprops: true,
          comparisonprops: [ {
            left: [ 'privilege_id', ],
            operation: 'eq',
            right: 101,
          }, {
            left: [ 'privilege_id', ],
            operation: 'eq',
            right: 102,
          }, {
            left: [ 'privilege_id', ],
            operation: 'eq',
            right: 103,
          } ],
          props: {
            className: '__re-bulma_button __re-bulma_is-success',
            text: 'CREATE APPLICATION',
          },
          children: [ {
            component: 'Semantic.DropdownMenu',
            children: [ {
              component: 'Semantic.Item',
              children: [ {
                component: 'ResponsiveButton',
                children: 'NEW CUSTOMER',
                asyncprops: {
                  buttondata: [ 'strategydata', 'data', ],
                },
                props: {
                  onclickThisProp: [ 'buttondata', ],
                  onClick: 'func:this.props.createModal',
                  onclickProps: {
                    pathname: '/los/applications/new/new_customer',
                    title: 'Create Application (New Customer)',
                  },
                },
              }, ],
            }, {
              component: 'Semantic.Item',
              children: [ {
                component: 'ResponsiveButton',
                children: 'EXISTING CUSTOMER',
                asyncprops: {
                  buttondata: [ 'strategydata', 'data', ],
                },
                props: {
                  onclickThisProp: [ 'buttondata', ],
                  onclickProps: {
                    title: 'Create Application (Existing Customer)',
                    pathname: '/los/applications/new/existing_customer',
                  },
                  onClick: 'func:this.props.createModal',
                },
              }, ],
            }, ],
          }, ],
        }, ],
        right: [ {
          component: 'div',
          children: [ {
            component: 'Link',
            props: {
              to: `/los/intermediaries/${intermediary._id.toString()}/applications_dashboard`,
              className: '__re-bulma_button __icon_button __icon-large active',
              style: {
                margin: 0,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              },
            },
            children: [ {
              component: 'Icon',
              props: {
                icon: 'fa fa-th-large',
              },
            }, ],
          }, {
            component: 'Link',
            props: {
              to: `/los/intermediaries/${intermediary._id.toString()}/applications`,
              className: '__re-bulma_button __icon_button __icon-large',
              style: {
                margin: 0,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
              },
            },
            children: [ {
              component: 'Icon',
              props: {
                icon: 'fa fa-list-ul',
                // size: 'large',
              },
            }, ],
          }, ],
        },
          // {
          //   component: 'ResponsiveButton',
          //   props: {
          //     onClick: 'func:this.props.createModal',
          //     onclickProps: {
          //       title: 'Machine Learning - Tutorial',
          //       pathname: '/ml/tutorial',
          //     },
          //     buttonProps: {
          //       color: 'isPrimary',
          //     },
          //   },
          //   children: 'DOWNLOAD',
          // }, 
        ],
      }), {
        component: 'Container',
        props: {},
        children: [ {
          component: 'SwimLane',
          props: {
            contextProps: {
              style: {},
            },
            fetchOptions: {
              // url: '/los/api/applications/:id?type=swimlane',
              url: `/los/api/intermediaries/${intermediary._id.toString()}/applications/swimlane?populate=labels`,
              params: [ {
                key: ':id',
                val: '_id',
              }, ],
              options: {
                headers: {
                  'Content-Type': 'application/json',
                },
                method: 'PUT',
                timeout: 500000,
              },
            },
            searchOptions: {
              url: `/los/api/intermediaries/${intermediary._id.toString()}/applications/swimlane?populate=labels`,
              options: {
                headers: {
                  'Content-Type': 'application/json',
                },
                method: 'GET',
                timeout: 500000,
              },
              searchProps: {
                className: 'global-table-search',
                placeholder: 'SEARCH APPLICATIONS',
                hasIconRight: false,
              },
            },
            filterOptions: {
              labelProps: {},
              dropdownProps: {
                className: 'global-table-search',
                selection: true,
                multiple: true,
                fluid: true,
                search: true,
                placeholder: 'FILTER TEAM MEMBERS',
                options: req.controllerData.team_members.map(team_member => ({
                  value: team_member._id.toString(),
                  text: `${team_member.first_name} ${team_member.last_name}`,
                  image: {
                    avatar: true,
                    spaced: 'right',
                    src: team_member.primaryasset && team_member.primaryasset.fileurl ? team_member.primaryasset.fileurl : REACTAPPSETTINGS.default_user_image,
                  },
                })),
              },
            },
            droppableListProps: {
              style: {
                dragBackground: '#ecf4f7',
                borderRadius: '3px',
                padding: '0.5rem 0 1rem',
                margin: '0',
                minHeight: '100px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              },
            },
            draggableProps: {
              style: {
                dragBackground: '#fbfbfb',
                nonDragBackground: '#f2f2f2',
                borderRadius: '3px',
                padding: '5px 7px',
                margin: '0px 0px 6px',
                boxShadow: '0 2px 3px rgba(17, 17, 17, 0.1), 0 0 0 1px rgba(17, 17, 17, 0.1)',
              },
            },
            itemProps: {
              style: {
                marginTop: '2px',
                color: '#969696',
                fontSize: '13px',
              },
            },
            itemTitleProps: {
              buttonProps: {
                onclickBaseUrl: '/los/applications/:id',
                onclickLinkParams: [ { key: ':id', val: 'id', }, ],
                onClick: 'func:this.props.reduxRouter.push',
              },
              style: {
                fontWeight: '700',
                fontSize: '14px',
                padding: '0px',
              },
            },
            droppableList,
          },
        }, ],
      }, ];

    delete req.controllerData.team_members;
    delete req.controllerData.los_statuses;
    delete req.controllerData.userImageMap;
    delete req.controllerData.applications;
    return req;
  } catch (e) {
    req.error = e;
    return req;
  }
}


async function formatIntermediaryApplicationTablePage(req) {
  try {
    req.controllerData = req.controllerData || {};
    const intermediary = req.controllerData.intermediary;
    const applications = req.controllerData.applications || [];

    req.controllerData._children = [
      losTabs('Intermediaries'),
      simpleAsyncHeaderTitle({ type: 'intermediary', }),
      {
        component: 'div',
        props: {
          style: {
            margin: '10px 0px 0px',
          },
        },
      },
      intermediaryTabs('applications_dashboard'),
      plainGlobalButtonBar({
        left: [ {
          component: 'Semantic.Dropdown',
          asyncprops: {
            privilege_id: [ 'checkdata', 'permissionCode', ],
          },
          comparisonorprops: true,
          comparisonprops: [ {
            left: [ 'privilege_id', ],
            operation: 'eq',
            right: 101,
          }, {
            left: [ 'privilege_id', ],
            operation: 'eq',
            right: 102,
          }, {
            left: [ 'privilege_id', ],
            operation: 'eq',
            right: 103,
          } ],
          props: {
            className: '__re-bulma_button __re-bulma_is-success',
            text: 'CREATE APPLICATION',
          },
          children: [ {
            component: 'Semantic.DropdownMenu',
            children: [ {
              component: 'Semantic.Item',
              children: [ {
                component: 'ResponsiveButton',
                children: 'NEW CUSTOMER',
                asyncprops: {
                  buttondata: [ 'strategydata', 'data', ],
                },
                props: {
                  onclickThisProp: [ 'buttondata', ],
                  onClick: 'func:this.props.createModal',
                  onclickProps: {
                    pathname: '/los/applications/new/new_customer',
                    title: 'Create Application (New Customer)',
                  },
                },
              }, ],
            }, {
              component: 'Semantic.Item',
              children: [ {
                component: 'ResponsiveButton',
                children: 'EXISTING CUSTOMER',
                asyncprops: {
                  buttondata: [ 'strategydata', 'data', ],
                },
                props: {
                  onclickThisProp: [ 'buttondata', ],
                  onclickProps: {
                    title: 'Create Application (Existing Customer)',
                    pathname: '/los/applications/new/existing_customer',
                  },
                  onClick: 'func:this.props.createModal',
                },
              }, ],
            }, ],
          }, ],
        },
        ],
        right: [ {
          component: 'div',
          children: [ {
            component: 'Link',
            props: {
              to: `/los/intermediaries/${req.params.id}/applications_dashboard`,
              className: '__re-bulma_button __icon_button __icon-large',
              style: {
                margin: 0,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              },
            },
            children: [ {
              component: 'Icon',
              props: {
                icon: 'fa fa-th-large',
              },
            }, ],
          }, {
            component: 'Link',
            props: {
              to: `/los/intermediaries/${req.params.id}/applications`,
              className: '__re-bulma_button __icon_button __icon-large active',
              style: {
                margin: 0,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
              },
            },
            children: [ {
              component: 'Icon',
              props: {
                icon: 'fa fa-list-ul',
                // size: 'large',
              },
            }, ],
          }, ],
        },
        ],
      }),
      {
        component: 'Container',
        props: {
          style: {},
        },
        children: [ {
          component: 'ResponsiveCard',
          props: cardprops({
            headerStyle: {
              display: 'none',
            },
          }),
          children: [ {
            component: 'ResponsiveTable',
            props: {
              filterSearch: true,
              simplePagination: true,
              useHeaderFilters: true,
              flattenRowData: true,
              limit: 50,
              dataMap: [ {
                'key': 'rows',
                value: 'rows',
              }, {
                'key': 'numItems',
                value: 'numItems',
              }, {
                'key': 'numPages',
                value: 'numPages',
              }, ],
              calculatePagination: true,
              hasPagination: true,
              baseUrl: `/los/api/intermediaries/${req.params.id}/applications?paginate=true`,
              'tableSearch': true,
              'simpleSearchFilter': true,
              filterSearchProps: {
                icon: 'fa fa-search',
                hasIconRight: false,
                className: 'global-table-search',
                placeholder: 'SEARCH APPLICATIONS',
              },
              headers: [
                {
                  label: 'Title',
                  headerColumnProps: {
                    style: {
                      width: '30%',
                    },
                  },
                  sortid: 'title',
                  sortable: true,
                },
                {
                  label: 'Status',
                  sortid: 'status',
                  sortable: false,
                },
                {
                  label: 'Team Members',
                  sortid: 'team_members',
                  sortable: false,
                },
                {
                  label: 'Loan Amount',
                  sortid: 'loan_amount',
                  sortable: false,
                }, {
                  label: 'Created',
                  sortid: 'createdat',
                  sortable: false,
                }, {
                  label: 'Updated',
                  sortid: 'updatedat',
                  sortable: false,
                }, {
                  label: ' ',
                  headerColumnProps: {
                    style: {
                      width: '80px',
                    },
                  },
                  columnProps: {
                    style: {
                      whiteSpace: 'nowrap',
                    },
                  },
                  buttons: [ {
                    passProps: {
                      buttonProps: {
                        icon: 'fa fa-pencil',
                        className: '__icon_button',
                      },
                      onClick: 'func:this.props.reduxRouter.push',
                      onclickBaseUrl: '/los/applications/:id',
                      onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                    },
                  }, {
                    passProps: {
                      buttonProps: {
                        icon: 'fa fa-trash',
                        color: 'isDanger',
                        className: '__icon_button',
                      },
                      onClick: 'func:this.props.fetchAction',
                      onclickBaseUrl: '/los/api/applications/:id',
                      onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                      fetchProps: {
                        method: 'DELETE',
                      },
                      successProps: {
                        success: {
                          notification: {
                            text: 'Changes saved successfully!',
                            timeout: 10000,
                            type: 'success',
                          },
                        },
                        successCallback: 'func:this.props.refresh',
                      },
                      confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
                        title: 'Delete Application',
                        textContent: [ {
                          component: 'p',
                          children: 'Do you want to permanently delete this Application?',
                          props: {
                            style: {
                              textAlign: 'left',
                              marginBottom: '1.5rem',
                            },
                          },
                        }, ],
                      }),
                    },
                  }, ],
                }, ],
              headerLinkProps: {
                style: {
                  textDecoration: 'none',
                },
              },
            },
            asyncprops: {
              rows: [ 'applicationdata', 'rows', ],
              numItems: [ 'applicationdata', 'numItems', ],
              numPages: [ 'applicationdata', 'numPages', ],
              filterButtons: [ 'applicationdata', 'filterButtons', ],
            },
          }, ],
        }, ],
      }, ];

    delete req.controllerData.team_members;
    delete req.controllerData.los_statuses;
    delete req.controllerData.userImageMap;
    delete req.controllerData.applications;
    return req;
  } catch (e) {
    req.error = e;
    return req;
  }
}

async function formatDocuSignTemplates(req) {
  try {
    req.controllerData = req.controllerData || {};
    if (req.controllerData && req.controllerData.docusign_templates) {
      req.controllerData.formoptions = {
        docusign_template: req.controllerData.docusign_templates.map(temp => ({ label: temp.name, value: temp.templateId })),
      };
      req.controllerData._children = [{
        component: 'ResponsiveForm',
        asyncprops: {
          __formOptions: [ 'docdata', 'formoptions' ],
        },
        props: {
          flattenFormData: true,
          footergroups: false,
          setInitialValues: false,
          useFormOptions: true,
          'onSubmit': {
            url: '/los/api/docs/docusign/get_template_modal',
            options: {
              method: 'POST',
            },
            successCallback: 'func:this.props.createNotification',
            successProps: {
              text: 'Changes saved successfully!',
              timeout: 10000,
              type: 'success',
            },
            responseCallback: 'func:window.closeModalAndCreateNewModal',
          },
          validations: [],
          formgroups: [ {
            gridProps: {
              key: randomKey(),
            },
            formElements: [  {
              name: 'docusign_template',
              label: 'Select Template',
              type: 'dropdown',
              validateOnChange: true,
              errorIconRight: true,
              passProps: {
                selection: true,
                fluid: true,
                search: true,
                selectOnBlur: false,
              },
            },],
          }, {
            gridProps: {
              key: randomKey(),
              className: 'modal-footer-btns',
            },
            formElements: [ {
              type: 'submit',
              value: 'CONTINUE',
              passProps: {
                color: 'isPrimary',
              },
              layoutProps: {},
            },
            ],
          },
          ],
        },
      }];
    } else {
      req.controllerData._children = [{
        component: 'p',
        children: 'Please set up your DocuSign integration within Company Settings. If you need assistance, please contact support@digifi.io or (646) 663-3392.',
      }, {
        component: 'div',
        props: {
          className: 'modal-footer-btns',
        },
        children: [{
          component: 'ResponsiveButton',
          props: {
            buttonProps: {
              color: 'isPrimary',
            },
            onClick: 'func:this.props.hideModal',
            onclickProps: 'last',
          },
          children: 'Close Window',
        }, ],
      }, ];
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatDocuSignTemplateDetail(req) {
  try {
    if (req.controllerData && req.controllerData.docusign_template) {
      const template = req.controllerData.docusign_template;
      let textTabs = [];
      if (template && template.recipients && template.recipients.signers) {
        template.recipients.signers.forEach(signer => {
          textTabs.push(signer.tabs.textTabs);
        });
      }
      const tabLabelSet = new Set();
      textTabs = textTabs.flat().filter((textTab) => {
        if (tabLabelSet.has(textTab.tabLabel)) return false;
        else {
          tabLabelSet.add(textTab.tabLabel);
          return true;
        }
      });

      const application = req.controllerData.application;
      const customer = req.controllerData.customer;
      const coapplicant = req.controllerData.coapplicant;
      const intermediary = req.controllerData.intermediary;
      const autoPopulationFieldMap = los_transform_util._generateAutoPopulationMap({ application, customer, coapplicant, intermediary, isFormatted: true, });
      let template_detail_form = los_transform_util._generateDocuSignTemplateDetailForm({ textTabs, templateId: req.params.id, docId: 'test', autoPopulationFieldMap });
      req.controllerData._children = [ template_detail_form ];
    }
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

async function formatTaskBotsIndexTable(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.controllerData.rows = req.controllerData.rows.map(taskbot => {
      const { name, description = '', updatedat, active, lastran = '', } = taskbot;
      return {
        name,
        description,
        updatedat: transformhelpers.formatDateNoTime(updatedat, req.user.time_zone),
        active: active ? 'Active' : 'Disabled',
        lastran: lastran ? transformhelpers.formatDate(lastran, req.user.time_zone) : lastran,
      };
    });
    delete req.controllerData.taskbots;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

module.exports = {
  setCompanyDisplayTitle,
  setPersonDisplayTitle,
  formatCreateApplication,
  formatCreateTask,
  formatTaskForm,
  formatApplicationDetail,
  formatApplicationLoanInformation,
  formatApplicationsIndexTable,
  formatCompanyPeoplesIndexTable,
  formatPersonDetail,
  formatPersonAttributeDetail,
  formatPersonTasksIndexTable,
  formatCompanyDetail,
  formatCompanyAttributeDetail,
  formatCustomersIndexTable,
  formatCompanyTasksIndexTable,
  formatPersonDataForUpdate,
  formatDropdowns,
  filterEditFileDropdown,
  prefillDropdowns,
  // formatPeopleIndexTable,
  formatNewApplicationFormData,
  formatApplicationSwimlane,
  formatApplicationDataForUpdate,
  formatApplicationAttributeDetail,
  formatApplicationDocsIndexTable,
  formatDocumentDataForUpdate,
  formatTasksIndexTable,
  formatApplicationTasksIndexTable,
  formatProductsIndexTable,
  formatProductDetail,
  formatProductTemplateDetail,
  formatCustomerTemplateDetail,
  formatCustomerTemplateTables,
  formatTemplatesIndexTable,
  formatTemplateDetail,
  formatTemplateFieldDetail,
  formatCommunicationForm,
  formatCommunicationsIndexTable,
  formatApplicationCommunicationsIndexTable,
  formatCompanyCommunicationsIndexTable,
  formatPeopleCommunicationsIndexTable,
  formatNotesIndexTable,
  formatDocsIndexTable,
  formatUploadDocFormDropdown,
  formatDocumentDetail,
  formatSelectTemplateForm,
  formatTemplateFields,
  createGenerateDocumentForm,
  assignParentDirectory,
  formatApplicationCasesIndexTable,
  formatApplicationLabelsIndexTable,
  formatRunAutomatedDecisionForm,
  formatRunAutomatedMLForm,
  formatNewPersonModal,
  formatNewCompanyModal,
  formatNewIntermediaryModal,
  formatIntermediaryIndexTable,
  formatIntermediaryDetail,
  formatIntermediaryPeoplesIndexTable,
  formatIntermediaryAttributeDetail,
  formatIntermediaryApplicationSwimlane,
  formatIntermediaryApplicationTablePage,
  formatDocuSignTemplates,
  formatDocuSignTemplateDetail,
  formatTaskBotsIndexTable,
};
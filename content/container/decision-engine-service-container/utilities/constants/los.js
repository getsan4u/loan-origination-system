'use strict';

const TEMPLATE_APPLICATION_DEFAULT_DROPDOWN = [
  { label: 'Application | Title', value: 'application.title' },
  {
    label: 'Application | Createdat',
    value: 'application.createdat'
  },
  {
    label: 'Application | Updatedat',
    value: 'application.updatedat'
  },
  { label: 'Application | Status', value: 'application.status.name' },
  {
    label: 'Application | Team Members',
    value: 'application.team_members'
  },
  {
    label: 'Application | Estimated Close Date',
    value: 'application.estimated_close_date'
  },
  {
    label: 'Application | User | Creator',
    value: 'application.user.creator'
  },
  {
    label: 'Application | User | Updater',
    value: 'application.user.updater'
  },
  {
    label: 'Application | Product | Name',
    value: 'application.product.name'
  },
  {
    label: 'Application | Product | Description',
    value: 'application.product.description'
  },
  { label: 'Application | Reason', value: 'application.reason' },
  {
    label: 'Application | Comments',
    value: 'application.comments'
  } ];


const TEMPLATE_PERSON_DEFAULT_DROPDOWN = [
  { label: 'Customer | Name', value: 'customer.name' },
  { label: 'Customer | Job Title', value: 'customer.job_title' },
  { label: 'Customer | Phone', value: 'customer.phone' },
  { label: 'Customer | Email', value: 'customer.email' },
  { label: 'Customer | Address', value: 'customer.address' },
  { label: 'Customer | DOB', value: 'customer.dob' },
  { label: 'Customer | SSN', value: 'customer.ssn' }
];

const TEMPLATE_COMPANY_DEFAULT_DROPDOWN = [
  { label: 'Customer | Name', value: 'customer.name' },
  { label: 'Customer | Industry', value: 'customer.industry' },
  {
    label: 'Customer | Sub Industry',
    value: 'customer.subindustry'
  },
  { label: 'Customer | Website', value: 'customer.website' },
  { label: 'Customer | Address', value: 'customer.address' },
  { label: 'Customer | EIN', value: 'customer.ein' },
  { label: 'Customer | Legal Name', value: 'customer.legal_name' },
  {
    label: 'Customer | Company Type',
    value: 'customer.company_type'
  },
  {
    label: 'Customer | Description',
    value: 'customer.description'
  }
];

const DEFAULT_LOAN_PRODUCT_TYPES = [
  {
    name: 'Commercial Loan', customer_type: 'company',
    entitytype: 'losproduct',
    template: {
      'APR': { value_type: 'percentage', value: null },
      'Annual Interest Rate': { value_type: 'percentage', value: null },
      'Origination Fee Percent': { value_type: 'percentage', value: null },
      'Loan Term in Months': { value_type: 'number', value: null },
      'Amortization Period in Months': { value_type: 'number', value: null },
      'Monthly Payment': { value_type: 'number', value: null },
    },
    description: 'This is a simple template for commercial lending and may be edited or deleted.'
  },
  {
    name: 'Small Business Loan', customer_type: 'company',
    entitytype: 'losproduct',
    template: {
      'APR': { value_type: 'percentage', value: null },
      'Annual Interest Rate': { value_type: 'percentage', value: null },
      'Origination Fee Percent': { value_type: 'percentage', value: null },
      'Loan Term in Months': { value_type: 'number', value: null, },
      'Monthly Payment': { value_type: 'number', value: null },
    },
    description: 'This is a simple template for small business lending and may be edited or deleted.'
  },
  {
    name: 'Consumer Auto Loan', customer_type: 'person',
    entitytype: 'losproduct',
    template: {
      'APR': { value_type: 'percentage', value: null },
      'Annual Interest Rate': { value_type: 'percentage', value: null },
      'Origination Fee Percent': { value_type: 'percentage', value: null },
      'Loan Term in Months': { value_type: 'number', value: null },
      'Monthly Payment': { value_type: 'number', value: null },
    },
    description: 'This is a simple template for auto lending and may be edited or deleted.'
  },
  {
    name: 'Personal Loan', customer_type: 'person',
    entitytype: 'losproduct',
    template: {
      'APR': { value_type: 'percentage', value: null },
      'Annual Interest Rate': { value_type: 'percentage', value: null },
      'Origination Fee Percent': { value_type: 'percentage', value: null },
      'Loan Term in Months': { value_type: 'number', value: null },
      'Monthly Payment': { value_type: 'number', value: null },
    },
    description: 'This is a simple template for personal lending and may be edited or deleted.',
  },
  {
    name: 'Residential Mortgage', customer_type: 'person',
    entitytype: 'losproduct',
    template: {
      'Rate Type': { value_type: 'text', value: null },
      'Loan Term in Months': { value_type: 'number', value: null },
      'Origination Fee Percent': { value_type: 'percentage', value: null },
      'Monthly Payment': { value_type: 'number', value: null },
      'APR': { value_type: 'percentage', value: null },
      'Annual Interest Rate': { value_type: 'percentage', value: null },
    },
    description: 'This is a simple template for residential mortgage lending and may be edited or deleted.',
  },
];

const LOS_AUTO_POPULATION_FIELDS = {
  Title: { path: 'application.title' },
  Status: { path: 'application.status.name' },
  Product: { path: 'application.product.name' },
  'Loan Amount': { path: 'application.loan_amount', value_type: 'monetary', },
  'Estimated Close Date': { path: 'application.estimated_close_date', value_type: 'date', },
  'Reason': { path: 'application.reason', },
  'Comments': { path: 'application.comments', },
  'Decision Date': { path: 'application.decision_date', value_type: 'date', },
  'applicant.Industry': { path: 'customer.industry' },
  'applicant.Website': { path: 'customer.website' },
  'applicant.Description': { path: 'customer.description' },
  'applicant.Name': { path: 'customer.name' },
  'applicant.Job Title': { path: 'customer.job_title' },
  'applicant.Email Address': { path: 'customer.email' },
  'applicant.Phone Number': { path: 'customer.phone' },
  'applicant.Home Address': { path: 'customer.address' },
  'applicant.Date of Birth': { path: 'customer.dob', value_type: 'date', },
  'applicant.Social Security Number': { path: 'customer.ssn' },
  'applicant.Company Name': { path: 'customer.name' },
  'applicant.Legal Name': { path: 'customer.legal_name' },
  'applicant.Sub-Industry': { path: 'customer.subindustry' },
  'applicant.Entity Type': { path: 'customer.company_type' },
  'applicant.Employer Identification Number': { path: 'customer.ein' },
  'intermediary.Intermediary Type': { path: 'intermediary.type', },
  'intermediary.Name': { path: 'intermediary.name', },
  'intermediary.Website': { path: 'intermediary.website', },
  'intermediary.Address': { path: 'intermediary.address', },
  'intermediary.Employer Identification Number': { path: 'intermediary.ein', },
  'intermediary.Company Description': { path: 'intermediary.description', },
  'coapplicant.Industry': { path: 'coapplicant.industry' },
  'coapplicant.Website': { path: 'coapplicant.website' },
  'coapplicant.Description': { path: 'coapplicant.description' },
  'coapplicant.Name': { path: 'coapplicant.name' },
  'coapplicant.Job Title': { path: 'coapplicant.job_title' },
  'coapplicant.Email Address': { path: 'coapplicant.email' },
  'coapplicant.Phone Number': { path: 'coapplicant.phone' },
  'coapplicant.Home Address': { path: 'coapplicant.address' },
  'coapplicant.Date of Birth': { path: 'coapplicant.dob', value_type: 'date', },
  'coapplicant.Social Security Number': { path: 'coapplicant.ssn' },
  'coapplicant.Company Name': { path: 'coapplicant.name' },
  'coapplicant.Legal Name': { path: 'coapplicant.legal_name' },
  'coapplicant.Sub-Industry': { path: 'coapplicant.subindustry' },
  'coapplicant.Entity Type': { path: 'coapplicant.company_type' },
  'coapplicant.Employer Identification Number': { path: 'coapplicant.ein' },
};

const DEFAULT_CUSTOMER_TEMPLATES = {
  company: {
    'Annual Revenue': { value_type: 'monetary' },
    'Annual Net Profit': { value_type: 'monetary' },
    'Annual EBITDA': { value_type: 'monetary' },
    'Total Assets': { value_type: 'monetary' },
    'Total Equity': { value_type: 'monetary' },
    'Number of Employees': { value_type: 'number' },
    'Year Founded': { value_type: 'number' },
  },
  person: {
    'Annual Income': { value_type: 'monetary' },
    'Credit Score': { value_type: 'number' },
    'Employment Status': { value_type: 'text' },
    'Rent or Own Home': { value_type: 'text' },
  },
  intermediary: {
    'Broker Fee': { value_type: 'monetary' },
  },
}

const DEFAULT_APPLICATION_LABELS = [ {
  name: 'Auto Decision',
  color: '#00b050'
}, {
  name: 'Online Lead',
  color: '#189fdd'
}, {
  name: 'Phone Lead',
  color: '#f68114'
}, {
  name: 'Email Lead',
  color: '#2f5597'
}, {
  name: 'High Priority',
  color: '#ff6f72'
}, {
  name: 'Low Priority',
  color: '#ffa13b'
}, {
  name: 'Help Wanted',
  color: '#7030a0'
}, {
  name: 'Existing Customer',
  color: '#007aff'
} ]

const KEY_INFO_VALUE_TYPE_CAST = {
  monetary: 'number',
  percentage: 'number',
  number: 'number',
  text: 'text',
  date: 'date',
  boolean: 'boolean',
};

const INTERMEDIARY_TYPE = {
  affiliate: 'Affiliate',
  broker: 'Broker',
  dealer: 'Dealer',
  retailer: 'Retailer',
  other: 'Other',
};

module.exports = {
  TEMPLATE_DEFAULT_DROPDOWN: {
    application: TEMPLATE_APPLICATION_DEFAULT_DROPDOWN,
    person: TEMPLATE_PERSON_DEFAULT_DROPDOWN,
    company: TEMPLATE_COMPANY_DEFAULT_DROPDOWN,
  },
  DEFAULT_LOAN_PRODUCT_TYPES,
  DEFAULT_CUSTOMER_TEMPLATES,
  LOS_AUTO_POPULATION_FIELDS,
  DEFAULT_APPLICATION_LABELS,
  KEY_INFO_VALUE_TYPE_CAST,
  INTERMEDIARY_TYPE,
};
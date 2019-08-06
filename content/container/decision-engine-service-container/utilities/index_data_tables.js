'use strict';
const periodic = require('periodicjs');
let DSAOAuth2Client = false;
let dsaModels = {};

function getDSAOAuth2Client() {
  if (DSAOAuth2Client===false) {
    DSAOAuth2Client = periodic.settings.extensions['periodicjs.ext.passport'].oauth.oauth2client.filter(config => config.service_name === 'dsa')[0];    
  }
  return DSAOAuth2Client;  
}

function checkStatus(response) {
  return new Promise((resolve, reject) => {
    if (response.status >= 200 && response.status <= 403) {
      return resolve(response);
    } else {
      let error = new Error(response.statusText);
      error.response = response;
      try {
        // console.debug({response})
        response.json()
          .then(res => {
            if (res.data.error) {
              return reject(res.data.error);
            } else if (res.data) {
              return reject(JSON.stringify(res.data));
            } else {
              return reject(error);
            }
          })
          .catch(() => {
            return reject(error);
          });
      } catch (e) {
        return reject(error);
      }
    }
  });
}

function getDSASchemas() {
  return dsaModels;
}

function getDSAModels() {
  return new Promise((resolve, reject) => { 
    try {
      const DSAClient = DSAOAuth2Client || getDSAOAuth2Client();
      const dbModelsPath = DSAClient.service_url + '/status/models';
      fetch(dbModelsPath, {
        method: 'GET',
        headers: {
          authorization: 'Basic ' + new Buffer(DSAClient.client_token_id + ':' + DSAClient.client_secret).toString('base64'),
        },
      })
        .then(response=>checkStatus(response))
        .then(result => {
          return result.json();
        })  
        .then(dbModels => {
          dsaModels = dbModels.allSchemas;
          resolve(dsaModels);
        })
        .catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

function getDSAIndexTableFields() {
  const reactAppLocals = periodic.locals.extensions.get('@digifi-los/reactapp');
  const data_tables = reactAppLocals.manifest.table.data_tables;
  const adminRoute = '/developer/';
  return {
    sor_applicantdata: [
      data_tables.tableField({
        title: 'GUID',
        link: true,
        field: 'identification.guid',
      })({ adminRoute, schemaName: 'sor_applicantdata', }),
      data_tables.tableField({
        title: 'First name',
        field: 'contact.first_name',
      })({ adminRoute, schemaName: 'sor_applicantdata', }),
      data_tables.tableField({
        title: 'Last name',
        field: 'contact.last_name',
      })({ adminRoute, schemaName: 'sor_applicantdata', }),
      data_tables.tableOptions({ adminRoute, schemaName: 'sor_applicantdata', }),
    ]
  };
}

function setDSAIndexTables() {
  periodic.settings.extensions['periodicjs.ext.reactapp'].data_tables = Object.assign({},  periodic.settings.extensions['periodicjs.ext.reactapp'].data_tables, getDSAIndexTableFields());
}

module.exports = {
  DSAOAuth2Client,
  getDSAOAuth2Client,
  checkStatus,
  getDSAModels,
  getDSASchemas,
  dsaModels,
  getDSAIndexTableFields,
  setDSAIndexTables,
};
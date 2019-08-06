'use strict';

/** Transform functions for api */
const jsonToXML = require('convertjson2xml').singleton;
const moment = require('moment');

/**
 * If request was in xml, convert response to xml before sending it back.
 * @param {object} req express request object
 * @returns {promise} a promise that resolves a modified request object
 */
function convertToXML(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
        let xml = jsonToXML(req.controllerData.results);
        if (xml instanceof Error) {
          return reject(xml.message);
        } else {
          req.controllerData.results = xml;
        }
      }
      return resolve(req);
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Assigns example values to variables.
 * @param {object} req express request object
 * @returns {promise} a promise that resolves a modified request object
 */
async function populateUniqueVariables(req) {
  if (req.controllerData && req.controllerData.data_types) {
    let variables = req.controllerData.data_types;
    req.controllerData.populatedUniqueVar = Object.keys(variables).reduce((acc, curr) => {
      switch (variables[ curr ]) {
        case 'String':
          acc[ curr ] = 'string';
          break;
        case 'Number':
          acc[ curr ] = 0;
          break;
        case 'Boolean':
          acc[ curr ] = true;
          break;
        case 'Date':
          acc[ curr ] = moment(new Date()).format('MM/DD/YYYY');
          break;
        default:
          acc[ curr ] = 'string';
      }
      return acc;
    }, {});
  }
  return req;
}

/**
 * Reformat req.controllerData.inputVariables.
 * @param {object} req express request object
 * @returns {promise} a promise that resolves a modified request object
 */
async function reformatVariables(req) {
  if (req.controllerData && req.controllerData.compiledStrategy && req.controllerData.compiledStrategy.input_variables) {
    let uniqueVar = req.controllerData.compiledStrategy.input_variables.reduce((acc, curr) => {
      if (curr && curr.title) acc[ curr.title ] = curr.data_type;
      return acc;
    }, {});
    req.controllerData.data_types = uniqueVar;
    if (req.controllerData.variable) {
      req.controllerData.type = uniqueVar[ req.controllerData.variable ];
    }
  }
  return req;
}

/**
 * Send api request modal from backend.
 * @param {object} req express request object
 * @returns {promise} a promise that resolves a modified request object
 */
async function APIRequestModal(req) {
  req.controllerData = req.controllerData || {};
  req.controllerData.requestmodal = [ {
    component: 'ResponsiveForm',
    asyncprops: {
      clientdata: [ 'checkdata', 'org', 'association', 'client', ],
      hiddenFields: [ 'hiddendata', ],
    },
    hasWindowFunc: true,
    props: {
      onChange: 'func:window.switchRequestFormat',
      ref: 'func:window.addRef',
      validations: [
        {
          'name': 'product',
          'constraints': {
            'product': {
              'presence': {
                'message': '^Please select a product.',
              },
            },
          },
        }, {
          'name': 'format',
          'constraints': {
            'format': {
              'presence': {
                'message': '^Please select a format.',
              },
            },
          },
        },
      ],
      formgroups: [ {
        gridProps: {
          key: Math.random(),
        },
        formElements: [ {
          layoutProps: {
            horizontalform: false,
          },
          type: 'dropdown',
          passProps: {
            fluid: true,
            selection: true,
          },
          name: 'product',
          label: 'Product',
          options: [
            // {
            //   label: 'Text Recognition',
            //   value: 'text_recognition',
            // },
            {
              label: 'Machine Learning',
              value: 'machine_learning',
            }, {
              label: 'Decision Engine',
              value: 'rules_engine',
            },
          ],
        },
        ],
      },
      {
        gridProps: {
          key: Math.random(),
        },
        formElements: [ {
          layoutProps: {
            horizontalform: false,
          },
          type: 'dropdown',
          passProps: {
            fluid: true,
            selection: true,
          },
          name: 'format',
          label: 'Format',
          options: [ {
            label: 'JSON',
            value: 'json',
          }, {
            label: 'XML',
            value: 'xml',
          },
          ],
        },
        ],
      },
      {
        gridProps: {
          key: Math.random(),
          style: {
            display: 'none',
          },
        },
        formElements: [ {
          layoutProps: {
            horizontalform: false,
          },
          type: 'dropdown',
          passProps: {
            fluid: true,
            selection: true,
          },
          name: 'templates',
          label: 'Templates',
          options: [ {
            label: 'templates',
            value: 'templates',
          },
          ],
        },
        ],
      },
      {
        gridProps: {
          key: Math.random(),
          style: {
            display: 'none',
          },
        },
        formElements: [ {
          layoutProps: {
            horizontalform: false,
          },
          type: 'dropdown',
          passProps: {
            fluid: true,
            selection: true,
          },
          name: 'models',
          label: 'Model',
          options: req.controllerData.mlmodels.map(model => {
            return { label: model.display_name, value: model._id.toString(), };
          }),
        },
        ],
      },
      {
        gridProps: {
          key: Math.random(),
          style: {
            display: 'none',
          },
        },
        formElements: [ {
          layoutProps: {
            horizontalform: false,
          },
          type: 'dropdown',
          passProps: {
            fluid: true,
            selection: true,
          },
          name: 'strategies',
          label: 'Strategy',
          options: req.controllerData.strategies.map(strat => {
            return { label: strat.display_name, value: strat._id.toString(), };
          }),
        },
        ],
      },
      {
        gridProps: {
          key: Math.random(),
          style: {
            display: 'none',
          },
        },
        formElements: [ {
          layoutProps: {
            horizontalform: false,
          },
          type: 'dropdown',
          passProps: {
            fluid: true,
            selection: true,
          },
          name: 'type',
          label: 'Type',
          options: [ {
            label: 'Individual',
            value: 'individual',
          }, {
            label: 'Batch',
            value: 'batch',
          },
          ],
        },
        ],
      },
      {
        gridProps: {
          key: Math.random(),
          className: 'modal-footer-btns',
          style: {
            justifyContent: 'center',
          },
          isMultiline: false,
          responsive: 'isMobile',
        },
        formElements: [ {
          type: 'layout',
          layoutProps: {
            className: 'downloadRequestLink',
            style: {
              textAlign: 'center',
            },
          },
          value: {
            component: 'ResponsiveButton',
            children: 'Download',
            props: {
              onclickBaseUrl: '/api/download_request/:format/:product/:id/:type',
              aProps: {
                className: '__re-bulma_button __re-bulma_is-primary',
                token: true,
              },
            },
          },
        }, ],
      }, ],
    },
  }, ];
  return req;
}

async function reformatMLVariables(req) {
  if (req.controllerData && req.controllerData.mlmodel && req.controllerData.mlmodel.datasource && req.controllerData.mlmodel.datasource.strategy_data_schema) {
    let ml_input_schema = req.controllerData.mlmodel.datasource.included_columns || req.controllerData.mlmodel.datasource.strategy_data_schema;
    let data_schema = JSON.parse(ml_input_schema);
    req.controllerData.data_types = Object.keys(data_schema).reduce((acc, curr) => {
      if (curr === 'historical_result') return acc;
      else {
        acc[ curr ] = data_schema[ curr ].data_type;
        return acc;
      }
    }, {});
  }
  return req;
}

async function removeWhitespaceCharacters(req) {
  try {
    req.controllerData = req.controllerData || {};
    req.body = JSON.stringify(req.body);
    req.body = req.body.replace(/\\n/g, '').replace(/\\t/g, '');
    req.body = JSON.parse(req.body);
    return req;
  } catch (e) {
    if (req.headers && req.headers[ 'content-type' ] === 'application/xml') {
      let xml = jsonToXML(e);
      if (xml instanceof Error) {
        req.error = xml.message;
        return req;
      }
    }
    req.error = e.message;
    return req;
  }
}

async function formatApplicationForCreate(req) {
  try {
    req.controllerData = req.controllerData || {};
    const organization = req.controllerData.org;
    if (req.controllerData.product) req.body.product = req.controllerData.product._id.toString();
    if (!req.body.status && organization && organization.los && organization.los.statuses) req.body.status = organization.los.statuses[ 0 ].toString();
    if (!req.body.estimated_close_date) req.body.estimated_close_date = moment(new Date()).add(1, 'M').toISOString();
    if (!req.body.team_members) req.body.team_members = [];
    if (req.controllerData.labels) req.body.labels = req.controllerData.labels.map(label => label._id.toString());
    if (!req.body.labels) req.body.labels = [];
    req.body.title = req.controllerData.product ? `${req.body.customer_name} ${req.controllerData.product.name}` : `${req.body.customer_name}`;
    return req;
  } catch (e) {
    req.error = e.message;
    return req;
  }
}

module.exports = {
  convertToXML,
  populateUniqueVariables,
  reformatVariables,
  APIRequestModal,
  reformatMLVariables,
  removeWhitespaceCharacters,
  formatApplicationForCreate,
};
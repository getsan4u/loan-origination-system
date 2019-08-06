'use strict';

const utilities = require('../utilities');
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const moment = require('moment');
const randomKey = Math.random;
const shared = utilities.views.shared;
const formElements = shared.props.formElements.formElements;
const cardprops = shared.props.cardprops;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const appGlobalSubTabs = utilities.views.shared.component.appGlobalSubTabs.appGlobalSubTabs;
const integrationTabs = utilities.views.integration.components.integrationTabs;
const transformhelpers = require('../utilities/transformhelpers');

/**
 * Formats data integration.
 * @param {object} req express request object
 * @returns {promise} a promise that resolves a modified request object
 */
async function transformDataIntegration(req) {
  req.controllerData = req.controllerData || {};
  let dataintegration = req.controllerData.dataintegration;
  dataintegration.created_at = moment(dataintegration.createdat).format('MM/DD/YYYY');
  dataintegration.updated_at = moment(dataintegration.updatedat).format('MM/DD/YYYY');
  dataintegration.ip_addresses = dataintegration.ip_addresses.join(', ');
  dataintegration.status = dataintegration.status === 'active' ? true : false;
  dataintegration.security_cert = dataintegration.credentials && dataintegration.credentials.security_certificate && dataintegration.credentials.security_certificate.attributes && dataintegration.credentials.security_certificate.attributes.original_filename ? dataintegration.credentials.security_certificate.attributes.original_filename : 'None';
  dataintegration.creds = {
    active: JSON.stringify(req.controllerData.dataintegration.credentials.active, null, 1).slice(2, -2),
    testing: JSON.stringify(req.controllerData.dataintegration.credentials.testing, null, 1).slice(2, -2),
  };
  dataintegration.inputs = dataintegration.inputs.map(input => {
    if (input.input_type === 'variable' && input.input_variable) {
      input.input_val = input.input_variable.name;
    } else if (input.input_type === 'value') {
      input.input_val = input.input_value;
    }
    return input;
  });
  dataintegration.outputs = dataintegration.outputs.map(output => {
    if (output.output_variable) output.output_val = output.output_variable.name;
    return output;
  });
  return req;
}

/**
 * Formats data integrations.
 * @param {object} req express request object
 * @returns {promise} a promise that resolves a modified request object
 */
async function transformDataIntegrations(req) {
  req.controllerData = req.controllerData || {};
  req.controllerData.dataintegrations = req.controllerData.dataintegrations.map(data => {
    data.display_status = data.status === 'active' ? 'Active' : 'Inactive';
    return data;
  });
  return req;
}

/**
 * Creates integration tabs.
 * @param {Object} req Express request object.
 * @returns request object with updated fields for integration overview page.
 */
async function overviewPage(req) {
  req.controllerData = req.controllerData || {};
  if (req.query.page === 'overview') {
    req.controllerData.overview = [
      integrationTabs('dataintegrations'),
      plainHeaderTitle({
        title: [ {
          component: 'span',
          asyncprops: {
            children: [ 'integrationdata', 'dataintegration', 'name', ],
          },
        },
        ],
      }),
      appGlobalSubTabs('Overview & Credentials', [ { label: 'Overview & Credentials', location: 'overview', asyncprops: { onclickPropObject: [ 'integrationdata', 'dataintegration', ], }, params: [ { key: ':id', val: '_id', }, ], }, { label: 'Data Setup', location: 'data_setup', asyncprops: { onclickPropObject: [ 'integrationdata', 'dataintegration', ], }, params: [ { key: ':id', val: '_id', }, ], }, ], '/integration/dataintegrations/:id'),
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        children: [ {
          component: 'ResponsiveForm',
          hasWindowFunc: true,
          props: {
            ref: 'func:window.addRef',
            'onSubmit': {
              url: ' /integrations/update_credentials/:id',
              'options': {
                'method': 'PUT',
              },
              'params': [
                {
                  'key': ':id',
                  'val': '_id',
                },
              ],
              successProps: {
                type: 'success',
                text: 'Changes saved successfully!',
                timeout: 10000,
              },
              successCallback: [ 'func:this.props.createNotification', 'func:this.props.refresh', ],
            },
            blockPageUI: true,
            useFormOptions: true,
            flattenFormData: true,
            footergroups: false,
            formgroups: [
              {
                gridProps: {
                  key: randomKey(),
                  className: 'global-button-bar',
                  style: {
                    justifyContent: 'flex-end',
                  },
                },
                formElements: [ {
                  type: 'layout',
                  layoutProps: {
                    className: 'uploadSecurityCert',
                    size: 'isNarrow',
                    style: {
                      display: 'none',
                    },
                  },
                  value: {
                    component: 'ResponsiveButton',
                    thisprops: {
                      onclickPropObject: [ 'formdata', ],
                    },
                    props: {
                      onClick: 'func:this.props.createModal',
                      onclickProps: {
                        title: 'Upload Security Certificate',
                        pathname: '/modal/upload_security_certificate/:id',
                        params: [ { key: ':id', val: '_id', }, ],
                      },
                      buttonProps: {
                        color: 'isPrimary',
                      },
                    },
                    children: 'UPLOAD SECURITY CERTIFICATE',
                  },
                },
                {
                  type: 'layout',
                  layoutProps: {
                    size: 'isNarrow',
                  },
                  value: {
                    component: 'ResponsiveButton',
                    props: {
                      onClick: 'func:this.props.createModal',
                      onclickProps: {
                        title: 'Confirm Change to Data Integration',
                        pathname: `/modal/save_data_integration/${req.controllerData.dataintegration._id}`,
                      },
                      buttonProps: {
                        color: 'isPrimary',
                      },
                    },
                    children: 'SAVE',
                  },
                },
                {
                  type: 'layout',
                  layoutProps: {
                    className: 'global-guide-btn',
                    size: 'isNarrow',
                  },
                  value: {
                    component: 'a',
                    props: {
                      href: references.guideLinks.integration[ '/dataintegrations/:id/overview' ],
                      target: '_blank',
                      rel: 'noopener noreferrer',
                      className: '__re-bulma_button __re-bulma_is-primary',
                    },
                    children: [ {
                      component: 'span',
                      children: 'GUIDE',
                    }, {
                      component: 'Icon',
                      props: {
                        icon: 'fa fa-external-link',
                      },
                    }, ],
                  },
                }, ],
              },
              {
                gridProps: {
                  key: randomKey(),
                },
                card: {
                  doubleCard: true,
                  leftDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  rightDoubleCardColumn: {
                    style: {
                      display: 'flex',
                    },
                  },
                  leftCardProps: cardprops({
                    cardTitle: 'Overview',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                  rightCardProps: cardprops({
                    cardTitle: 'Credentials',
                    cardStyle: {
                      marginBottom: 0,
                    },
                  }),
                },
                formElements: [ formElements({
                  twoColumns: true,
                  doubleCard: true,
                  left: [ {
                    label: 'Integration Name',
                    name: 'name',
                    passProps: {
                      state: 'isDisabled',
                    },
                  }, {
                    label: 'Data Provider',
                    name: 'data_provider',
                    passProps: {
                      state: 'isDisabled',
                    },
                  }, {
                    label: 'Created',
                    name: 'created_at',
                    passProps: {
                      state: 'isDisabled',
                    },
                  }, {
                    label: 'Updated',
                    name: 'updated_at',
                    passProps: {
                      state: 'isDisabled',
                    },
                  }, {
                    label: 'Description',
                    name: 'description',
                    passProps: {
                      state: 'isDisabled',
                    },
                  },
                  {
                    label: 'Server IP Address',
                    name: 'ip_addresses',
                    passProps: {
                      state: 'isDisabled',
                    },
                  },
                  {
                    label: 'Security Certificate',
                    name: 'security_cert',
                    passProps: {
                      state: 'isDisabled',
                    },
                    layoutProps: {
                      className: 'securityCert',
                      style: {
                        display: 'none',
                      },
                    },
                  },
                  {
                    name: 'status',
                    type: 'switch',
                    label: 'Status',
                    layoutProps: {
                      className: 'horizontal-switch',
                    },
                    labelProps: {
                      style: {
                        flex: 'none',
                        width: '50px',
                      },
                    },
                    onChange: 'func:window.changeIntegrationStatus',
                    placeholder: 'Enabled (will appear as a Data Integration option)',
                    placeholderProps: {
                      className: 'dataIntegrationStatus'
                    }
                  },
                  ],
                  right: [
                    {
                      type: 'layout',
                      layoutProps: {
                        className: 'tabbed-code-mirror',
                      },
                      value: {
                        component: 'div',
                        children: [ {
                          component: 'div',
                          props: {
                            style: {
                              fontStyle: 'italic',
                            },
                          },
                          children: 'These credentials will be used for authenticating the API request',
                        }, {
                          component: 'ul',
                          props: {
                            style: {
                              fontStyle: 'italic',
                            },
                          },
                          children: [ {
                            component: 'li',
                            children: [ {
                              component: 'span',
                              children: 'Testing: Credentials that will be used when the Strategy status is “Testing” or “Inactive”',
                            },
                            {
                              component: 'li',
                              children: [ {
                                component: 'span',
                                children: 'Active: Credentials that will be used when the Strategy status is “Active”',
                              },
                              ],
                            },
                            ],
                          },
                          ],
                        }, ]
                      },
                    },
                    {
                      type: 'tabs',
                      name: 'current_tab',
                      label: ' ',
                      passProps: {
                        tabsProps: {
                          tabStyle: 'isBoxed',
                        },
                        isButton: false,
                      },
                      tabs: [ {
                        name: 'Testing',
                        formElements: [ {
                          type: 'code',
                          name: 'creds.testing',
                          passProps: {

                          },
                          codeMirrorProps: {
                            options: {
                              mode: 'javascript',
                            },
                          },
                        } ]
                      }, {
                        name: 'Active',
                        formElements: [ {
                          type: 'code',
                          name: 'creds.active',
                          passProps: {

                          },
                          codeMirrorProps: {
                            options: {
                              mode: 'javascript',
                            },
                          },
                        } ]
                      } ]
                    },
                  ],
                }),
                ],
              },
            ],
          },
          asyncprops: {
            formdata: [ 'integrationdata', 'dataintegration', ],
            tabs: [ 'integrationdata', 'tabs', ],
          },
        },
        ],
      },
    ];
  }
  return req;
}

/**
 * Modifies req.body for submit required variables modal.
 * @param {Object} req Express request object.
 * @returns request Required variables modal.
 */
async function formatRequiredVariables(req) {
  let newBody = Object.assign({}, req.controllerData.dataintegration);
  delete newBody._id;
  newBody.organization = newBody.organization._id.toString();
  newBody.inputs = newBody.inputs.map(input => {
    if (input.input_variable) input.input_variable = input.input_variable._id.toString();
    else delete input.input_variable;
    if (req.query.variables === 'required') {
      input.input_type = req.body[ `${input.display_name.toLowerCase().replace(/[\W]+/g, '_')}_type` ];
      if (req.body[ `${input.display_name.toLowerCase().replace(/[\W]+/g, '_')}_type` ] === 'value') {
        input.input_value = input.data_type === 'Boolean'
          ? req.body[ `${input.display_name.toLowerCase().replace(/[\W]+/g, '_')}_dropdown` ] || undefined
          : req.body[ `${input.display_name.toLowerCase().replace(/[\W]+/g, '_')}_text` ] || undefined;
        delete input.input_variable;
        if (input.input_value === undefined) {
          input.input_type = undefined;
        }
      } else {
        input.input_variable = req.body[ `${input.display_name.toLowerCase().replace(/[\W]+/g, '_')}_dropdown` ] || undefined;
        delete input.input_value;
        if (input.input_variable === undefined) {
          input.input_type = undefined;
          delete input.input_variable;
        }
      }
    }
    return input;
  });
  if (newBody.outputs && newBody.outputs.length) {
    newBody.outputs = newBody.outputs.map(output => {
      if (output.output_variable) output.output_variable = output.output_variable._id.toString();
      else delete output.output_variable;
      if (req.query.variables === 'received') {
        output.output_variable = req.body[ `${output.api_name.toLowerCase().replace(/[\W]+/g, '_')}_dropdown` ] || undefined;
        if (output.output_variable === undefined) delete output.output_variable;
      }
      return output;
    });
  }
  req.body = newBody;
  req.controllerData.isPatch = false;
  return req;
}

async function formatCredentialsBody(req) {
  try {
    if (req.body[ 'creds.active' ]) req.body[ 'creds.active' ] = JSON.parse('{' + req.body[ 'creds.active' ] + '}');
    if (req.body[ 'creds.testing' ]) req.body[ 'creds.testing' ] = JSON.parse('{' + req.body[ 'creds.testing' ] + '}');
    return req;
  } catch (e) {
    req.error = 'Please enter the credentials in the correct format.';
    return req;
  }
}

function generateActivationManifest(req) {
  return new Promise((resolve, reject) => {
    try {
      if (req.query && req.query.manifest) {
        let submitButton = {
          type: 'layout',
          layoutProps: {
            className: 'global-button-save'
          },
          value: {
            component: 'ResponsiveButton',
            props: {
              onClick: 'func:this.props.createNotification',
              onclickProps: {
                timeout: 10000,
                type: 'error',
                text: 'You do not have the required permissions to activate a strategy. Please contact your account administrator if you believe your permissions should be adjusted.',
              },
              buttonProps: {
                color: 'isPrimary',
              },
            },
            children: 'SAVE',
          },
        };
        if (req.user.userroles && req.user.userroles.length && req.user.userroles[ 0 ].title && (req.user.userroles[ 0 ].title === 'admin' || req.user.userroles[ 0 ].title === 'owner')) {
          submitButton = {
            type: 'submit',
            value: 'SAVE',
            layoutProps: {
              className: 'global-button-save',
              size: 'isNarrow',
            },
            passProps: {
              color: 'isPrimary',
            },
            confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
              title: 'Confirm Change to Active & Testing Strategies',
              textContent: [ {
                component: 'p',
                children: 'WARNING: CHANGING YOUR ACTIVE AND TESTING STRATEGIES WILL RESULT IN AN IMMEDIATE CHANGE TO THE SYSTEM. BEFORE SAVING, PLEASE CONFIRM THAT ALL INFORMATION IS CORRECT AND HAS BEEN REVIEWED.',
                props: {
                  style: {
                    textAlign: 'left',
                  },
                },
              },
              {
                component: 'p',
                children: 'Please confirm that you would like to save changes.',
                props: {
                  style: {
                    textAlign: 'left',
                  },
                },
              },
              ],
              yesButtonText: 'CONFIRM',
              noButtonText: 'CANCEL',
              yesButtonProps: {
                style: {
                  margin: '5px',
                },
                buttonProps: {
                  color: 'isSuccess',
                },
              },
              noButtonProps: {
                style: {
                  margin: '5px',
                },
                buttonProps: {
                  color: 'isDanger',
                },
              },
              buttonWrapperProps: {
                className: 'modal-footer-btns',
                style: {
                  'flexDirection': 'row-reverse',
                },
              },
            }),
          };
        }
        req.controllerData.form = [ {
          component: 'ResponsiveForm',
          props: {
            onSubmit: {
              url: '/integrations/activate',
              options: {
                headers: {
                  'Content-Type': 'application/json',
                },
                method: 'POST',
              },
              successProps: {
                type: 'success',
                text: 'Changes saved successfully!',
                timeout: 10000,
              },
              successCallback: [ 'func:this.props.refresh', 'func:this.props.createNotification', ],
              responseCallback: 'func:this.props.refresh',
            },
            formgroups: [ {
              gridProps: {
                key: randomKey(),
                className: 'global-button-bar',
                style: {
                  justifyContent: 'flex-end',
                },
              },
              formElements: [{
                type: 'layout',
                layoutProps: {
                  className: 'global-guide-btn',
                  size: 'isNarrow',
                },
                value: {
                  component: 'a',
                  props: {
                    href: references.guideLinks.rulesEngine.APIProcessing,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    className: '__re-bulma_button __re-bulma_is-primary',
                  },
                  children: [ {
                    component: 'span',
                    children: 'GUIDE',
                  }, {
                    component: 'Icon',
                    props: {
                      icon: 'fa fa-external-link',
                    },
                  }, ],
                },
              }, ],
            }, {
              gridProps: {
                key: randomKey(),
              },
              card: {
                doubleCard: true,
                leftDoubleCardColumn: {
                  style: {
                    display: 'flex',
                  },
                },
                rightDoubleCardColumn: {
                  style: {
                    display: 'flex',
                  },
                },
                leftCardProps: cardprops({
                  cardTitle: 'Active Strategies',
                  cardStyle: {
                    marginBottom: 0,
                  },
                }),
                rightCardProps: cardprops({
                  cardTitle: 'Overview',
                  cardStyle: {
                    marginBottom: 0,
                  },
                }),
              },
              formElements: [ formElements({
                twoColumns: true,
                doubleCard: true,
                left: [ {
                  type: 'layout',
                  value: {
                    component: 'ResponsiveForm',
                    bindprops: true,
                    props: {
                      flattenFormData: true,
                      footergroups: false,
                      useFormOptions: true,
                      formdata: req.controllerData.formdata,
                      __formOptions: req.controllerData.formoptions,
                      formgroups: [
                        {
                          gridProps: {
                            key: randomKey(),
                          },
                          formElements: [ submitButton,
                          ],
                        },
                        {
                          gridProps: {
                            key: randomKey(),
                          },
                          formElements: [ {
                            'name': 'strategies',
                            'type': 'datatable',
                            uniqueFormOptions: true,
                            'flattenRowData': false,
                            'addNewRows': false,
                            'rowButtons': false,
                            'useInputRows': true,
                            passProps: {
                              disableSort: true,
                              tableWrappingStyle: {
                                overflow: 'visible',
                              },
                            },
                            'sortable': false,
                            'ignoreTableHeaders': [ 'id', ],
                            headers: [ {
                              label: 'Strategy Name',
                              sortid: 'title',
                              sortable: false,
                              headerColumnProps: {
                                style: {
                                  width: '50%',
                                },
                              },
                            }, {
                              label: 'Active Version',
                              sortid: 'active',
                              sortable: false,
                              formtype: 'dropdown',
                              value: ' ',
                              columnProps: {
                                style: {
                                  overflow: 'visible',
                                },
                              },
                            }, {
                              label: 'Testing Version',
                              sortid: 'testing',
                              value: ' ',
                              sortable: false,
                              formtype: 'dropdown',
                              columnProps: {
                                style: {
                                  overflow: 'visible',
                                },
                              },
                            },
                            ],
                            tableHeaderType: {
                              'active': 'dropdown',
                              'testing': 'dropdown',
                            },
                          },
                          ],
                        },
                      ],
                    },
                  },
                },],
                right: [{
                  type: 'layout',
                  value: {
                    component: 'div',
                    children: [ {
                      component: 'p',
                      children: 'This section lets you set which strategies are available for use.',
                    }, {
                      component: 'li',
                      children: 'Within invididual and batch processing, non-admin users will only be able to use Active strategies (Admin users can use all strategies).',
                    }, {
                      component: 'li',
                      children: 'For the API, only the Active and Testing versions of strategies can be used.',
                    }, {
                      component: 'p',
                      children: 'Setting a version as “Active” will lock it to prevent additional changes.',
                    },
                    ],
                  },
                },],
              }),
              ],
            },
            ],
          },
        } ];
        return resolve(req);
      } else {
        return resolve(req);
      }
    } catch (err) {
      req.error = err.message;
      return resolve(req);
    }
  });
}

module.exports = {
  generateActivationManifest,
  transformDataIntegration,
  transformDataIntegrations,
  overviewPage,
  formatRequiredVariables,
  formatCredentialsBody,
};
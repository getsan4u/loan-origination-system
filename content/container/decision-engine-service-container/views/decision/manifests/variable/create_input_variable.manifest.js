'use strict';

const capitalize = require('capitalize');
const pluralize = require('pluralize');
const utilities = require('../../../../utilities');
const formConfigs = require('../../../../utilities/views/decision/shared/components/formConfigs');
const decisionTabs = require('../../../../utilities/views/decision/shared/components/decisionTabs');
const collectionDetailTabs = require('../../../../utilities/views/decision/shared/components/collectionDetailTabs');
const detailAsyncHeaderTitle = require('../../../../utilities/views/shared/component/layoutComponents').detailAsyncHeaderTitle;
const detailHeaderButtons = require('../../../../utilities/views/decision/shared/components/detailHeaderButtons');
const styles = require('../../../../utilities/views/constants/styles');
const CONSTANTS = require('../../../../utilities/views/decision/constants');
const DATA_TYPES_DROPDOWN = CONSTANTS.DATA_TYPES_DROPDOWN;
const VARIABLE_TYPES_DROPDOWN = CONSTANTS.VARIABLE_TYPES_DROPDOWN;
const commentsModal = require('../../../../utilities/views/decision/modals/comment');
const cardprops = require('../../../../utilities/views/decision/shared/components/cardProps');
const formElements = require('../../../../utilities/views/decision/shared/components/formElements');
const randomKey = Math.random;

module.exports = {
  'containers': {
    [ `/decision/variables/new/input` ]: {
      layout: {
        privileges: [101, 102, 103],
        component: 'div',
        children: [{ 
          component: 'Container',
          children: [{
            component: 'ResponsiveForm',
            props: {
              flattenFormData: true,
              footergroups: false,
              useFormOptions: true,
              onChange: 'func:window.checkVariableSystemName',
              onSubmit: {
                url: `/decision/api/standard_variables`,
                options: {
                  headers: {
                    'Content-Type': 'application/json',
                  },
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
              validations: [
                {
                  name: 'name',
                  constraints: {
                    name: {
                      presence: {
                        message: '^Variable Name is required.',
                      },
                    },
                  },
                }, {
                  name: 'type',
                  constraints: {
                    type: {
                      presence: {
                        message: '^Variable Type is required.',
                      },
                    },
                  },
                }, {
                  name: 'data_type',
                  constraints: {
                    data_type: {
                      presence: {
                        message: '^Data Type is required.',
                      },
                    },
                  },
                },
              ],
              hiddenFields: [ {
                form_name: 'type',
                form_static_val: 'Input',
              }, ],
              formgroups: [ {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  name: 'name',
                  label: 'Variable Display Name',
                  validateOnBlur: true,
                  keyUp: 'func:window.variableNameOnChange',
                  onBlur: true,
                  errorIconRight: true,
                  errorIcon: 'fa fa-exclamation',
                  layoutProps: {
                  },
                }, ]
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  name: 'type',
                  label: 'Variable Type',
                  value: 'Input',
                  validateOnChange: true,
                  passProps: {
                    state: 'isDisabled',
                  },
                  errorIconRight: true,
                  errorIcon: 'fa fa-exclamation',
                  layoutProps: {
                  },
                }]
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  name: 'data_type',
                  label: 'Data Type',
                  type: 'dropdown',
                  value: '',
                  validateOnChange: true,
                  passProps: {
                    selection: true,
                    fluid: true
                  },
                  errorIconRight: true,
                  errorIcon: 'fa fa-exclamation',
                  layoutProps: {
                  },
                  options: DATA_TYPES_DROPDOWN,
                }]
              },
              {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  name: 'description',
                  label: 'Description',
                  type: 'textarea',
                  validateOnBlur: true,
                  onBlur: true,
                  errorIconRight: true,
                  errorIcon: 'fa fa-exclamation',
                  placeholder: ' ',
                  layoutProps: {
                  },
                }, ]
              }, {
                gridProps: {
                  key: randomKey(),
                  style: {
                    textAlign: 'right',
                  }
                },
                formElements: [ {
                  type: 'Semantic.checkbox',
                  label: 'Set a variable system name',
                  passProps: {
                    className: 'reverse-label',
                  },
                  layoutProps: {
                    style: {
                    }
                  },
                  name: 'has_variable_system_name', 
                }, ]
              }, {
                gridProps: {
                  key: randomKey(),
                  className: 'variable_system_name',
                },
                formElements: [ {
                  label: 'Variable System Name (Automatically generated if left blank)',
                  name: 'variable_system_name',
                  onChangeFilter: 'func:window.cleanVariableSystemName',
                  passProps: {
                    color: 'isPrimary',
                  },
                  layoutProps: {
                    style: {
                      textAlign: 'center',
                      padding: 0,
                    },
                  },
                }, ]
              }, {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [ {
                  type: 'submit',
                  value: 'CREATE VARIABLE',
                  passProps: {
                    color: 'isPrimary',
                  },
                  layoutProps: {
                    style: {
                      textAlign: 'center',
                      padding: 0,
                    },
                  },
                }, ]
              }, ],
            },
            asyncprops: {
              formdata: [ `variabledata`, 'data' ],
              __formOptions: [ `variabledata`, 'formoptions' ],
            },
          } ]
        }]
      },
      'resources': {
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: [ 'func:window.redirect', ],
            onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      'callbacks': ['func:window.globalBarSaveBtn', 'func:window.hideVariableSystemName'],
      'pageData': {
        'title': 'DigiFi | Decision Engine',
        'navLabel': 'Decision Engine',
      },
      'onFinish': 'render',
    },
  },
};
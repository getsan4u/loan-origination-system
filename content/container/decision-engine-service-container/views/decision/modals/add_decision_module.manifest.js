'use strict';
const moment = require('moment');
const utilities = require('../../../utilities');
const randomKey = Math.random;
const pluralize = require('pluralize');
const styles = utilities.views.constants.styles;
const util = require('util');
const getRadioButtonGroup = utilities.views.decision.shared.components.radioButtonGroup;
const periodic = require('periodicjs')
const dataintegrations = periodic.settings.container[ 'decision-engine-service-container' ].dataintegrations || false;
let radioButtonGroup = [
  // {
  // name: 'type',
  // value: 'documentocr',
  // icon: styles.moduleIcons['dataintegration'],
  // title: 'Document OCR',
  // subtext: 'Extracts information from a document',
  // },
  {
    name: 'type',
    value: 'requirements',
    icon: styles.moduleIcons[ 'requirements' ],
    title: 'REQUIREMENTS RULES',
    subtext: 'Requirements for the process to pass',
  }, {
    name: 'type',
    value: 'scorecard',
    icon: styles.moduleIcons[ 'scorecard' ],
    title: 'SCORING MODEL',
    subtext: 'Scorecard that generates a score',
  }, {
    name: 'type',
    value: 'calculations',
    icon: styles.moduleIcons[ 'calculations' ],
    title: 'CALCULATION SCRIPTS',
    subtext: 'Calculates output variables',
  }, {
    name: 'type',
    value: 'output',
    icon: styles.moduleIcons[ 'output' ],
    title: 'Rule-Based Outputs',
    subtext: 'Assigns values to output variables if rules pass',
  }, {
    name: 'type',
    value: 'assignments',
    icon: styles.moduleIcons[ 'assignments' ],
    title: 'Simple Outputs',
    subtext: 'Assigns values to output variables',
  }, {
    name: 'type',
    value: 'artificialintelligence',
    icon: styles.moduleIcons[ 'artificialintelligence' ],
    title: 'Machine Learning',
    subtext: 'Runs a model from DigiFi Machine Learning',
  },
  // {
  //   name: 'type',
  //   value: 'documentcreation',
  //   icon: styles.moduleIcons[ 'dataintegration' ],
  //   title: 'Document Creation',
  //   subtext: 'Creates a PDF document',
  // }, 
  // {
  //   name: 'type',
  //   value: 'email',
  //   icon: styles.moduleIcons[ 'email' ],
  //   title: 'Send Email',
  //   subtext: 'Sends an email',
  // }, 
  // {
  //   name: 'type',
  //   value: 'textmessage',
  //   icon: styles.moduleIcons[ 'textmessage' ],
  //   title: 'Send text message',
  //   subtext: 'Sends a text message',
  // }, 
];
if (dataintegrations) radioButtonGroup.push({
  name: 'type',
  value: 'dataintegration',
  icon: styles.moduleIcons[ 'dataintegration' ],
  title: 'Data Integration',
  subtext: 'Integrations with data sources',
}, );

module.exports = {
  'containers': {
    [ '/decision/strategies/:id/add_decision_module' ]: {
      layout: {
        privileges: [101, 102, 103],
        component: 'div',
        children: [
          {
            component: 'Container',
            children: [
              {
                component: 'ResponsiveFormContainer',
                asyncprops: {
                  formdata: [ `pagedata`, 'data' ],
                  __formOptions: [ `moduledata`, 'formoptions' ],
                },
                props: {
                  validations: {
                    name: {
                      name: 'name',
                      constraints: {
                        name: {
                          presence: {
                            message: '^Process Module Name is required.',
                          },
                        },
                      },
                    },
                    type: {
                      "name": "type",
                      "constraints": {
                        "type": {
                          "presence": {
                            "message": "^Module Type is required."
                          }
                        }
                      }
                    },
                    integration_name: {
                      name: 'integration_name',
                      constraints: {
                        integration_name: {
                          presence: {
                            message: '^Data Integration Name is required.',
                          },
                        },
                      },
                    },
                    model_name: {
                      name: 'model_name',
                      constraints: {
                        model_name: {
                          presence: {
                            message: '^AI Model Name is required.',
                          },
                        },
                      },
                    },
                  },
                  formgroups: [
                    getRadioButtonGroup(radioButtonGroup),
                    {
                      gridProps: {
                        key: randomKey(),
                        className: '__dynamic_form_elements test',
                      },
                      order: [
                        'name',
                        'integration_name',
                        'model_name',
                        'description',
                        'static_description',
                      ],
                      formElements: [ {
                        name: 'name',
                        keyUp: 'func:window.nameOnChange',
                        label: 'Process Module Name',
                        validateOnBlur: true,
                        onBlur: true,
                        errorIconRight: true,
                        errorIcon: 'fa fa-exclamation',
                        validIcon: 'fa fa-check',
                        passProps: {
                          className: 'module_name_placeholder'
                        },
                      }, {
                        name: 'description',
                        type: 'text',
                        customLabel: {
                          component: 'span',
                          children: [ {
                            component: 'span',
                            children: 'Description ',
                          }, {
                            component: 'span',
                            children: 'Optional',
                            props: {
                              style: {
                                fontStyle: 'italic',
                                marginLeft: '2px',
                                fontWeight: 'normal',
                                color: styles.colors.regGreyText,
                              }
                            }
                          } ]
                        },
                        passProps: {
                          className: 'module_description_placeholder'
                        },
                      }, {
                        name: 'integration_name',
                        label: 'Data Integration Name',
                        value: '',
                        type: 'dropdown',
                        errorIconRight: true,
                        validateOnChange: true,
                        errorIcon: 'fa fa-exclamation',
                        validIcon: 'fa fa-check',
                        options: [],
                        passProps: {
                          selection: true,
                          fluid: true,
                          search: true,
                        },
                        layoutProps: {
                        },
                      }, {
                        name: 'static_description',
                        type: 'text',
                        passProps: {
                          state: 'isDisabled',
                          className: 'module_description_placeholder',
                        },
                        customLabel: {
                          component: 'span',
                          children: [ {
                            component: 'span',
                            children: 'Description ',
                          }, ]
                        },
                      }, {
                        name: 'model_name',
                        label: 'AI Model Name',
                        value: '',
                        type: 'dropdown',
                        errorIconRight: true,
                        validateOnChange: true,
                        errorIcon: 'fa fa-exclamation',
                        validIcon: 'fa fa-check',
                        options: [],
                        passProps: {
                          selection: true,
                          fluid: true,
                          search: true,
                        },
                        layoutProps: {
                        },
                      }, ]
                    }, {
                      gridProps: {
                        key: randomKey(),
                        className: 'modal-footer-btns',
                      },
                      formElements: [ {
                        name: 'submit',
                        type: 'submit',
                        value: 'ADD MODULE',
                        passProps: {
                          color: 'isPrimary'
                        },
                        layoutProps: {
                          style: {
                            textAlign: 'center',
                            padding: 0,
                          },
                        },
                      }, ]
                    }, ],
                  renderFormElements: {
                    name: 'func:window.filterModuleName',
                    integration_name: 'func:window.filterModuleName',
                    model_name: 'func:window.filterModuleName',
                    description: 'func:window.filterModuleDescription',
                    static_description: 'func:window.filterModuleDescription',
                  },
                  form: {
                    useFormOptions: true,
                    flattenFormData: true,
                    footergroups: false,
                    setInitialValues: false,
                    onSubmit: {
                      url: `/decision/api/standard_strategies/:id/modules?format=json&method=create`,
                      params: [
                        { 'key': ':id', 'val': '_id', },
                      ],
                      options: {
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        method: 'PUT',
                      },
                      successProps: [ 'last', {
                        type: 'success',
                        text: 'Changes saved successfully!',
                        timeout: 10000,
                      },
                      ],
                      successCallback: [ 'func:this.props.hideModal', 'func:this.props.createNotification', ],
                      responseCallback: 'func:this.props.refresh',
                    },
                    validations: [],
                    hiddenFields: [],
                  },
                }
              }
            ]
          } ]
      },
      'resources': {
        [ `pagedata` ]: `/decision/pagedata?addModule=true&format=json`,
        [ 'moduledata' ]: '/decision/moduledata',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: [ 'func:window.redirect', ],
            onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      'callbacks': [ 'func:window.dynamicModalHeight' ],
      'pageData': {
        // 'title': `${options.title}`,
        'navLabel': 'Decision Engine',
      },
      'onFinish': 'render',
    },
  },
};

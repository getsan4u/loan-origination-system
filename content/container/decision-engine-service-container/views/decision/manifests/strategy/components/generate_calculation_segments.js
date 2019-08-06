'use strict';
const capitalize = require('capitalize');
const pluralize = require('pluralize');
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const utilities = require('../../../../../utilities');
const formConfigs = require('../../../../../utilities/views/decision/shared/components/formConfigs');
const decisionTabs = require('../../../../../utilities/views/decision/shared/components/decisionTabs');
const collectionDetailTabs = require('../../../../../utilities/views/decision/shared/components/collectionDetailTabs');
const detailAsyncHeaderTitle = require('../../../../../utilities/views/shared/component/layoutComponents').detailAsyncHeaderTitle;
const styles = require('../../../../../utilities/views/constants/styles');
const references = require('../../../../../utilities/views/constants/references');
const CONSTANTS = require('../../../../../utilities/views/decision/constants');
const DATA_TYPES_DROPDOWN = CONSTANTS.DATA_TYPES_DROPDOWN;
const VARIABLE_TYPES_DROPDOWN = CONSTANTS.VARIABLE_TYPES_DROPDOWN;
const commentsModal = require('../../../../../utilities/views/decision/modals/comment');
const cardprops = require('../../../../../utilities/views/decision/shared/components/cardProps');
const formElements = require('../../../../../utilities/views/decision/shared/components/formElements');
const strategyNavBar = require('./strategy_nav_bar');
const randomKey = Math.random;
const formGlobalButtonBar = require('../../../../../utilities/views/shared/component/globalButtonBar').formGlobalButtonBar;
const addPopulationButtons = require('./rule_dropdowns').addPopulationButtons;
const addRuleDropdown = require('./rule_dropdowns').addRuleDropdown;
const settings = {
  title: 'Strategy Detail',
  type: 'strategy',
  location: 'segment',
};

let { validations, hiddenFields, formgroups, additionalComponents, } = formConfigs[ settings.type ].edit;
let pluralizedType = pluralize(settings.type);
let url = '/decision/api/standard_strategies/:id/segments/calculations/:index?method=editSegment';

const SEGMENT = [decisionTabs(pluralizedType),
  detailAsyncHeaderTitle({ title: settings.title, type: settings.type, }),
  collectionDetailTabs({ tabname: settings.location, collection: settings.type, }),
  {
    component: 'Container',
    props: {
      style: {
        display: 'flex',
      },
    },
    children: [
      {
        component: 'div',
        children: [strategyNavBar(settings.type),],
      },
      {
        component: 'ResponsiveForm',
        hasWindowFunc: true,
        props: {
          style: {
            flex: '1 1 auto',
          },
          ref: 'func:window.addRef',
          flattenFormData: true,
          footergroups: false,
          useFormOptions: true,
          onChange: 'func:window.checkPopulation',
          onSubmit: {
            url,
            params: [
              { 'key': ':id', 'val': '_id', },
              { 'key': ':index', 'val': 'index', },
            ],
            options: {
              headers: {
                'Content-Type': 'application/json',
              },
              method: 'PUT',
            },
            successProps: {
              type: 'success',
              text: 'Changes saved successfully!',
              timeout: 10000,
            },
            successCallback: 'func:window.editFormSuccessCallback',
          },
          formgroups: [
            formGlobalButtonBar({
              left: [],
              right: [{
                type: 'submit',
                value: 'SAVE',
                layoutProps: {
                  size: 'isNarrow',
                },
                passProps: {
                  color: 'isPrimary',
                },
              }, {
                guideButton: true,
                location: references.guideLinks.rulesEngine.strategiesDetailRules,
              },],
            }), {
              gridProps: {
                key: randomKey(),
              },
              card: {
                twoColumns: true,
                props: cardprops({
                  cardStyle: {
                    marginBottom: 0,
                  },
                  headerStyle: {
                    display: 'none',
                  },
                }),
              },
              formElements: [{
                formGroupElementsLeft: [{
                  label: 'Name',
                  keyUp: 'func:window.nameOnChange',
                  name: 'segment_name',
                },],
                formGroupElementsRight: [
                  {
                    label: 'Description',
                    name: 'segment_description',
                  },
                //   {
                //   label: 'Type',
                //   name: 'segment_type',
                //   passProps: {
                //     state: 'isDisabled',
                //   },
                // }, {
                //   label: 'Processing Logic',
                //   value: 'This decision module will calculate each of the Calculated Variables listed below. The calculations will run from top to bottom, in order.',
                //   type: 'textarea',
                //   passProps: {
                //     state: 'isDisabled',
                //   },
                //   }
                ],
              },],
            },
            {
              gridProps: {
                key: randomKey(),
                className: 'calculations_rules',
              },
              card: {
                props: cardprops({
                  cardTitle: 'Calculation Scripts',
                  cardProps: {
                    className: 'primary-card-gradient',
                  },
                  cardStyle: {
                    marginBottom: 0,
                    marginTop: 20,
                  },
                }),
              },
              formElements: [
                {
                  type: 'layout',
                  value: {
                    component: 'p',
                    children: 'This module runs calculation scripts in order and assigns the results to Output Variables.',
                    props: {
                      style: {
                        fontStyle: 'italic',
                        color: styles.colors.gray,
                      },
                    },
                  },
                },
                {
                  type: 'layout',
                  name: 'updated_ruleset',
                  value: {
                    component: 'div',
                  },
                },
                {
                  type: 'dndtable',
                  name: 'ruleset',
                  hasWindowFunction: true,
                  submitOnChange: true,
                  handleRowUpdate: 'func:window.handleRowUpdate',
                  flattenRowData: true,
                  useInputRows: false,
                  addNewRows: false,
                  passProps: {
                    className: 'dnd-text-table dnd-and',
                    itemHeight: 45,
                  },
                  ignoreTableHeaders: ['_id',],
                  headers: [{
                    label: 'Output Variable',
                    sortid: 'state_property_attribute',
                    sortable: false,
                  }, {
                    label: 'Calculation Script (Assigns Result)',
                    sortid: 'state_property_attribute_value_comparison',
                    sortable: false,
                  }, {
                    label: ' ',
                    sortid: 'buttons',
                    sortable: false,
                    columnProps: {
                      style: {
                        width: '90px',
                      },
                    },
                  },],
                },
                {
                  type: 'layout',
                  layoutProps: {
                    size: 'isNarrow',
                    style: {
                      display: 'inline-flex',
                      height: '55px',
                      alignItems: 'center',
                    },
                  },
                  value: addRuleDropdown([{
                    name: 'CREATE NEW',
                    onclickProps: {
                      title: {
                        component: 'span',
                        props: {
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                          }
                        },
                        children: [{
                          component: 'span',
                          children: 'Create New Calculation Script',
                        }, {
                          component: 'ResponsiveButton',
                          props: {
                            buttonProps: {
                              className: 'question-button',
                            },
                            style: {
                              marginLeft: '5px',
                            },
                            onClick: 'func:window.closeModalAndCreateNewModal',
                            onclickProps: {
                              title: 'Overview of Calculation Scripts',
                              pathname: '/modal/overview-calculation-scripts',
                            }
                          }
                        }]
                      },
                      pathname: '/decision/strategies/:id/calculations/create',
                      params: [{ key: ':id', val: '_id', }, ],
                    },
                  }, {
                    name: 'COPY EXISTING',
                    onclickProps: {
                      title: 'Copy Existing Calculation Scripts',
                      pathname: '/decision/strategies/:id/calculations/copy',
                      params: [{ key: ':id', val: '_id', },],
                    },
                  }, {
                    name: 'UPLOAD CSV',
                    onclickProps: {
                      title: 'Upload Calculation Segment',
                      pathname: '/modal/decision/upload_csv_segment/calculations',
                      params: [{ key: ':id', val: '_id', },],
                    },
                    passProps: {
                      style: {
                        display: (THEMESETTINGS.advanced_ruleset_upload) ? '' : 'none',
                      },
                    },
                  },], 'ADD CALCULATION SCRIPT'),
                }, {
                  type: 'Semantic.checkbox',
                  label: 'Apply these calculation scripts to a specific population',
                  passProps: {
                    className: 'reverse-label',
                  },
                  layoutProps: {
                    size: 'isNarrow',
                    style: {
                      display: 'inline-flex',
                      height: '55px',
                      float: 'right',
                      alignItems: 'center',
                    },
                  },
                  name: 'has_population',
                },
              ],
            }, {
              gridProps: {
                key: randomKey(),
                className: 'population_rules',
              },
              card: {
                props: cardprops({
                  cardTitle: 'Population Rules',
                  cardProps: {
                    className: 'primary-card-gradient',
                  },
                  cardStyle: {
                    marginBottom: 0,
                  },
                }),
              },
              formElements: [
                {
                  type: 'layout',
                  name: 'updated_conditions',
                  value: {
                    component: 'div',
                  },
                },
                {
                  type: 'dndtable',
                  name: 'conditions',
                  hasWindowFunction: true,
                  submitOnChange: true,
                  handleRowUpdate: 'func:window.handleRowUpdate',
                  flattenRowData: true,
                  useInputRows: false,
                  addNewRows: false,
                  passProps: {
                    itemHeight: 45,
                    className: 'dnd-text-table dnd-and',
                  },
                  ignoreTableHeaders: ['_id',],
                  headers: [{
                    label: {
                      component: 'Columns',
                      children: [{
                        component: 'Column',
                        props: {
                          size: 'is5',
                        },
                        children: 'Variable',
                      }, {
                        component: 'Column',
                        props: {
                          size: 'is3',
                        },
                        children: 'Comparison',
                      }, {
                        component: 'Column',
                        props: {
                          size: 'is4',
                        },
                        children: 'Value',
                      }]
                    },
                    sortid: 'combined_value_comparison_property',
                    sortable: false,
                  }, {
                    label: ' ',
                    sortid: 'buttons',
                    sortable: false,
                    columnProps: {
                      style: {
                        width: '90px',
                      },
                    },
                  },],
                }, {
                  type: 'layout',
                  value: addPopulationButtons(),
                },],
            },
          ],
        },
        asyncprops: {
          formdata: ['strategydata', 'data',],
          __formOptions: ['strategydata', 'formsettings',],
        },
      },],
  },];

module.exports = SEGMENT;
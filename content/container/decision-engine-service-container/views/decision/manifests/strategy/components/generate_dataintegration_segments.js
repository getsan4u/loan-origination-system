'use strict';
const pluralize = require('pluralize');
const formConfigs = require('../../../../../utilities/views/decision/shared/components/formConfigs');
const decisionTabs = require('../../../../../utilities/views/decision/shared/components/decisionTabs');
const collectionDetailTabs = require('../../../../../utilities/views/decision/shared/components/collectionDetailTabs');
const detailAsyncHeaderTitle = require('../../../../../utilities/views/shared/component/layoutComponents').detailAsyncHeaderTitle;
const styles = require('../../../../../utilities/views/constants/styles');
const references = require('../../../../../utilities/views/constants/references');
const cardprops = require('../../../../../utilities/views/decision/shared/components/cardProps');
const strategyNavBar = require('./strategy_nav_bar');
const randomKey = Math.random;
const formGlobalButtonBar = require('../../../../../utilities/views/shared/component/globalButtonBar').formGlobalButtonBar;
const addPopulationButtons = require('./rule_dropdowns').addPopulationButtons;
const settings = {
  title: 'Strategy Detail',
  type: 'strategy',
  location: 'segment',
};

let pluralizedType = pluralize(settings.type);
let url = '/decision/api/standard_strategies/:id/segments/dataintegration/:index?method=editSegment';

const SEGMENT = [
  decisionTabs(pluralizedType),
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
          formgroups: [formGlobalButtonBar({
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
                  marginBottom: 20,
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
                passProps: {

                }
              },],
              formGroupElementsRight: [{
                label: 'Description',
                name: 'segment_description',
                passProps: {
                  
                }
              },],
            },],
          }, {
            gridProps: {
              key: randomKey(),
              style: {
                marginBottom: 0,
              }
            },
            card: {
              props: cardprops({
                cardTitle: 'Variables Required for Integration',
                cardProps: {
                  className: 'primary-card-gradient',
                },
                cardStyle: {
                  marginBottom: '-10px',
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                },
              }),
            },
            formElements: [
              {
                type: 'layout',
                value: {
                  component: 'p',
                  children: 'The following data items are required by the integration and the Variables below will be used.',
                  props: {
                    style: {
                      fontStyle: 'italic',
                      color: styles.colors.gray
                    },
                  },
                },
              },
              {
                type: 'datatable',
                name: 'inputs',
                // hasWindowFunction: true,
                flattenRowData: true,
                useInputRows: false,
                addNewRows: false,
                passProps: {
                  // className: 'dnd-text-table dnd-plus',
                  itemHeight: 45,
                },
                ignoreTableHeaders: ['_id',],
                headers: [{
                  label: 'Data Item Name',
                  sortid: 'display_name',
                  sortable: false,
                }, {
                  label: 'Variable Used',
                  sortable: false,
                  sortid: 'input_variable',
                },],
              }, {
                type: 'layout',
                layoutProps: {
                  size: 'isNarrow',
                  style: {
                    flex: 'none',
                    display: 'inline-block',
                  },
                },
                value: {
                  component: 'ResponsiveButton',
                  thisprops: {
                    onclickPropObject: ['formdata',],
                  },
                  props: {
                    onClick: 'func:this.props.createModal',
                    onclickProps: {
                      title: 'Variables Required for Data Integration',
                      pathname: '/modal/required_integration_variables/:id',
                      params: [{ key: ':id', val: '_id', },],
                    },
                    buttonProps: {
                      color: 'isPrimary',
                    },
                  },
                  children: 'EDIT',
                },  
              },],
          }, {
            gridProps: {
              key: randomKey(),
            },
            card: {
              props: cardprops({
                cardTitle: 'Variables Received from Integration',
                cardProps: {
                  className: 'hide-card-gradient',
                },
                cardStyle: {
                  marginBottom: 0,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  // marginTop: 20,
                },
              }),
            },
            formElements: [
              {
                type: 'layout',
                value: {
                  component: 'p',
                  children: 'The following data items are provided by the integration and will be saved as the Variables below if returned.',
                  props: {
                    style: {
                      fontStyle: 'italic',
                      color: styles.colors.gray,
                    },
                  },
                },
              },
              {
                type: 'datatable',
                name: 'outputs',
                // hasWindowFunction: true,
                flattenRowData: true,
                useInputRows: false,
                addNewRows: false,
                passProps: {
                  // className: 'dnd-text-table dnd-plus',
                  itemHeight: 45,
                },
                ignoreTableHeaders: ['_id',],
                headers: [{
                  label: 'Data Item Name',
                  sortid: 'display_name',
                  sortable: false,
                }, {
                  label: 'Variable Assigned',
                  sortable: false,
                  sortid: 'output_variable',
                }, ],
              },
              {
                type: 'layout',
                layoutProps: {
                  size: 'isNarrow',
                  style: {
                    flex: 'none',
                    display: 'inline-block',
                  },
                },
                value: {
                  component: 'ResponsiveButton',
                  thisprops: {
                    onclickPropObject: ['formdata',],
                  },
                  props: {
                    onClick: 'func:this.props.createModal',
                    onclickProps: {
                      title: 'Variables Received from Integration',
                      pathname: '/modal/received_integration_variables/:id',
                      params: [{ key: ':id', val: '_id', },],
                    },
                    buttonProps: {
                      color: 'isPrimary',
                    },
                  },
                  children: 'EDIT',
                },  
              },
              {
                type: 'Semantic.checkbox',
                label: 'Run this integration for a specific population',
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
              },],
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
                  // display: 'none'
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
                value: addPopulationButtons({ blockPopulation: true }),
              },],
          },],
        },
        asyncprops: {
          formdata: [`${settings.type}data`, 'data',],
          __formOptions: [`${settings.type}data`, 'formsettings',],
        },
      },],
  },];

module.exports = SEGMENT;
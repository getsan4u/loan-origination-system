'use strict';

const ocrTabs = require('./ocrTabs');
const plainHeaderTitle = require('../../shared/component/layoutComponents').plainHeaderTitle;
const formGlobalButtonBar = require('../../shared/component/globalButtonBar').formGlobalButtonBar;
const styles = require('../../constants').styles;
const cardprops = require('../../shared/props/cardprops');
const formElements = require('../../shared/props/formElements').formElements;
const references = require('../../constants').references;
const randomKey = Math.random;

function generateForm(options) {
  let { id, template_dropdown, } = options;
  return {
    component: 'ResponsiveForm',
    props: {
      blockPageUI: true,
      'onSubmit': {
        url: '/ocr/api/processing/batch',
        'options': {
          'method': 'POST',
        },
        successCallback: 'func:this.props.createNotification',
        successProps: {
          type: 'success',
          text: 'Changes saved successfully!',
          timeout: 10000,
        },
        responseCallback: 'func:this.props.refresh',
      },
      useFormOptions: true,
      flattenFormData: true,
      footergroups: false,
      formgroups: [
        formGlobalButtonBar({
          left: [ {
            type: 'submit',
            value: 'EXTRACT TEXT',
            layoutProps: {
              size: 'isNarrow',
            },
            passProps: {
              color: 'isSuccess',
            }
          },
          ],
          right: [ {
            guideButton: true,
            location: references.guideLinks.vision.batchProcessing,
          } ],
        }),
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
              cardTitle: 'Text Extraction',
              cardStyle: {
                marginBottom: 0,
              },
            }),
            rightCardProps: cardprops({
              cardTitle: 'Batch Results History',
              cardStyle: {
                marginBottom: 0,
              },
            }),
          },
          formElements: [ formElements({
            twoColumns: true,
            doubleCard: true,
            left: [ {
              'label': 'Template Name',
              type: 'dropdown',
              name: 'template_id',
              passProps: {
                selection: true,
                fluid: true,
                search: true,
              },
              options: template_dropdown,
            }, {
              label: 'Documents for Text Extraction (Max 100)',
              name: 'uploadfile',
              type: 'file',
            }, {
              name: 'batch_name',
              placeholder: ' ',
              customLabel: {
                component: 'span',
                children: [ {
                  component: 'span',
                  children: 'Batch Name',
                }, {
                  component: 'span',
                  props: {
                    style: {
                      fontStyle: 'italic',
                      color: '#ccc',
                      marginLeft: '7px',
                      fontWeight: 'normal',
                    },
                  },
                  children: 'Optional',
                }, ],
              },
            }, ],
            right: [ {
              type: 'layout',
              value: {
                component: 'ResponsiveTable',
                hasWindowFunc: true,
                props: {
                  ref: 'func:window.addRef',
                  'flattenRowData': true,
                  'addNewRows': false,
                  'rowButtons': false,
                  'useInputRows': true,
                  simplePagination: true,
                  limit: 10,
                  hasPagination: true,
                  'tableSearch': true,
                  'simpleSearchFilter': true,
                  filterSearchProps: {
                    icon: 'fa fa-search',
                    hasIconRight: false,
                    className: 'global-table-search',
                    placeholder: 'SEARCH',
                  },
                  calculatePagination: true,
                  baseUrl: '/ocr/api/processing/batch/simulations?format=json',
                  dataMap: [ {
                    'key': 'rows',
                    value: 'rows',
                  }, {
                    'key': 'numItems',
                    value: 'numItems',
                  }, {
                    'key': 'numPages',
                    value: 'numPages',
                  },
                  ],
                  ignoreTableHeaders: [ '_id', ],
                  headers: [ {
                    label: 'Date',
                    sortid: 'createdat',
                  }, {
                    label: 'Batch Name',
                    sortid: 'name',
                  }, {
                    label: 'Template',
                    sortid: 'template',
                  }, {
                    label: 'Progress',
                    progressBar: true,
                    sortid: 'status',
                    sortable: false,
                    headerColumnProps: {
                      style: {
                        width: '170px',
                      },
                    },
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
                        onclickBaseUrl: '/ocr/processing/batch/:id',
                        onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                      },
                    }, ],
                  }, ],
                  // rows: history,
                },
                thisprops: {
                  rows: [ 'rows', ],
                  numItems: [ 'numItems', ],
                  numPages: [ 'numPages', ],
                },
              }
            } ],
          }),
          ],
        },
      ],
    },
    asyncprops: {
      rows: [ 'simulationdata', 'rows' ],
      numItems: [ 'simulationdata', 'numItems' ],
      numPages: [ 'simulationdata', 'numPages' ],
    },
  };
}

module.exports = generateForm;
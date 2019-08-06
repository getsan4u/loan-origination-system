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
    bindprops: true,
    asyncprops: {
      rows: [ 'casedata', 'rows' ],
      numItems: [ 'casedata', 'numItems' ],
      numPages: [ 'casedata', 'numPages' ],
    },
    props: {
      blockPageUI: true,
      'onSubmit': {
        url: '/ocr/api/processing/individual',
        'options': {
          'method': 'POST',
        },
        successCallback: 'func:this.props.createNotification',
        successProps: {
          type: 'success',
          text: 'Changes saved successfully!',
          timeout: 10000,
        },
        // responseCallback: '',
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
              className: 'submitbutton',
              style: {
                visibility: 'hidden',
              },
            },
            passProps: {
              color: 'isSuccess',
            }
          },
          ],
          right: [ {
            guideButton: true,
            location: references.guideLinks.vision.individualProcessing,
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
              cardTitle: 'Individual Results History',
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
              customOnChange: 'func:window.showFileUploadFormElement',
              passProps: {
                selection: true,
                fluid: true,
                search: true,
              },
              options: template_dropdown,
            }, {
              label: 'Document for Text Extraction',
              name: 'uploadfile',
              type: 'file',
              customOnChange: 'func:window.showSubmitButtonFormElement',
              layoutProps: {
                className: 'uploadfile_input',
                style: {
                  display: 'none',
                },
              },
            }, ],
            right: [
              {
                type: 'layout',
                value: {
                  component: 'ResponsiveTable',
                  bindprops: true,
                  props: {
                    'flattenRowData': true,
                    'addNewRows': false,
                    'rowButtons': false,
                    'useInputRows': true,
                    simplePagination: true,
                    'tableSearch': true,
                    'simpleSearchFilter': true,
                    filterSearchProps: {
                      icon: 'fa fa-search',
                      hasIconRight: false,
                      className: 'global-table-search',
                      placeholder: 'SEARCH',
                    },
                    calculatePagination: true,
                    limit: 10,
                    hasPagination: true,
                    baseUrl: '/ocr/api/processing/individual/cases?format=json',
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
                      label: 'File Name',
                      sortid: 'filename',
                    }, {
                      label: 'Template',
                      sortid: 'template',
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
                          onclickBaseUrl: '/ocr/processing/individual/:id',
                          onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                        },
                      }, ],
                    }, ],
                  },
                  thisprops: {
                    rows: [ 'rows', ],
                    numItems: [ 'numItems', ],
                    numPages: [ 'numPages', ],
                  },
                }
              }
            ],
          }),
          ],
        },
      ],
    },
  };
}

module.exports = generateForm;
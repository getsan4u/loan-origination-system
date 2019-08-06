'use strict';

const ocrTabs = require('./ocrTabs');
const plainHeaderTitle = require('../../shared/component/layoutComponents').plainHeaderTitle;
const formGlobalButtonBar = require('../../shared/component/globalButtonBar').formGlobalButtonBar;
const styles = require('../../constants').styles;
const cardprops = require('../../shared/props/cardprops');
const formElements = require('../../shared/props/formElements').formElements;
const randomKey = Math.random;
const references = require('../../constants').references;

function generateForm(options) {
  let { id, simulationdoc, } = options;
  return {
    component: 'ResponsiveForm',
    props: {
      blockPageUI: true,
      useFormOptions: true,
      flattenFormData: true,
      footergroups: false,
      formgroups: [
        formGlobalButtonBar({
          left: [ {
            type: 'layout',
            value: {
              component: 'ResponsiveButton',
              children: 'DOWNLOAD RESULTS',
              props: {
                'onclickBaseUrl': `/ocr/api/download/processing/batch/${id}?export_format=csv`,
                aProps: {
                  className: '__re-bulma_button __re-bulma_is-success',
                },
              },
            },
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
              cardTitle: 'Overview',
              cardStyle: {
                marginBottom: 0,
              },
            }),
            rightCardProps: cardprops({
              cardTitle: 'Documents Processed',
              cardStyle: {
                marginBottom: 0,
              },
            }),
          },
          formElements: [ formElements({
            twoColumns: true,
            doubleCard: true,
            left: [ {
              label: 'Batch Name',
              value: simulationdoc.name,
              passProps: {
                'state': 'isDisabled',
              },
            }, {
              label: 'Template Name',
              value: simulationdoc.template ? simulationdoc.template.name : simulationdoc.template_name,
              passProps: {
                'state': 'isDisabled',
              },
            }, {
              label: 'Created',
              value: simulationdoc.formatted_created,
              passProps: {
                'state': 'isDisabled',
              },
            }, {
              label: 'Updated',
              value: simulationdoc.formatted_updated,
              passProps: {
                'state': 'isDisabled',
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
                    limit: 10,
                    hasPagination: true,
                    baseUrl: `/ocr/api/processing/batch/${id}/cases?format=json`,
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
                          onClick: 'func:this.props.createModal',
                          onclickProps: {
                            title: 'Edit Results',
                            pathname: '/ocr/processing/batch/:id/cases/:caseid',
                            params: [ { 'key': ':id', 'val': '_id', }, { 'key': ':caseid', 'val': 'caseid', }, ],
                          },
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
    asyncprops: {
      rows: [ 'casedata', 'rows' ],
      numItems: [ 'casedata', 'numItems' ],
      numPages: [ 'casedata', 'numPages' ],
    },
  };
}

module.exports = generateForm;
'use strict';

const optimizationTabs = require('../components/optimizationTabs');
const plainHeaderTitle = require('../../shared/component/layoutComponents').plainHeaderTitle;
const formGlobalButtonBar = require('../../shared/component/globalButtonBar').formGlobalButtonBar;
const styles = require('../../constants').styles;
const cardprops = require('../../shared/props/cardprops');
const formElements = require('../../shared/props/formElements').formElements;
const randomKey = Math.random;

function generatePage(options) {
  let { doc, ocr_template_string, page, input_variable_map, } = options;
  let formdata = doc;
  let inputs = doc.inputs || [];
  inputs = doc.inputs.map((input, row_idx) => Object.assign({}, input, { display_page: Number(input.page) + 1, row_idx, display_name: input_variable_map[ input.input_variable ] }));
  let pageDropdown = [];
  if (Array.isArray(doc.files) && doc.files.length) {
    let total = doc.files.length;
    pageDropdown = doc.files.map((file, idx) => ({
      label: `${idx + 1} of ${total}`,
      value: `/optimization/ocr/${formdata._id}/${idx}`,
    }));
  }
  return [
    optimizationTabs('ocr'),
    plainHeaderTitle({
      title: [ {
        component: 'span',
        children: doc.name,
      },
      ],
    }),
    styles.fullPageDivider,
    {
      component: 'Container',
      props: {
        className: 'simulation',
      },
      children: [ {
        component: 'ResponsiveForm',
        props: {
          'onSubmit': {
            url: `/optimization/api/documents/${formdata._id}?type=ocrdocument&update=description`,
            'options': {
              'method': 'PUT',
            },
            successProps: {
              type: 'success',
              text: 'Changes saved successfully!',
              timeout: 10000,
            },
            successCallback: [ 'func:this.props.createNotification', ],
          },
          blockPageUI: true,
          useFormOptions: true,
          flattenFormData: true,
          footergroups: false,
          formgroups: [ formGlobalButtonBar({
            left: [
              {
                type: 'layout',
                layoutProps: {
                  size: 'isNarrow',
                  style: {},
                },
                value: {
                  component: 'ResponsiveButton',
                  props: {
                    onClick: 'func:this.props.createModal',
                    onclickProps: {
                      title: 'Upload PDF Document',
                      pathname: `/optimization/create_ocr_template/upload_ocr_template/${formdata._id}`,
                    },
                    buttonProps: {
                      color: 'isSuccess',
                    },
                  },
                  children: 'UPLOAD PDF DOCUMENT',
                },
              },
            ],
            right: [ {
              type: 'submit',
              value: 'SAVE',
              passProps: {
                color: 'isPrimary',
              },
              layoutProps: {
                className: 'global-button-save',
              },
            }, {
              guideButton: true,
              location: '',
            },
            ],
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
                cardTitle: 'Variables to Extract',
                cardStyle: {
                  marginBottom: 0,
                },
              }),
            },
            formElements: [ formElements({
              twoColumns: true,
              doubleCard: true,
              left: [ {
                label: 'OCR Template Name',
                name: 'name',
                value: formdata.name,
                passProps: {
                  state: 'isDisabled',
                },
              }, {
                label: 'Created',
                name: 'created_at',
                value: formdata.created_at,
                passProps: {
                  state: 'isDisabled',
                },
              }, {
                label: 'Updated',
                name: 'updated_at',
                value: formdata.updated_at,
                passProps: {
                  state: 'isDisabled',
                },
              }, {
                label: 'Description',
                name: 'description',
                value: formdata.description,
              },
              ],
              right: [ {
                type: 'layout',
                value: {
                  component: 'div',
                  children: [ {
                    component: 'p',
                    props: {
                      style: {
                        fontStyle: 'italic',
                      },
                    },
                    children: 'The following fields will be extracted from the document and assigned to the following variables when the Document OCR process runs.',
                  },
                  ],
                },
              }, {
                type: 'layout',
                value: {
                  component: 'ResponsiveTable',
                  props: {
                    flattenRowData: true,
                    useInputRows: false,
                    addNewRows: false,
                    hasPagination: false,
                    headerLinkProps: {
                      style: {
                        textDecoration: 'none',
                      },
                    },
                    rows: inputs || [],
                    headers: [ {
                      label: 'Page',
                      sortid: 'display_page',
                      sortable: false,
                    }, {
                      label: 'Location',
                      sortid: 'display_location',
                      sortable: false,
                    }, {
                      label: 'Variable Assigned',
                      sortid: 'display_name',
                      sortable: false,
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

                          onClick: 'func:this.props.fetchAction',
                          onclickBaseUrl: `/optimization/api/documents/${formdata._id}/${page}/edit_variable/:input?edit=true`,
                          onclickLinkParams: [ { 'key': ':input', 'val': 'row_idx', }, ],
                          fetchProps: {
                            'method': 'GET',
                          },
                          successProps: {
                            success: {
                              notification: {
                                text: 'Changes saved successfully!',
                                timeout: 10000,
                                type: 'success',
                              },
                            },
                            successCallback: 'func:window.createAddOCRVariableModal',
                          },
                        },
                      }, {
                        passProps: {
                          buttonProps: {
                            icon: 'fa fa-trash',
                            color: 'isDanger',
                            className: '__icon_button',
                          },
                          onClick: 'func:this.props.fetchAction',
                          onclickBaseUrl: `/optimization/api/documents/${formdata._id}/${page}/delete_variable/:input?edit=true`,
                          onclickLinkParams: [ { 'key': ':input', 'val': 'row_idx', }, ],
                          fetchProps: {
                            'method': 'PUT',
                          },
                          successProps: {
                            success: {
                              notification: {
                                text: 'Changes saved successfully!',
                                timeout: 10000,
                                type: 'success',
                              },
                            },
                            successCallback: 'func:this.props.refresh',
                          },
                          confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
                            title: 'Delete Automated Processing Case',
                            textContent: [ {
                              component: 'p',
                              children: 'Do you want to delete this case?',
                              props: {
                                style: {
                                  textAlign: 'left',
                                  marginBottom: '1.5rem',
                                },
                              },
                            }, ],
                          }),
                        },
                      }, ],
                    }, ]
                  },
                },
              }, ],
            }),
            ],
          },
          ],
        },
      }, {
        component: 'ResponsiveForm',
        props: {
          'onSubmit': {
            url: `/optimization/api/documents/${formdata._id}/${page}/add_variable?`,
            'options': {
              'method': 'POST',
            },
            successCallback: 'func:window.createAddOCRVariableModal',
          },
          blockPageUI: true,
          useFormOptions: true,
          flattenFormData: true,
          footergroups: false,
          formgroups: [ {
            gridProps: {
              key: randomKey(),
            },
            card: {
              props: cardprops({
                cardTitle: 'Variable Selection',
              }),
            },
            formElements: [ {
              type: 'submit',
              value: 'Add Variable',
            }, {
              name: 'page_num',
              label: 'Page Number',
              type: 'dropdown',
              value: `/optimization/ocr/${formdata._id}/${page}`,
              passProps: {
                selection: true,
                fluid: true,
              },
              customOnChange: 'func:window.ocrDocumentPageOnChange',
              options: pageDropdown,
              layoutProps: {
              },
            }, {
              name: 'cropped',
              type: 'cropper',
              passProps: {
                includeFileInput: false,
                src: ocr_template_string || null,
                cropperProps: {
                  zoomable: false,
                  style: {
                    height: 1584,
                    width: 1224,
                  },
                  minCanvasWidth: 1224,
                  minCanvasHeight: 1584,
                  scalable: true,
                  movable: false,
                  autoCrop: false,
                }
              }
            }, ],
          },
          ],
        },
      },
      ],
    },
  ];
}

module.exports = generatePage;
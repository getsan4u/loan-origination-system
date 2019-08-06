'use strict';

const formGlobalButtonBar = require('../../shared/component/globalButtonBar').formGlobalButtonBar;
const cardprops = require('../../shared/props/cardprops');
const randomKey = Math.random;

function generatePDFViewer(options) {
  try {
    let { template, template_string, page, query, state, } = options;
    let pageDropdown = [];
    if (Array.isArray(template.images) && template.images.length) {
      let total = template.images.length;
      pageDropdown = template.images.map((file, idx) => ({
        label: `PAGE ${idx + 1} of ${total}`,
        value: `/los/others/templates/${template._id}/${idx}`,
      }));
    }
    return {
      component: 'ResponsiveForm',
      props: {
        'onSubmit': {
          'options': {
            'method': 'PUT',
          },
          successCallback: 'func:this.props.refresh',
        },
        blockPageUI: true,
        useFormOptions: true,
        flattenFormData: true,
        footergroups: false,
        validations: [],
        formgroups: [
          formGlobalButtonBar({
            left: [ {
              type: 'layout',
              layoutProps: {
                size: 'isNarrow',
                style: {
                  width: '30%',
                },
              },
              value: {
                component: 'ResponsiveButton',
                asyncprops: {
                  onclickPropObject: [ 'templatedata', 'template', ],
                },
                props: {
                  onClick: 'func:this.props.createModal',
                  onclickProps: {
                    title: 'Upload Template PDF',
                    pathname: `/los/templates/${template._id.toString()}/upload`,
                  },
                  style: {
                    paddingTop: 0,
                  },
                  buttonProps: {
                    color: 'isSuccess',
                    paddingTop: 0,
                    style: {
                      paddingTop: 0,
                    }
                  },
                },
                children: 'UPLOAD DOCUMENT TEMPLATE',
              },
            }, {
              type: 'dropdown',
              name: 'page_num',
              value: `/los/others/templates/${template._id}/${page}`,
              passProps: {
                style: {

                },
                selection: true,
                fluid: true,
                className: 'button-dropdown-success'
              },
              customOnChange: 'func:window.ocrDocumentPageOnChange',
              options: pageDropdown,
              layoutProps: {
                size: 'isNarrow',
              },
            }, 
            ],
            right: []
          }),
          {
            gridProps: {
              key: randomKey(),
              style: {
                width: '30%',
                display: 'inline-block',
                verticalAlign: 'top',
                margin: 0,
              }
            },
            formElements: [ {
              layoutProps: {
                style: {
                  padding: 0,
                  paddingRight: '15px',
                }
              },
              type: 'layout',
              value: {
                component: 'ResponsiveForm',
                props: {
                  'onSubmit': {
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
                  formgroups: [
                    {
                      gridProps: {
                        key: randomKey(),
                      },
                      card: {
                        props: cardprops({
                          cardTitle: 'Overview Information',
                          cardContentProps: {
                            style: {
                              paddingTop: 0,
                            }
                          }
                        }),
                      },
                      formElements: [
                        {
                          label: 'Document Template Name',
                          passProps: {
                            state: 'isDisabled',
                          },
                          name: 'name',
                          value: template.name,
                        }, {
                          label: 'Created',
                          name: 'createdat',
                          passProps: {
                            state: 'isDisabled',
                          },
                          value: template.createdat,
                        }, {
                          label: 'Updated',
                          name: 'updatedat',
                          passProps: {
                            state: 'isDisabled',
                          },
                          value: template.updatedat,
                        }
                      ],
                    },
                    {
                      gridProps: {
                        key: randomKey(),
                      },
                      card: {
                        props: cardprops({
                          cardTitle: 'Fillable Fields',
                          cardContentProps: {
                            style: {
                              paddingTop: 0,
                            }
                          }
                        }),
                      },
                      formElements: [
                        {
                          type: 'layout',
                          value: {
                            component: 'ResponsiveTable',
                            props: {
                              rows: template.field_info,
                              flattenRowData: true,
                              hasPagination: false,
                              headerLinkProps: {
                                style: {
                                  textDecoration: 'none',
                                },
                              },
                              headers: [ {
                                label: 'Fillable PDF Field',
                                sortid: 'name',
                                sortable: false,
                              }, ],
                            },
                          },
                        }
                      ],
                    },
                  ],
                },
              }
            }, ],
          },
          {
            gridProps: {
              key: randomKey(),
              style: {
                width: '70%',
                display: 'inline-block',
                verticalAlign: 'top',
                margin: 0,
              },
              subColumnProps: {
                style: {
                  padding: 0,
                }
              }
            },
            card: {
              props: cardprops({
                cardTitle: 'Document Template',
                cardContentProps: {
                  style: {
                    paddingTop: 0,
                  }
                }
              }),
            },

            formElements: [

              {
                name: 'location',
                type: 'cropper',
                layoutProps: {
                  style: {
                    overflow: 'auto',
                  }
                },
                passProps: {
                  includeFileInput: false,
                  src: template_string || null,
                  cropperProps: {
                    autoCrop: false,
                    dragMode: 'none',
                    zoomable: false,
                    style: {
                      width: 857,
                      height: 1109,
                      margin: 'auto',
                    },
                    minCanvasWidth: 857,
                    minCanvasHeight: 1109,
                    scalable: true,
                    movable: false,
                  }
                }
              }, ],
          },
        ],
      },
    };
  } catch (e) {
    return e;
  }
}

module.exports = generatePDFViewer;
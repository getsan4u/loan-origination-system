'use strict';
const moment = require('moment');
const capitalize = require('capitalize');
const ocrTabs = require('./ocrTabs');
const plainHeaderTitle = require('../../shared/component/layoutComponents').plainHeaderTitle;
const formGlobalButtonBar = require('../../shared/component/globalButtonBar').formGlobalButtonBar;
const styles = require('../../constants').styles;
const cardprops = require('../../shared/props/cardprops');
const formElements = require('../../shared/props/formElements').formElements;
const references = require('../../constants').references;
const randomKey = Math.random;

const data_type_map = {
  string: 'Text',
  number: 'Number',
};

function getStateSettings(options) {
  let { fields, state, query, } = options;
  let settings = {};
  if (state === 'edit') {
    let current_field = fields[ query.field ];
    settings.field_location = { height: current_field.h, width: current_field.w, x: current_field.x, y: current_field.y, };
    settings.field_name = current_field.name;
    settings.field_type = current_field.data_type;
    settings.autoCrop = true;
  } else {
    settings.field_location = null;
    settings.field_name = '';
    settings.field_type = 'string';
    settings.autoCrop = false;
  }
  return settings;
}

function generatePage(options) {
  try {
    let { doc, ocr_template_string, page, query, state, } = options;
    let user = doc.user;
    let formdata = doc;
    let display_state = ocr_template_string ? 'grid' : 'none';
    let fields = (doc.fields || []).map((fd, row_idx) => Object.assign({}, fd, { display_page: Number(fd.page) + 1, row_idx, edit_url: `${fd.page}?field=${row_idx}`, }));
    let page_fields = fields.filter(fd => Number(fd.page) === Number(page)).map(fd => Object.assign({}, fd, { formatted_name: `${fd.name} (${data_type_map[fd.data_type]})`, }));
    let { field_name, field_location, autoCrop, field_type, } = getStateSettings({ fields, state, query, });
    let pageDropdown = [];
    let submit_url = (state === 'edit') ? `/ocr/api/templates/${formdata._id}/${page}/fields?field=${query.field}` : `/ocr/api/templates/${formdata._id}/${page}/fields?`;
    let subtitle = `(last updated ${moment(doc.updated).format('YYYY/MM/DD')} by ${user.updater})`;
    if (doc.description) subtitle = `${doc.description} ${subtitle}`;
    if (Array.isArray(doc.files) && doc.files.length) {
      let total = doc.files.length;
      pageDropdown = doc.files.map((file, idx) => ({
        label: `PAGE ${idx + 1} of ${total}`,
        value: `/ocr/templates/${formdata._id}/${idx}`,
      }));
    }
    return [
      ocrTabs('templates'),
      plainHeaderTitle({
        title: [ {
          component: 'span',
          children: doc.name,
        },
        ],
        subtitle,
      }),
      styles.fullPageDivider,
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        children: [
          {
            component: 'Columns',
            children: [
              {
                component: 'Column',
                props: {
                  size: 'isThreeQuarter',
                },
                children: [ {
                  component: 'ResponsiveForm',
                  props: {
                    'onSubmit': {
                      url: submit_url,
                      'options': {
                        'method': 'PUT',
                      },
                      successCallback: 'func:this.props.refresh',
                    },
                    blockPageUI: true,
                    useFormOptions: true,
                    flattenFormData: true,
                    footergroups: false,
                    validations: [  {
                      'name': 'field_name',
                      'constraints': {
                        'field_name': {
                          'presence': {
                            'message': '^Please enter a field name.',
                          },
                        },
                      },
                    }],
                    formgroups: [
                      formGlobalButtonBar({
                        left: [ {
                          type: 'layout',
                          layoutProps: {
                            size: 'isNarrow',
                          },
                          value: {
                            component: 'ResponsiveButton',
                            props: {
                              onClick: 'func:this.props.createModal',
                              onclickProps: {
                                title: 'Upload Sample PDF Document',
                                pathname: `/ocr/templates/${formdata._id}/upload_template`,
                              },
                              buttonProps: {
                                color: 'isSuccess',
                              },
                            },
                            children: 'UPLOAD SAMPLE PDF DOCUMENT',
                          },
                        }, {
                          type: 'dropdown',
                          name: 'page_num',
                          value: `/ocr/templates/${formdata._id}/${page}`,
                          passProps: {
                            style: {
                              display: display_state,
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
                        right: [{
                          name: 'field_name',
                          placeholder: 'Field Name...',
                          value: field_name,
                          type: 'text',
                          'validateOnBlur': true,
                          'errorIconRight': true,
                          'errorIcon': 'fa fa-exclamation',
                          passProps: {
                            style: {
                              display: display_state,
                            },
                          },
                        }, {
                          name: 'field_type',
                          type: 'dropdown',
                          passProps: {
                            style: {
                              display: display_state,
                              height: '36px',
                            },
                            selection: true,
                            fluid: true,
                          },
                          value: field_type,
                          // validateOnChange: true,
                          // errorIconRight: true,
                          // errorIcon: 'fa fa-exclamation',
                          options: [ {
                            label: 'Text',
                            value: 'string',
                          }, {
                            label: 'Number',
                            value: 'number',
                          } ],
                        },  {
                          type: 'submit',
                          layoutProps: {
                            size: 'isNarrow',
                          },
                          value: 'SAVE FIELD',
                          'passProps': {
                            'color': 'isPrimary',
                            style: {
                              display: display_state,
                            },
                          },
                        }, {
                          guideButton: true,
                            location: references.guideLinks.vision.templates,
                        } ]
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
                                url: `/ocr/api/templates/${formdata._id}?type=ocrdocument&update=description`,
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
                              formgroups: [
                                {
                                  gridProps: {
                                    key: randomKey(),
                                  },
                                  card: {
                                    props: cardprops({
                                      cardTitle: 'Fields to Extract',
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
                                          flattenRowData: true,
                                          useInputRows: false,
                                          addNewRows: false,
                                          hasPagination: false,
                                          headerLinkProps: {
                                            style: {
                                              textDecoration: 'none',
                                            },
                                          },
                                          rows: page_fields || [],
                                          headers: [ {
                                            label: 'Field Name',
                                            sortid: 'formatted_name',
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
                                                onClick: 'func:this.props.reduxRouter.push',
                                                onclickBaseUrl: `/ocr/templates/${formdata._id}/:edit`,
                                                onclickLinkParams: [ { 'key': ':edit', 'val': 'edit_url', }, ],
                                              },
                                            }, {
                                              passProps: {
                                                buttonProps: {
                                                  icon: 'fa fa-trash',
                                                  color: 'isDanger',
                                                  className: '__icon_button',
                                                },
                                                onClick: 'func:this.props.fetchAction',
                                                onclickBaseUrl: `/ocr/api/templates/${formdata._id}/${page}/fields/:idx?`,
                                                onclickLinkParams: [ { 'key': ':idx', 'val': 'row_idx', }, ],
                                                fetchProps: {
                                                  'method': 'DELETE',
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
                                                // confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
                                                //   title: 'Delete Automated Processing Case',
                                                //   textContent: [ {
                                                //     component: 'p',
                                                //     children: 'Do you want to delete this case?',
                                                //     props: {
                                                //       style: {
                                                //         textAlign: 'left',
                                                //         marginBottom: '1.5rem',
                                                //       },
                                                //     },
                                                //   }, ],
                                                // }),
                                              },
                                            }, ],
                                          }, ]
                                        },
                                      },
                                    },

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
                            cardTitle: 'Field Selection',
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
                            layoutProps: {
                              style: {
                                padding: 0,
                              }
                            },
                            value: {
                              component: 'span',
                              children: 'Please upload a sample document to begin creating your template.',
                              props: {
                                style: {
                                  display: (ocr_template_string) ? 'none' : 'block',
                                  fontStyle: 'italic',
                                  marginLeft: '2px',
                                  fontWeight: 'normal',
                                  color: '#969696',
                                  padding: '10px 0',
                                }
                              }
                            },
                          },
                          {
                            name: 'location',
                            type: 'cropper',
                            layoutProps: {
                              style: {
                                overflow: 'auto',
                              }
                            },
                            value: field_location? JSON.stringify(field_location) : '{"height": 0, "width": 0, "x": 0, "y": 0}',
                            passProps: {
                              includeFileInput: false,
                              src: ocr_template_string || null,
                              cropperProps: {
                                zoomable: false,
                                style: {
                                  // height: 1188,
                                  // width: 918,
                                  width: 857,
                                  height: 1109,
                                },
                                // minCanvasWidth: 918,
                                // minCanvasHeight: 1188,
                                minCanvasWidth: 857,
                                minCanvasHeight: 1109,
                                scalable: true,
                                movable: false,
                                autoCrop,
                              }
                            }
                          }, ],
                      },
                    ],
                  },
                }, ]
              },
            ],
          },
        ]
      } ];
  } catch (e) {
    console.log({ e })
  }
}

module.exports = generatePage;
'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../utilities');
const cardprops = utilities.views.shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const simpleAsyncHeaderTitle = utilities.views.shared.component.layoutComponents.simpleAsyncHeaderTitle;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const losTabs = utilities.views.los.components.losTabs;
const applicationsTabs = utilities.views.los.components.applicationsTabs;
const notes = utilities.views.los.components.notes;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/los/applications/:id/docs': {
      layout: {
        component: 'div',
        privileges: [ 101, 102, 103, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          losTabs('Applications'),
          {
            component: 'Container',
            children: [ {
              component: 'Columns',
              props: {
                style: {
                  marginTop: '10px',
                  marginBottom: '10px'
                }
              },
              children: [ {
                component: 'Column',
                children: [ {
                  component: 'Title',
                  props: {
                    size: 'is3',
                    style: {
                      fontWeight: 600,
                    },
                  },
                  children: [ {
                    component: 'ResponsiveButton',
                    asyncprops: {
                      onclickPropObject: [ 'applicationdata', 'application' ],
                    },
                    props: {
                      onClick: 'func:this.props.createModal',
                      onclickProps: {
                        title: 'Edit Application Detail',
                        pathname: '/los/applications/edit/:id',
                        params: [ {
                          key: ':id',
                          val: '_id',
                        }, ],
                      },
                      spanProps: {
                        className: '__ra_rb button_page_title',
                      },
                      style: {
                        marginRight: '10px',
                      }
                    },
                    children: [ {
                      component: 'span',
                      asyncprops: {
                        children: [ 'applicationdata', 'data', 'display_title' ],
                      },
                    }, ]
                  }, {
                    component: 'div',
                    props: {
                      style: {
                        display: 'inline',
                      }
                    },
                    asyncprops: {
                      _children: [ 'applicationdata', 'labelFormatted' ],
                    },
                  } ]
                }, ]
              } ]
            } ]
          },
          applicationsTabs('docs'),
          plainGlobalButtonBar({
            left: [ {
              component: 'ResponsiveButton',
              asyncprops: {
                onclickPropObject: [ 'applicationdata', 'application' ],
              },
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  title: 'Upload Document',
                  pathname: '/los/applications/:id/upload_doc',
                  params: [ { key: ':id', val: '_id', }, ],
                },
                buttonProps: {
                  color: 'isSuccess',
                },
              },
              children: 'UPLOAD DOCUMENT',
            }, {
              component: 'ResponsiveButton',
              asyncprops: {
                onclickPropObject: [ 'applicationdata', 'application' ],
              },
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  title: 'Generate Document',
                  pathname: '/los/applications/:id/select_template',
                  params: [ { key: ':id', val: '_id', }, ],
                },
                buttonProps: {
                  color: 'isSuccess',
                },
              },
              children: 'GENERATE DOCUMENT',
            }, {
              component: 'ResponsiveButton',
              asyncprops: {
                onclickPropObject: [ 'applicationdata', 'application' ],
              },
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  title: 'Create Folder',
                  pathname: '/los/applications/:id/create_folder',
                  params: [ { key: ':id', val: '_id', }, ],
                },
                buttonProps: {
                  color: 'isSuccess',
                },
              },
              children: 'CREATE FOLDER',
            },
            {
              component: 'ResponsiveButton',
              asyncprops: {
                onclickPropObject: [ 'applicationdata', 'application' ],
                showDocuSign: [ 'applicationdata', 'showDocusign' ],
              },
              comparisonprops: [ {
                left: [ 'showDocuSign', ],
                operation: 'eq',
                right: true,
              }, ],
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  title: 'Send DocuSign for Electric Signature',
                  pathname: '/los/docusign/select_template',
                },
                buttonProps: {
                  className: 'docusign-btn',
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
              },
              children: [{
                component: 'span',
                props: {
                  className: 'visibility-hidden',
                },
                children: 'Run DocuSign',
              }, ]
            },
            ],
            right: [],
          }),
          {
            component: 'Container',
            props: {
              style: {},
            },
            children: [ {
              component: 'ResponsiveCard',
              props: cardprops({
                cardTitle: 'Documents',
                cardStyle: {
                  marginBottom: 0,
                },
              }),
              children: [ {
                component: 'Semantic.Breadcrumb',
                props: {
                  style: {
                    marginBottom: '1.5rem'
                  }
                },
                asyncprops: {
                  _children: [ 'applicationdata', 'breadCrumbSection' ],
                },
              }, {
                component: 'ResponsiveTable',
                asyncprops: {
                  rows: [ 'applicationdata', 'rows', ],
                  numItems: [ 'applicationdata', 'numItems', ],
                  numPages: [ 'applicationdata', 'numPages', ],
                  baseUrl: [ 'applicationdata', 'baseUrl', ],
                },
                props: {
                  useRowProps: true,
                  label: ' ',
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
                  limit: 50,
                  hasPagination: true,
                  simplePagination: true,
                  calculatePagination: true,
                  flattenRowData: true,
                  useInputRows: false,
                  addNewRows: false,
                  'tableSearch': true,
                  'simpleSearchFilter': true,
                  filterSearchProps: {
                    icon: 'fa fa-search',
                    hasIconRight: false,
                    className: 'global-table-search',
                    placeholder: 'SEARCH DOCUMENTS',
                  },
                  ignoreTableHeaders: [ '_id', ],
                  headers: [ {
                    label: '',
                    sortid: 'icon',
                    sortable: false,
                    headerColumnProps: {
                      style: {
                        width: '40px',
                      },
                    },
                  }, {
                    label: 'Name',
                    sortid: 'name',
                    sortable: true,
                  }, {
                    label: 'Type',
                    sortid: 'doc_type',
                    sortable: true,
                    value: ' ',
                  }, {
                    label: 'Size',
                    sortid: 'filesize',
                    sortable: true,
                    headerColumnProps: {
                      style: {
                        width: '10%',
                      },
                    },
                    columnProps: {
                      style: {
                      },
                    },
                  }, {
                    label: 'Updated',
                    sortid: 'updatedat',
                    sortable: true,
                    headerColumnProps: {
                      style: {
                        width: '20%',
                      },
                    },
                    columnProps: {
                      style: {
                      },
                    },
                  },
                  {
                    label: ' ',
                    headerColumnProps: {
                      style: {
                        width: '160px',
                      },
                    },
                    columnProps: {
                      style: {
                        whiteSpace: 'nowrap',
                        textAlign: 'right',
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
                          title: 'Edit Document',
                          pathname: '/los/docs/:id/edit_file/:application_id',
                          params: [ { key: ':id', val: '_id', }, { key: ':application_id', val: 'application', } ],
                        },
                      }
                    },
                    {
                      passProps: {
                        aProps: {
                          className: '__re-bulma_button __icon_button green',
                          style: {
                          },
                        },
                        onclickBaseUrl: '/los/api/docs/:id/download_doc',
                        onclickLinkParams: [ { key: ':id', val: '_id' } ],
                      },
                      children: [ {
                        component: 'Icon',
                        props: {
                          icon: 'fa fa-download',
                        }
                      } ]
                    }, {
                      passProps: {
                        buttonProps: {
                          icon: 'fa fa-trash',
                          color: 'isDanger',
                          className: '__icon_button',
                        },
                        onClick: 'func:this.props.fetchAction',
                        onclickBaseUrl: '/los/api/docs/:id',
                        onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                        fetchProps: {
                          method: 'DELETE',
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
                          title: 'Delete Document',
                          textContent: [ {
                            component: 'p',
                            children: 'Do you want to delete this document?',
                            props: {
                              style: {
                                textAlign: 'left',
                                marginBottom: '1.5rem',
                              },
                            },
                          },
                          ],
                        }),
                      },
                    }, ],
                  },
                  ],
                },
              }, ],
            },
              // notes,
            ],
          },
        ],
      },
      resources: {
        notedata: '/los/api/applications/:id/notes',
        applicationdata: '/los/api/applications/:id/docs',
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
      callbacks: [ 'func:window.setHeaders', 'func:window.updateGlobalSearchBar', ],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Lending CRM',
        navLabel: 'Lending CRM',
      },
    },
  },
};
'use strict';

const utilities = require('../../../../utilities');
const shared = utilities.views.shared;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const ocrTabs = utilities.views.ocr.components.ocrTabs;

module.exports = {
  containers: {
    '/ocr/templates': {
      layout: {
        component: 'div',
        privileges: [ 101, 102,],
        props: {
          style: styles.pageContainer,
        },
        children: [
          ocrTabs('templates'),
          plainHeaderTitle({
            title: 'Text Recognition Templates',
            subtitle: 'Create reusable templates from sample documents',
          }),
          styles.fullPageDivider,
          plainGlobalButtonBar({
            left: [ {
              component: 'ResponsiveButton',
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  title: 'Create New Template',
                  pathname: '/ocr/create_template',
                },
                buttonProps: {
                  color: 'isSuccess',
                },
              },
              children: 'CREATE NEW TEMPLATE',
            }],
            right: [ {
              component: 'ResponsiveButton',
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  title: 'Tutorial – OCR Text Recognition',
                  pathname: '/ocr/tutorial',
                },
                buttonProps: {
                  color: 'isPrimary',
                },
              },
              children: 'TUTORIAL',
            }, {
              guideButton: true,
              location: references.guideLinks.vision.templates,
            },
            ],
          }),
          {
            component: 'Container',
            props: {
              style: {},
            },
            children: [ {
              component: 'ResponsiveCard',
              props: cardprops({
                headerStyle: {
                  display: 'none',
                },
              }),
              children: [ {
                component: 'ResponsiveTable',
                asyncprops: {
                  rows: [ 'templatedata', 'rows', ],
                  numItems: [ 'templatedata', 'numItems', ],
                  numPages: [ 'templatedata', 'numPages', ],
                },
                props: {
                  label: ' ',
                  calculatePagination: true,
                  limit: 10,
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
                  'tableSearch': true,
                  'simpleSearchFilter': true,
                  filterSearchProps: {
                    icon: 'fa fa-search',
                    hasIconRight: false,
                    className: 'global-table-search',
                    placeholder: 'SEARCH',
                  },
                  'flattenRowData': true,
                  'addNewRows': false,
                  'rowButtons': false,
                  'useInputRows': true,
                  simplePagination: true,
                  hasPagination: true,
                  baseUrl: '/ocr/api/templates?format=json',
                  passProps: {
                    disableSort: true,
                    tableWrappingStyle: {
                      overflow: 'visible',
                    },
                  },
                  'sortable': false,
                  'ignoreTableHeaders': [ 'id', ],
                  headers: [ {
                    label: 'Template Name',
                    sortid: 'name',
                    sortable: false,
                    headerColumnProps: {
                      style: {
                        width: '20%',
                      },
                    },
                    columnProps: {},
                  }, {
                    label: 'Last Updated',
                    sortid: 'updatedat',
                    sortable: false,
                    headerColumnProps: {
                      style: {
                        width: '15%',
                      },
                    },
                    columnProps: {},
                  }, {
                    label: 'Description',
                    sortid: 'description',
                    sortable: false,
                    headerColumnProps: {
                      style: {
                        width: '20%',
                      },
                    },
                  }, {
                    label: ' ',
                    headerColumnProps: {
                      style: {
                        width: '45px',
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
                        // onclickBaseUrl: '/optimization/ocr/:id/0',
                        onclickBaseUrl: '/ocr/templates/:id/0',
                        onclickLinkParams: [ { 'key': ':id', 'val': '_id', },
                        ],
                      },
                    }, {
                      passProps: {
                        buttonProps: {
                          icon: 'fa fa-trash',
                          color: 'isDanger',
                          className: '__icon_button',
                        },
                        onClick: 'func:this.props.fetchAction',
                        onclickBaseUrl: '/ocr/api/templates/:id',
                        onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                        fetchProps: {
                          method: 'DELETE',
                        },
                        successProps: {
                          successCallback: 'func:this.props.refresh',
                          success: {
                            notification: {
                              text: 'Changes saved successfully!',
                              timeout: 10000,
                              type: 'success',
                            },
                          },
                        },
                        confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
                          title: 'Delete Template',
                          textContent: [ {
                            component: 'p',
                            children: 'Do you want to delete this template?',
                            props: {
                              style: {
                                textAlign: 'left',
                                marginBottom: '1.5rem',
                              },
                            },
                          }, ],
                        }),
                      },
                    },
                    ],
                  },
                  ],
                },
              }, ],
            }, ],
          },
        ],
      },
      resources: {
        templatedata: '/ocr/api/templates?',
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
      'callbacks': 'func:window.updateGlobalSearchBar',
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | OCR Text Recognition',
        navLabel: 'OCR Text Recognition',
      },
    },
  },
};
'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../../utilities');
const cardprops = utilities.views.shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const buttonAsyncHeaderTitle = utilities.views.shared.component.layoutComponents.buttonAsyncHeaderTitle;
const losTabs = utilities.views.los.components.losTabs;
const peopleTabs = utilities.views.los.components.peopleTabs;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/los/people/:id/docs': {
      layout: {
        component: 'div',
        privileges: [ 101, 102, 103, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          losTabs('Customers'),
          buttonAsyncHeaderTitle({
            type: 'people',
            title: true,
          }, {
              component: 'ResponsiveButton',
              props: {
                onclickProps: {
                  title: 'Edit Name',
                  pathname: '/los/people/:id/rename',
                  params: [ {
                    key: ':id',
                    val: '_id',
                  }, ],
                },
                onClick: 'func:this.props.createModal',
                spanProps: {
                  className: '__ra_rb button_page_title'
                },
              },
              asyncprops: {
                onclickPropObject: [ 'peopledata', 'person' ],
                children: [ 'peopledata', 'person', 'name' ],
              },
            }),
          peopleTabs('docs'),
          plainGlobalButtonBar({
            left: [ {
              component: 'ResponsiveButton',
              asyncprops: {
              },
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  title: 'Upload Document',
                  pathname: '/los/upload_doc/person',
                },
                buttonProps: {
                  color: 'isSuccess',
                },
              },
              children: 'UPLOAD DOCUMENT',
            }, ],
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
                cardStyle: {
                  marginBottom: 0,
                },
                cardTitle: 'Documents',
              }),
              children: [ {
                component: 'ResponsiveTable',
                asyncprops: {
                  rows: [ 'peopledata', 'rows', ],
                  numItems: [ 'peopledata', 'numItems', ],
                  numPages: [ 'peopledata', 'numPages', ],
                  baseUrl: [ 'peopledata', 'baseUrl', ],
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
                    label: 'Application',
                    sortid: 'application.title',
                    sortable: false,
                    value: ' ',
                    link: {
                      baseUrl: '/los/applications/:id',
                      params: [
                        {
                          key: ':id',
                          val: 'application._id',
                        },
                      ],
                    },
                    linkProps: {
                      style: {
                      },
                    },
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
                        width: '15%',
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
                        width: '15%',
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
                          pathname: '/los/docs/:id',
                          params: [ { key: ':id', val: '_id', }, ],
                        },
                      }
                    }, {
                      passProps: {
                        aProps: {
                          className: '__re-bulma_button __icon_button',
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
            }, ],
          },
        ],
      },
      resources: {
        peopledata: '/los/api/customers/people/:id/docs?',
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
      callbacks: [ 'func:window.updateGlobalSearchBar', ],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Lending CRM',
        navLabel: 'Lending CRM',
      },
    },
  },
};
'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../utilities');
const cardprops = utilities.views.shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const losTabs = utilities.views.los.components.losTabs;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/los/others/communications': {
      layout: {
        component: 'div',
        privileges: [ 101, 102, 103 ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          losTabs('Other'),
          {
            component: 'div',
            props: {
              style: {
                margin: '1rem 0px 1.5rem'
              }
            }
          },
          plainGlobalButtonBar({
            left: [ {
              component: 'ResponsiveButton',
              asyncprops: {
                onclickPropObject: [ 'communicationdata', 'application' ],
              },
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  title: 'Add Communication',
                  pathname: '/los/communications/new',
                  params: [ { key: ':id', val: '_id', }, ],
                },
                buttonProps: {
                  color: 'isSuccess',
                },
              },
              children: 'ADD COMMUNICATION',
            }, ],
            right: [ 
            //   {
            //   component: 'Semantic.Dropdown',
            //   asyncprops: {
            //     privilege_id: [ 'checkdata', 'permissionCode', ],
            //   },
            //   comparisonorprops: true,
            //   comparisonprops: [ {
            //     left: [ 'privilege_id' ],
            //     operation: 'eq',
            //     right: 101,
            //   }, {
            //     left: [ 'privilege_id' ],
            //     operation: 'eq',
            //     right: 102,
            //   } ],
            //   props: {
            //     className: '__re-bulma_button __re-bulma_is-primary',
            //     text: 'DOWNLOAD',
            //   },
            //   children: [ {
            //     component: 'Semantic.DropdownMenu',
            //     children: [ {
            //       component: 'Semantic.Item',
            //       children: [ {
            //         component: 'ResponsiveButton',
            //         children: 'CREATE NEW',
            //         asyncprops: {
            //           buttondata: [ 'strategydata', 'data', ],
            //         },
            //         props: {
            //           onclickThisProp: [ 'buttondata', ],
            //           onClick: 'func:this.props.createModal',
            //           onclickProps: {
            //             pathname: '/decision/strategies/:id/add_decision_module',
            //             params: [ { 'key': ':id', 'val': '_id', }, ],
            //             title: 'Create New Process Module',
            //           },
            //         },
            //       }, ],
            //     }, {
            //       component: 'Semantic.Item',
            //       children: [ {
            //         component: 'ResponsiveButton',
            //         asyncprops: {
            //           buttondata: [ 'strategydata', 'data', ],
            //         },
            //         props: {
            //           onclickThisProp: [ 'buttondata', ],
            //           onclickProps: {
            //             title: 'Copy Existing Process Module',
            //             pathname: '/decision/strategies/:id/add_existing_decision_module',
            //             params: [ { key: ':id', val: '_id', }, ],
            //           },
            //           onClick: 'func:this.props.createModal',
            //         },
            //         children: 'COPY EXISTING',
            //       }, ],
            //     }, ],
            //   }, ],
            // }, 
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
                cardTitle: 'Communications',
              }),
              children: [ {
                component: 'ResponsiveTable',
                asyncprops: {
                  rows: [ 'communicationdata', 'rows', ],
                  numItems: [ 'communicationdata', 'numItems', ],
                  numPages: [ 'communicationdata', 'numPages', ],
                  filterButtons: [ 'communicationdata', 'filterButtons' ]
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
                  filterSearch: true,
                  simplePagination: true,
                  useHeaderFilters: true,
                  hasPagination: true,
                  calculatePagination: true,
                  baseUrl: '/los/api/communications?paginate=true',
                  flattenRowData: true,
                  useInputRows: true,
                  addNewRows: false,
                  'tableSearch': true,
                  'simpleSearchFilter': true,
                  filterSearchProps: {
                    icon: 'fa fa-search',
                    hasIconRight: false,
                    className: 'global-table-search',
                    placeholder: 'SEARCH COMMUNICATIONS',
                  },
                  ignoreTableHeaders: [ '_id', ],
                  headers: [ {
                    label: 'Date',
                    sortid: 'date',
                    sortable: true,
                    value: ' ',
                  }, {
                    label: 'Type',
                    sortid: 'type',
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
                    label: 'Team Members',
                    sortid: 'team_members',
                    sortable: false,
                  }, {
                    label: 'People',
                    sortid: 'people',
                    sortable: false,
                  }, {
                    label: 'Subject',
                    sortid: 'subject',
                    sortable: true,
                  },
                  {
                    label: ' ',
                    headerColumnProps: {
                      style: {
                        width: '80px',
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
                          title: 'Edit Communication',
                          pathname: '/los/communications/:id',
                          params: [ { 'key': ':id', 'val': '_id', }, ],
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
                        onclickBaseUrl: '/los/api/communications/:id',
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
                          title: 'Delete Communication',
                          textContent: [ {
                            component: 'p',
                            children: 'Do you want to delete this communication?',
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
        communicationdata: '/los/api/communications?paginate=true',
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
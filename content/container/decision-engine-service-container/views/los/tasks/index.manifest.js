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
    '/los/tasks': {
      layout: {
        component: 'div',
        privileges: [ 101, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          losTabs('tasks'),
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
                onclickPropObject: [ 'taskdata', 'application' ],
              },
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  title: 'Create Task',
                  pathname: '/los/tasks/new',
                  params: [ { key: ':id', val: '_id', }, ],
                },
                buttonProps: {
                  color: 'isSuccess',
                },
              },
              children: 'CREATE TASK',
            },],
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
                headerStyle: {
                  display: 'none',
                }
              }),
              children: [ {
                component: 'ResponsiveTable',
                asyncprops: {
                  rows: [ 'taskdata', 'rows', ],
                  numItems: [ 'taskdata', 'numItems', ],
                  numPages: [ 'taskdata', 'numPages', ],
                  filterButtons: [ 'taskdata', 'filterButtons' ],
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
                  baseUrl: '/los/api/tasks?paginate=true',
                  flattenRowData: true,
                  useInputRows: true,
                  addNewRows: false,
                  'tableSearch': true,
                  'simpleSearchFilter': true,
                  filterSearchProps: {
                    icon: 'fa fa-search',
                    hasIconRight: false,
                    className: 'global-table-search',
                    placeholder: 'SEARCH TASKS',
                  },
                  ignoreTableHeaders: [ '_id', ],
                  headers: [ {
                    label: 'Done',
                    formtype: 'checkbox',
                    sortid: 'done',
                    passProps: {
                      style: {
                        pointerEvents: 'none',
                      },
                    },
                    sortable: true,
                  }, {
                    label: 'Description',
                    sortid: 'description',
                    sortable: true,
                    value: ' ',
                  }, {
                    label: 'Team Members',
                    sortid: 'team_members',
                    sortable: false,
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
                    label: 'Application',
                    sortid: 'application',
                    sortable: false,
                    link: {
                      baseUrl: '/los/applications/:id',
                      params: [
                        {
                          key: ':id',
                          val: 'application_id',
                        },
                      ],
                    },
                    linkProps: {
                      style: {
                      },
                    },
                  }, {
                    label: 'Company',
                    sortid: 'company',
                    sortable: false,
                    link: {
                      baseUrl: '/los/companies/:id',
                      params: [
                        {
                          key: ':id',
                          val: 'company_id',
                        },
                      ],
                    },
                    linkProps: {
                      style: {
                      },
                    },
                  }, {
                    label: 'People',
                    sortid: 'people',
                    sortable: false,
                  }, {
                    label: 'Date Due',
                    sortid: 'due_date',
                    sortable: true,
                  },
                  {
                    label: ' ',
                    headerColumnProps: {
                      style: {
                      },
                    },
                    columnProps: {
                      className: 'task-buttons',
                      style: {
                        whiteSpace: 'nowrap',
                        textAlign: 'right',
                      },
                    },
                    buttons: [ {
                      passProps: {
                        buttonProps: {
                          icon: 'fa fa-check',
                          className: '__icon_button task-complete-button green',
                        },
                        onClick: 'func:this.props.fetchAction',
                        onclickBaseUrl: '/los/api/tasks/:id?done=true',
                        onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                        fetchProps: {
                          method: 'PUT',
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
                    }, {
                      passProps: {
                        buttonProps: {
                          icon: 'fa fa-pencil',
                          className: '__icon_button',
                        },
                        onClick: 'func:this.props.createModal',
                        onclickProps: {
                          title: 'Edit Task',
                          pathname: '/los/tasks/:id',
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
                        onclickBaseUrl: '/los/api/tasks/:id',
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
                          title: 'Delete Task',
                          textContent: [ {
                            component: 'p',
                            children: 'Do you want to delete this task?',
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
              },  ],
            }, ],
          },
        ],
      },
      resources: {
        taskdata: '/los/api/tasks?paginate=true&headerFilters=done%3Dtoday',
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
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
    '/los/applications/:id/tasks': {
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
            children: [{
              component: 'Columns',
              props: {
                style: {
                  marginTop: '10px',
                  marginBottom: '10px'
                }
              },
              children: [{
                component: 'Column',
                children: [{
                  component: 'Title',
                  props: {
                    size: 'is3',
                    style: {
                      fontWeight: 600,
                    },
                  },
                  children: [{
                    component: 'ResponsiveButton',
                    asyncprops: {
                      onclickPropObject: ['applicationdata', 'application'],
                    },
                    props: {
                      onClick: 'func:this.props.createModal',
                      onclickProps: {
                        title: 'Edit Application Detail',
                        pathname: '/los/applications/edit/:id',
                        params: [{
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
                    children: [{
                      component: 'span',
                      asyncprops: {
                        children: ['applicationdata', 'data', 'display_title'],
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
                      _children: ['applicationdata', 'labelFormatted'],
                    },
                  }]
                }, ]
              }]
            }]
          },
          applicationsTabs('tasks'),
          plainGlobalButtonBar({
            left: [ {
              component: 'ResponsiveButton',
              asyncprops: {
                onclickPropObject: [ 'applicationdata', 'application' ],
              },
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  title: 'Create Task',
                  pathname: '/los/tasks/new',
                },
                buttonProps: {
                  color: 'isSuccess',
                },
              },
              children: 'CREATE TASK',
            }, ],
            right: [ ],
          }),
          {
            component: 'Container',
            props: {
              style: {},
            },
            children: [ {
              component: 'ResponsiveCard',
              props: cardprops({
                cardTitle: 'Tasks',
                cardStyle: {
                  marginBottom: 0,
                },
              }),
              children: [ {
                component: 'ResponsiveTable',
                asyncprops: {
                  rows: [ 'applicationdata', 'rows', ],
                  numItems: [ 'applicationdata', 'numItems', ],
                  numPages: [ 'applicationdata', 'numPages', ],
                  baseUrl: [ 'applicationdata', 'baseUrl' ],
                  filterButtons: [ 'applicationdata', 'filterButtons' ],
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
                    sortable: true,
                    passProps: {
                      style: {
                        pointerEvents: 'none',
                      },
                    },
                  }, {
                    label: 'Description',
                    sortid: 'description',
                    sortable: true,
                    value: ' ',
                  },
                  {
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
              }, ],
            },
              // notes,
            ],
          },
        ],
      },
      resources: {
        notedata: '/los/api/applications/:id/notes',
        applicationdata: '/los/api/applications/:id/tasks?paginate=true&headerFilters=done%3Dtoday',
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
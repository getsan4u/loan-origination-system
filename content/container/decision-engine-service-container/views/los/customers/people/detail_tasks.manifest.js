'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../../utilities');
const cardprops = utilities.views.shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const buttonAsyncHeaderTitle = utilities.views.shared.component.layoutComponents.buttonAsyncHeaderTitle;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const losTabs = utilities.views.los.components.losTabs;
const peopleTabs = utilities.views.los.components.peopleTabs;
const peopleNotes = utilities.views.los.components.peopleNotes;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/los/people/:id/tasks': {
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
                params: [{
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
              onclickPropObject: ['peopledata', 'person'],
              children: ['peopledata', 'data', 'display_title'],
            },
          }),
          peopleTabs('tasks'),
          plainGlobalButtonBar({
            left: [ {
              component: 'ResponsiveButton',
              asyncprops: {
                onclickPropObject: [ 'peopledata', 'person' ],
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
                  rows: [ 'peopledata', 'rows', ],
                  numItems: [ 'peopledata', 'numItems', ],
                  numPages: [ 'peopledata', 'numPages', ],
                  baseUrl: [ 'peopledata', 'baseUrl', ],
                  filterButtons: [ 'peopledata', 'filterButtons' ],
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
                  },  {
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
                        onclickBaseUrl: '/ml/api/models/:id',
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
                          title: 'Delete Model',
                          textContent: [ {
                            component: 'p',
                            children: 'Do you want to delete this model?',
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
              // peopleNotes
            ],
          },
        ],
      },
      resources: {
        notedata: '/los/api/customers/:id/notes?entity_type=person',
        peopledata: '/los/api/customers/people/:id/tasks?paginate=true&headerFilters=done%3Dtoday',
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
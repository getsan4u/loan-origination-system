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
    '/los/taskbots': {
      layout: {
        component: 'div',
        privileges: [ 101, 102, 103, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          losTabs('Task Bots'),
          {
            component: 'div',
            props: {
              style: {
                margin: '1rem 0px 1.5rem'
              }
            }
          },
          plainGlobalButtonBar({
            left: [{
              component: 'ResponsiveButton',
              children: 'ADD TASK BOT',
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  pathname: '/los/taskbots/new',
                  title: 'Add Task Bot',
                },
                buttonProps: {
                  color: 'isSuccess',
                },
              },
            }, ],
            right: [],
          }),
          {
            component: 'Container',
            props: {
              style: {},
            },
            children: [{
              component: 'ResponsiveCard',
              props: cardprops({
                headerStyle: {
                  display: 'none',
                },
              }),
              children: [{
                component: 'ResponsiveTable',
                props: {
                  flattenRowData: true,
                  limit: 50,
                  dataMap: [ {
                    'key': 'rows',
                    value: 'rows',
                  }, {
                    'key': 'numItems',
                    value: 'numItems',
                  }, {
                    'key': 'numPages',
                    value: 'numPages',
                  } ],
                  calculatePagination: true,
                  hasPagination: true,
                  simplePagination: true,
                  baseUrl: '/los/api/taskbots?paginate=true',
                  'tableSearch': true,
                  useInputRows: true,
                  'simpleSearchFilter': true,
                  filterSearchProps: {
                    icon: 'fa fa-search',
                    hasIconRight: false,
                    className: 'global-table-search',
                    placeholder: 'SEARCH TASK BOTS',
                  },
                  headers: [
                    {
                      label: 'Bot Name',
                      sortid: 'name',
                      sortable: true,
                      link: {
                        baseUrl: '/los/taskbots/:id',
                        params: [
                          {
                            key: ':id',
                            val: '_id',
                          },
                        ],
                      },
                      linkProps: {
                      },
                    },
                    {
                      label: 'Description',
                      headerColumnProps: {
                        style: {
                          // width: '8%'
                        },
                      },
                      sortid: 'description',
                      sortable: true,
                    }, {
                      label: 'Last Ran',
                      sortid: 'lastran',
                      sortable: false,
                    }, {
                      label: 'Date Updated',
                      sortid: 'updatedat',
                      sortable: false,
                    }, {
                      label: 'Status',
                      sortid: 'active',
                      sortable: false,
                    },],
                  headerLinkProps: {
                    style: {
                      textDecoration: 'none',
                    },
                  },
                },
                asyncprops: {
                  rows: [ 'taskbotdata', 'rows', ],
                  numItems: [ 'taskbotdata', 'numItems', ],
                  numPages: [ 'taskbotdata', 'numPages', ],
                },
              } ],
            }, ],
          },
        ],
      },
      resources: {
        taskbotdata: '/los/api/taskbots?paginate=true',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      callbacks: ['func:window.updateGlobalSearchBar',],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Lending CRM',
        navLabel: 'Lending CRM',
      },
    },
  },
};
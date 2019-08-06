'use strict';

const periodic = require('periodicjs');
const utilities = require('../../utilities');
const shared = utilities.views.shared;
const references = utilities.views.constants.references;
const formElements = shared.props.formElements.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const appGlobalSubTabs = utilities.views.shared.component.appGlobalSubTabs.appGlobalSubTabs;
const integrationTabs = utilities.views.integration.components.integrationTabs;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/integration/dataintegrations/:id/data_setup': {
      layout: {
        component: 'div',
        privileges: [ 101, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          integrationTabs('dataintegrations'),
          plainHeaderTitle({
            title: [ {
              component: 'span',
              asyncprops: {
                children: [ 'integrationdata', 'dataintegration', 'name', ],
              },
            },
            ],
          }),
          appGlobalSubTabs('Data Setup', [ { label: 'Overview & Credentials', location: 'overview', asyncprops: { onclickPropObject: [ 'integrationdata', 'dataintegration', ], }, params: [ { key: ':id', val: '_id', }, ], }, { label: 'Data Setup', location: 'data_setup', asyncprops: { onclickPropObject: [ 'integrationdata', 'dataintegration', ], }, params: [ { key: ':id', val: '_id', }, ], }, ], '/integration/dataintegrations/:id'),
          {
            component: 'Container',
            props: {
              className: 'simulation',
            },
            children: [ plainGlobalButtonBar({
              left: [],
              right: [ {
                guideButton: true,
                location: references.guideLinks.integration[ '/dataintegrations/:id/data_setup' ],
              },
              ],
            }), {
              component: 'Columns',
              children: [ {
                component: 'Column',
                props: {
                  size: 'isHalf',
                },
                children: [ {
                  component: 'ResponsiveCard',
                  props: cardprops({
                    cardTitle: 'Variables Required for Integration',
                    cardStyle: {
                      marginBottom: 20,
                      display: 'flex',
                      flexDirection: 'column',
                    },
                    cardContentProps: {
                      style: {
                        display: 'flex',
                        flex: '1 1 auto',
                        flexDirection: 'column',
                      },
                    },
                  }),
                  children: [ {
                    component: 'p',
                    props: {
                      style: {
                        fontStyle: 'italic',
                        color: styles.colors.gray
                      },
                    },
                    children: 'The following data items are required by the integration. The variables to provide are set in the data integration module within a strategy.',
                  }, {
                    component: 'ResponsiveTable',
                    props: {
                      label: ' ',
                      uniqueFormOptions: true,
                      'flattenRowData': false,
                      'addNewRows': false,
                      'rowButtons': false,
                      'useInputRows': true,
                      hasPagination: false,
                      simplePagination: false,
                      passProps: {
                        disableSort: true,
                        tableWrappingStyle: {
                          overflow: 'visible',
                        },
                      },
                      'sortable': false,
                      'ignoreTableHeaders': [ 'id', ],
                      headers: [ {
                        label: 'Data Item Name',
                        sortid: 'display_name',
                        sortable: false,
                        headerColumnProps: {
                          style: {
                            width: '30%',
                          },
                        },
                      },
                      // {
                      // label: 'Description',
                      // sortid: 'description',
                      // sortable: false,
                      // headerColumnProps: {
                      //   style: {
                      //     width: '50%',
                      //   },
                      // },
                      // },
                      {
                        label: 'Data Type',
                        sortid: 'data_type',
                        sortable: false,
                        headerColumnProps: {
                          style: {
                            width: '20%',
                          },
                        },
                      },
                      ],
                    },
                    asyncprops: {
                      rows: [ 'integrationdata', 'dataintegration', 'inputs', ],
                    },
                  },
                  ],
                }, ],
              }, {
                component: 'Column',
                props: {
                  size: 'isHalf',
                },
                children: [ {
                  component: 'ResponsiveCard',
                  props: cardprops({
                    cardTitle: 'Variables Received from Integration',
                    cardStyle: {
                      marginBottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                    },
                    cardContentProps: {
                      style: {
                        display: 'flex',
                        flex: '1 1 auto',
                        flexDirection: 'column',
                      },
                    },
                  }),
                  children: [ {
                    component: 'p',
                    props: {
                      style: {
                        fontStyle: 'italic',
                        color: styles.colors.gray
                      },
                    },
                    children: 'The following data items are provided by the integration. The variables to assign these items to are set in the data integration module within a strategy.',
                  }, {
                    component: 'ResponsiveTable',
                    props: {
                      label: ' ',
                      uniqueFormOptions: true,
                      'flattenRowData': false,
                      'addNewRows': false,
                      'rowButtons': false,
                      'useInputRows': true,
                      hasPagination: false,
                      simplePagination: false,
                      passProps: {
                        disableSort: true,
                        tableWrappingStyle: {
                          overflow: 'visible',
                        },
                      },
                      'sortable': false,
                      'ignoreTableHeaders': [ 'id', ],
                      headers: [ {
                        label: 'Data Item Name',
                        sortid: 'display_name',
                        sortable: false,
                        headerColumnProps: {
                          style: {
                            width: '30%',
                          },
                        },
                      },
                      // {
                      // label: 'Description',
                      // sortid: 'description',
                      // sortable: false,
                      // headerColumnProps: {
                      //   style: {
                      //     width: '50%',
                      //   },
                      // },
                      // },
                      {
                        label: 'Data Type',
                        sortid: 'data_type',
                        sortable: false,
                        headerColumnProps: {
                          style: {
                            width: '20%',
                          },
                        },
                      },
                      ],
                    },
                    asyncprops: {
                      rows: [ 'integrationdata', 'dataintegration', 'outputs', ],
                    },
                  },
                  ],
                }, ],
              } ],
            },
            ],
          },
        ],
      },
      resources: {
        integrationdata: '/integrations/get_dataintegrations/:id',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: [ 'func:window.redirect', ],
            onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true,
            renderOnError: false,
          },
        },
        checkdigifisupport: {
          url: '/auth/checkdigifisupport',
          options: {
            onSuccess: [],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true, 
            renderOnError: false,
          },
        }
      },
      callbacks: [],
      onFinish: 'render',
      pageData: {
        title: 'DecisionVision | Technical Setup - Data Setup',
        navLabel: 'Technical Setup',
      },
    },
  },
};

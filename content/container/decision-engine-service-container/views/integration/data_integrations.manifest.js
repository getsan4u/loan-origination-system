'use strict';

const periodic = require('periodicjs');
const utilities = require('../../utilities');
const shared = utilities.views.shared;
const formElements = utilities.views.decision.shared.components.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const integrationTabs = utilities.views.integration.components.integrationTabs;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/integration/dataintegrations': {
      layout: {
        component: 'div',
        privileges: [ 101, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          integrationTabs('dataintegrations'),
          plainHeaderTitle({
            title: 'Data Integrations',
          }),
          styles.fullPageDivider,
          plainGlobalButtonBar({
            right: [{
              guideButton: true,
              location: references.guideLinks.integration['/dataintegrations'],
            },
            ],  
          }),
          {
            component: 'Container',
            props: {
              style: {},
            },
            children: [
              {
                component: 'ResponsiveForm',
                props: {
                  formgroups: [{
                    gridProps: {
                      key: randomKey(),
                    },
                    card: {
                      doubleCard: true,
                      leftDoubleCardColumn: {
                        style: {
                          display: 'flex',
                        },
                      },
                      rightDoubleCardColumn: {
                        style: {
                          display: 'flex',
                        },
                      },
                      leftCardProps: cardprops({
                        cardTitle: 'Overview',
                        cardStyle: {
                          marginBottom: 0,
                        },
                      }),
                      rightCardProps: cardprops({
                        cardTitle: 'Integrations',
                        cardStyle: {
                          marginBottom: 0,
                        },
                      }),
                    },
                    formElements: [formElements({
                      twoColumns: true,
                      doubleCard: true,
                      left: [{
                        type: 'layout',
                        value: {
                          component: 'div',
                          children: [{
                            component: 'p',
                            children: 'The platform can connect to a wide range of data sources, including:',
                          }, {
                            component: 'ul',
                            children: [{
                              component: 'li',
                              children: [{
                                component: 'span',
                                children: 'External Data Sources: Third-party data sources',
                              },
                              {
                                component: 'li',
                                children: [{
                                  component: 'span',
                                  children: 'Internal Data Sources:  Customer systems containing data',
                                },
                                ],
                              },  
                              ],
                            },
                            ],
                          }, {
                            component: 'p',
                            children: 'Data integrations populate variables with values, which can then be used in processes. Data integrations must be configured so that the platform knows what credentials to use. Once implemented, data integrations can be utilized in processes by adding data integration modules to strategies.',
                          }, {
                            component: 'p',
                            children: 'To manage a data integration, select it from the list on the right.',
                          }, {
                            component: 'p',
                            children: 'To add additional data integrations please contact DigiFi’s support team.',
                          },
                          ],
                        },
                      },
                      ],
                      right: [{
                        type: 'layout',
                        value: {
                          component: 'ResponsiveTable',
                          thisprops: {
                            rows: ['formdata', 'rows', ],
                            numItems: ['formdata', 'numItems', ],
                            numPages: ['formdata', 'numPages', ],
                          },
                          props: {
                            label: ' ',
                            limit: 10,
                            dataMap: [{
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
                            calculatePagination: true,
                            'flattenRowData': true,
                            'addNewRows': false,
                            'rowButtons': false,
                            'useInputRows': true,
                            simplePagination: true,
                            hasPagination: true,
                            baseUrl: '/integrations/get_dataintegrations?format=json&pagination=dataintegrations',
                            passProps: {
                              disableSort: true,
                              tableWrappingStyle: {
                                overflow: 'visible',
                              },
                            },
                            'sortable': false,
                            'ignoreTableHeaders': ['id', ],
                            headers: [{
                              label: 'Integration Name',
                              sortid: 'name',
                              sortable: false,
                              headerColumnProps: {
                                style: {
                                  width: '35%',
                                },
                              },
                              columnProps: {},
                            }, {
                              label: 'Data Provider',
                              sortid: 'data_provider',
                              sortable: false,
                              columnProps: {},
                            }, {
                              label: 'Status',
                              sortid: 'display_status',
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
                              columnProps: {},
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
                              buttons: [{
                                passProps: {
                                  buttonProps: {
                                    icon: 'fa fa-pencil',
                                    className: '__icon_button',
                                  },
                                  onClick: 'func:this.props.reduxRouter.push',
                                  onclickBaseUrl: '/integration/dataintegrations/:id/overview',
                                  onclickLinkParams: [{ 'key': ':id', 'val': '_id', },
                                  ],
                                },
                              },
                              ],
                            },
                            ],
                          },
                        },
                      },
                      ],
                    }),
                    ],
                  },                
                  ],
                },
                asyncprops: {
                  formdata: ['integrationdata', ],
                },
              },
            ],
          },
        ],
      },
      resources: {
        integrationdata: '/integrations/get_dataintegrations?pagination=dataintegrations',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
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
        title: 'DecisionVision | Technical Setup',
        navLabel: 'Technical Setup',
      },
    },
  },
};

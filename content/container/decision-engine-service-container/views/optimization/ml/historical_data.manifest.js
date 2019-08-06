'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../utilities');
const shared = utilities.views.shared;
const formElements = shared.props.formElements.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const optimizationTabs = utilities.views.optimization.components.optimizationTabs;
const mlmodelTabs = utilities.views.optimization.components.mlmodelTabs;
const references = utilities.views.constants.references;
const randomKey = Math.random;

module.exports = {
  containers: {
    '/optimization/training/historical_data': {
      layout: {
        privileges: [101, 102,],
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        children: [
          optimizationTabs('training/historical_data'),
          plainHeaderTitle({ title: 'Machine Learning Model Training', subtitle: 'Provide historical data and automatically train models', }),
          mlmodelTabs('historical_data'),
          plainGlobalButtonBar({
            left: [{
              component: 'ResponsiveButton',
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  title: 'Add Data Source',
                  pathname: '/optimization/create_data_source',
                },
                buttonProps: {
                  color: 'isSuccess',
                },
              },
              children: 'ADD DATA SOURCE',
            }, ], 
            right: [{
              component: 'ResponsiveButton',
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  title: 'Machine Learning Tutorial',
                  pathname: '/optimization/machine_learning_tutorial',
                },
                buttonProps: {
                  color: 'isPrimary',
                },
              },
              children: 'TUTORIAL',
            }, {
              guideButton: true,
              location: references.guideLinks.models[ 'historicalData' ],
            },
            ],
          }, ),
          {
            component: 'Container',
            props: {
              style: {},
            },
            children: [
              {
                component: 'ResponsiveForm',
                props: {
                  onSubmit: {},
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
                        cardTitle: 'Data Sources',
                        cardStyle: {
                          marginBottom: 0,
                        },
                      }),
                      rightCardProps: cardprops({
                        cardTitle: 'Data Source Requirements',
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
                          component: 'ResponsiveTable',
                          bindprops: true,
                          thisprops: {
                            rows: ['datasourcedata', 'rows',],
                            numItems: ['datasourcedata', 'numItems',],
                            numPages: ['datasourcedata', 'numPages',],
                          },
                          props: {
                            label: ' ',
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
                            limit: 10,
                            hasPagination: true,
                            simplePagination: true,
                            'tableSearch': true,
                            'simpleSearchFilter': true,
                            filterSearchProps: {
                              icon: 'fa fa-search',
                              hasIconRight: false,
                              className: 'global-table-search',
                              placeholder: 'SEARCH',
                            },
                            calculatePagination: true,
                            baseUrl: '/optimization/api/get_datasource_data?format=json&pagination=datasources',
                            flattenRowData: true,
                            useInputRows: false,
                            addNewRows: false,
                            ignoreTableHeaders: ['_id',],
                            headers: [
                              {
                                label: 'Data Source Name',
                                sortid: 'display_name',
                                sortable: false,
                                headerColumnProps: {
                                  style: {
                                    width: '30%',
                                  },
                                },
                              }, {
                                label: 'Created',
                                sortid: 'formattedCreatedAt',
                                sortable: false,
                              }, {
                                label: ' ',
                                headerColumnProps: {
                                  style: {
                                    width: '120px',
                                  },
                                },
                                columnProps: {
                                  style: {
                                    whiteSpace: 'nowrap',
                                  },
                                },
                                buttons: [{
                                  passProps: {
                                    onClick: 'func:this.props.createModal',
                                    onclickProps: {
                                      title: 'Download Data Source',
                                      pathname: '/optimization/download_data_source/:id',
                                      params: [{ 'key': ':id', 'val': '_id', }, ],
                                    },
                                    // onclickBaseUrl: '/simulation/api/simulation_results/:id/download?export_format=csv',
                                    buttonProps: {
                                      className: '__icon_button __re-bulma_button icon-save-content',
                                    },
                                    // aProps: {
                                    // },
                                  },
                                }, {
                                  passProps: {
                                    buttonProps: {
                                      icon: 'fa fa-pencil',
                                      className: '__icon_button',
                                    },
                                    onClick: 'func:this.props.reduxRouter.push',
                                    onclickBaseUrl: '/optimization/data_sources/:id/data_schema',
                                    onclickLinkParams: [{ 'key': ':id', 'val': '_id', },],
                                  },
                                }, {
                                  passProps: {
                                    buttonProps: {
                                      icon: 'fa fa-trash',
                                      color: 'isDanger',
                                      className: '__icon_button',
                                    },
                                    onClick: 'func:this.props.fetchAction',
                                    onclickBaseUrl: '/optimization/api/datasources/:id',
                                    onclickLinkParams: [{ 'key': ':id', 'val': '_id', },],
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
                                      title: 'Delete Data Source',
                                      textContent: [{
                                        component: 'p',
                                        children: 'Do you want to delete this data source?',
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
                        },
                      },], 
                      right: [{
                        type: 'layout',
                        value: {
                          component: 'div',
                          children: [{
                            component: 'ol',
                            children: [{
                              component: 'li',
                              children: 'Comma-separated (.csv) file format.',
                            }, {
                              component: 'li',
                              children: 'The first row must include variable names and every subsequent row must contain a single record or observation.',
                            }, {
                              component: 'li',
                              children: 'Each observation must include independent predictor variable(s) and a dependent historical result.',
                            }, {
                              component: 'li',
                              children: 'Historical results must be named historical_result in the data source file and every observation must have a historical_result.',
                            }, {
                              component: 'ul',
                              children: [{
                                component: 'li',
                                children: 'For Binary models, set to 1 if the event did occur in the observation or 0 if the event did not occur in the observation.',
                              }, {
                                component: 'li',
                                children: 'For Linear models, set to the actual numeric result that occurred in the observation.',
                              }, {
                                component: 'li',
                                children: 'For Categorical models, set to the actual categorical result that occurred in the observation.',
                              },],
                            },],
                          },],
                        },
                      }, ],
                    }),
                    ],
                  },                
                  ],
                },
                asyncprops: {
                  datasourcedata: ['datasourcedata',],
                },
              },
            ],
          },
        ],
      },
      resources: {
        datasourcedata: '/optimization/api/get_datasource_data?pagination=datasources',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect', ],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      'callbacks': ['func:window.setHeaders',],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Machine Learning',
        navLabel: 'Machine Learning',
      },
    },
  },
};
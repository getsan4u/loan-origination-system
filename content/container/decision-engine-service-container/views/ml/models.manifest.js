'use strict';

const periodic = require('periodicjs');
const utilities = require('../../utilities');
const shared = utilities.views.shared;
const formElements = shared.props.formElements.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const mlTabs = utilities.views.ml.components.mlTabs;
// const mlmodelTabs = utilities.views.optimization.components.mlmodelTabs;
const references = utilities.views.constants.references;
const randomKey = Math.random;

module.exports = {
  containers: {
    '/ml/models': {
      layout: {
        privileges: [101, 102, 103, ],
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        children: [
          mlTabs('models'),
          plainHeaderTitle({
            title: 'Predictive Models',
            subtitle: 'Train powerful models with automated machine learning',
          }),
          styles.fullPageDivider,
          plainGlobalButtonBar({
            left: [ {
              component: 'ResponsiveButton',
              asyncprops: {
                privilege_id: [ 'checkdata', 'permissionCode',],
              },
              comparisonorprops: true,
              comparisonprops: [{
                left: ['privilege_id'],
                operation: 'eq',
                right: 101,
              }, {
                left: ['privilege_id'],
                operation: 'eq',
                right: 102,
              }],
              props: {
                onClick: 'func:this.props.fetchAction',
                onclickBaseUrl: '/ml/api/check_account_limit',
                fetchProps: {
                  method: 'GET',
                },
                successProps: {
                  success: '',
                  successCallback: 'func:this.props.reduxRouter.push',
                },
                buttonProps: {
                  color: 'isSuccess',
                },
              },
              children: 'TRAIN MODEL',
            }, ],
            right: [{
              component: 'ResponsiveButton',
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  title: 'Machine Learning - Tutorial',
                  pathname: '/ml/tutorial',
                },
                buttonProps: {
                  color: 'isPrimary',
                },
              },
              children: 'TUTORIAL',
            }, {
              guideButton: true,
              location: references.guideLinks.models[ 'modelTraining' ],
            }, ],
          }),
          {
            component: 'Container',
            props: {
              style: {},
            },
            children: [{
              component: 'ResponsiveCard',
              props: cardprops({
                cardTitle: 'Machine Learning',
                cardStyle: {
                  marginBottom: 0,
                },
              }),
              children: [{
                component: 'p',
                children: 'Click Train Model to get started or check out our Tutorial.',
                props: {
                  style: {
                    color: styles.colors.gray,
                    textAlign: 'center',
                    fontStyle: 'italic',
                  },
                },
                comparisonprops: [{
                  left: ['numItems', ],
                  operation: 'eq',
                  right: 0,
                }, ],
                asyncprops: {
                  numItems: ['mlmodeldata', 'numItems',],
                },
              }, {
                component: 'ResponsiveTable',
                asyncprops: {
                  rows: ['mlmodeldata', 'rows', ],
                  numItems: ['mlmodeldata', 'numItems', ],
                  numPages: ['mlmodeldata', 'numPages', ],
                },
                comparisonprops: [{
                  left: ['numItems', ],
                  operation: 'dneq',
                  right: 0,
                }, ],
                hasWindowFunc: true,
                props: {
                  useRowProps: true,
                  ref: 'func:window.addSimulationRef',
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
                  calculatePagination: true,
                  baseUrl: '/ml/api/models?pagination=mlmodels',
                  flattenRowData: true,
                  useInputRows: false,
                  addNewRows: false,
                  'tableSearch': true,
                  'simpleSearchFilter': true,
                  filterSearchProps: {
                    icon: 'fa fa-search',
                    hasIconRight: false,
                    className: 'global-table-search',
                    placeholder: 'SEARCH',
                  },
                  ignoreTableHeaders: ['_id', ],
                  headers: [{
                    label: 'Model Name',
                    sortid: 'display_name',
                    sortable: false,
                    headerColumnProps: {
                      style: {
                        width: '13%',
                      },
                    },
                  }, {
                    label: 'Model Type',
                    sortid: 'formatted_type',
                    sortable: false,
                    value: ' ',
                    headerColumnProps: {
                      style: {
                        width: '9%',
                      },
                    },
                    columnProps: {
                      style: {
                      },
                    },
                  }, {
                    label: 'Training Data File',
                    sortid: 'training_filename',
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
                    label: 'Created',
                    sortid: 'formattedCreatedAt',
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
                  },
                  // {
                  //   label: 'Training Status',
                  //   sortid: 'status',
                  //   sortable: false,
                  //   headerColumnProps: {
                  //     style: {
                  //       width: '8%',
                  //     },
                  //   },
                  //   columnProps: {
                  //     style: {
                  //     },
                  //   },
                  // },
                  {
                    label: '',
                    // progressBar: true,
                    sortid: 'progressBar',
                    sortable: false,
                    headerColumnProps: {
                      style: {
                        width: '35%',
                      },
                    },
                    columnProps: {
                    },
                  }, {
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
                    buttons: [{
                      passProps: {
                        buttonProps: {
                          icon: 'fa fa-pencil',
                          className: '__icon_button',
                        },
                        onClick: 'func:this.props.fetchAction',
                        onclickBaseUrl: '/ml/api/models/:id/check_model_status',
                        onclickLinkParams: [{ 'key': ':id', 'val': '_id', }, ],
                        fetchProps: {
                          method: 'GET',
                        },
                        successProps: {
                          success: '',
                          successCallback: 'func:this.props.reduxRouter.push',
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
                        onclickLinkParams: [{ 'key': ':id', 'val': '_id', }, ],
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
                          textContent: [{
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
            }, ],
          },
        ],
      },
      resources: {
        mlmodeldata: '/ml/api/models?pagination=mlmodels',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect', ],
            onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      'callbacks': ['func:window.setHeaders', 'func:window.updateGlobalSearchBar', ],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Machine Learning',
        navLabel: 'Machine Learning',
      },
    },
  },
};
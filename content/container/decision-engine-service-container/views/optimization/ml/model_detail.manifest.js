'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../utilities');
const shared = utilities.views.shared;
const formElements = shared.props.formElements.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const simpleAsyncHeaderTitle = utilities.views.shared.component.layoutComponents.simpleAsyncHeaderTitle;
const optimizationTabs = utilities.views.optimization.components.optimizationTabs;
const randomKey = Math.random;

module.exports = {
  containers: {
    '/optimization/mlmodels/:id': {
      layout: {
        privileges: [101, 102,],
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        children: [
          optimizationTabs('training/historical_data'),
          simpleAsyncHeaderTitle({ type: 'mlmodel', title: true, }),
          styles.fullPageDivider,
          {
            component: 'Container',
            props: {
              style: {},
            },
            children: [
              {
                component: 'ResponsiveForm',
                props: {
                  flattenFormData: true,
                  footergroups: false,
                  setInitialValues: false,
                  useFormOptions: true,
                  onSubmit: {
                    url: '/optimization/api/mlmodels/:id',
                    params: [{
                      key: ':id',
                      val: '_id',
                    },],
                    options: {
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      method: 'PUT',
                    },
                    successCallback: ['func:this.props.refresh', 'func:this.props.createNotification',],
                    successProps: [null, {
                      type: 'success',
                      text: 'Changes saved successfully!',
                      timeout: 10000,
                    },
                    ],
                    // responseCallback: 'func:this.props.reduxRouter.push',
                  },
                  formgroups: [
                    {
                      gridProps: {
                        key: randomKey(),
                      },
                      formElements: [{
                        type: 'layout',
                        value: {
                          component: 'div',
                        },
                      }, {
                        type: 'submit',
                        value: 'Save',
                        passProps: {
                          color: 'isPrimary',
                        },
                        layoutProps: {
                          style: {
                            flex: 'none'
                          },
                        },
                      }, {
                        type: 'layout',
                        layoutProps: {
                          className: 'global-guide-btn',
                          size: 'isNarrow',
                        },
                        value: {
                          component: 'a',
                          props: {
                            href: references.guideLinks.optimization['/mlmodels/:id'],
                            target: '_blank',
                            className: '__re-bulma_button __re-bulma_is-primary',
                          },
                          children: [{
                            component: 'span',
                            children: 'GUIDE',
                          }, {
                            component: 'Icon',
                            props: {
                              icon: 'fa fa-external-link',
                            },
                          },],
                        },
                      },],
                    },
                    {
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
                          cardTitle: 'Model Information',
                          cardStyle: {
                            marginBottom: 0,
                          },
                        }),
                        rightCardProps: cardprops({
                          cardTitle: 'Required Fields',
                          cardStyle: {
                            marginBottom: 0,
                          },
                        }),
                      },
                      formElements: [formElements({
                        twoColumns: true,
                        doubleCard: true,
                        left: [{
                          label: 'Model Name',
                          name: 'display_name',
                          passProps: {
                            state: 'isDisabled',
                          },
                        }, {
                          label: 'Model Type',
                          name: 'model_type',
                          passProps: {
                            state: 'isDisabled',
                          },
                        }, {
                          label: 'Data Source',
                          name: 'datasource.display_name',
                          passProps: {
                            state: 'isDisabled',
                          },
                        }, {
                          label: 'Status',
                          name: 'status',
                          passProps: {
                            state: 'isDisabled',
                          },
                        }, {
                          label: 'Created',
                          name: 'formattedCreatedAt',
                          passProps: {
                            state: 'isDisabled',
                          },
                        }, {
                          label: 'Description',
                          name: 'description',
                          passProps: {
                            // state: 'isDisabled',
                          },
                        },],
                        right: [{
                          type: 'layout',
                          value: {
                            component: 'ResponsiveTable',
                            name: 'model_variables',
                            thisprops: { 
                              rows: ['formdata', 'model_variables',],
                            },
                            props: {
                              hasPagination: false,
                              simplePagination: false,
                              flattenRowData: true,
                              useInputRows: false,
                              addNewRows: false,
                              ignoreTableHeaders: ['_id',],
                              headers: [{
                                label: 'Data Field',
                                sortid: 'uploaded_variable_name',
                                sortable: false,
                                headerColumnProps: {
                                  style: {
                                    // width: '50%',
                                  },
                                },
                              }, {
                                label: 'Data Type',
                                sortid: 'data_type',
                                sortable: false,
                                value: ' ',
                                headerColumnProps: {
                                  // style: {
                                  //   width: '20%',
                                  // },
                                },
                                columnProps: {
                                  style: {
                                  },
                                },
                              }, ],
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
                  formdata: ['mlmodeldata', 'data',],
                  __formOptions: ['mlmodeldata', 'data', 'formoptions',],
                },
              },
            ],
          },
        ],
      },
      resources: {
        mlmodeldata: '/optimization/api/mlmodels/:id?pagination=mlmodels&type=getMLModel',
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
      'callbacks': ['func:window.setHeaders',],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Machine Learning',
        navLabel: 'Machine Learning',
      },
    },
  },
};
'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../utilities');
const shared = utilities.views.shared;
const formElements = shared.props.formElements.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
const simpleAsyncHeaderTitle = utilities.views.shared.component.layoutComponents.simpleAsyncHeaderTitle;
const optimizationTabs = utilities.views.optimization.components.optimizationTabs;
const datasourceTabs = utilities.views.optimization.components.datasourceTabs;
const randomKey = Math.random;

module.exports = {
  containers: {
    '/optimization/data_sources/:id/data_schema': {
      layout: {
        privileges: [101, 102,],
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        children: [
          optimizationTabs('training/historical_data'),
          simpleAsyncHeaderTitle({ type: 'datasource', title: true, }),
          datasourceTabs({ tabname: 'data_schema', }),
          // styles.fullPageDivider,
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
                    url: '/optimization/api/datasources/:id?method=saveDataSchema',
                    params: [ {
                      key: ':id',
                      val: '_id',
                    }, ],
                    options: {
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      method: 'PUT',
                    },
                    successCallback: [ 'func:this.props.refresh', 'func:this.props.createNotification', ],
                    successProps: [ null, {
                      type: 'success',
                      text: 'Changes saved successfully!',
                      timeout: 10000,
                    },
                    ],
                    // responseCallback: 'func:this.props.reduxRouter.push',
                  },
                  formgroups: [
                    formGlobalButtonBar({
                      right: [ {
                        type: 'submit',
                        value: 'SAVE',
                        passProps: {
                          color: 'isPrimary',
                        },
                        layoutProps: {
                          size: 'isNarrow',
                        },
                      }, {
                        guideButton: true,
                        location: references.guideLinks.optimization[ '/data_sources/:id' ],
                      },
                      ],
                    }),
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
                          cardTitle: 'Overview',
                          cardStyle: {
                            marginBottom: 0,
                          },
                        }),
                        rightCardProps: cardprops({
                          cardTitle: 'Data Schema',
                          cardStyle: {
                            marginBottom: 0,
                          },
                        }),
                      },
                      formElements: [ formElements({
                        twoColumns: true,
                        doubleCard: true,
                        left: [ {
                          label: 'Data Source Name',
                          name: 'display_name',
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
                          label: 'Number of Observations',
                          name: 'observation_count',
                          numeralFormat: '0,0',
                          passProps: {
                            state: 'isDisabled',
                          },
                        }, {
                          label: 'Number of Predictive Attributes',
                          name: 'predictor_variable_count',
                          numeralFormat: '0,0',
                          passProps: {
                            state: 'isDisabled',
                          },
                        }, ],
                        right: [ {
                          type: 'datatable',
                          name: 'data_source_variables',
                          // uniqueFormOptions: true,
                          'flattenRowData': false,
                          'addNewRows': false,
                          'rowButtons': false,
                          'useInputRows': true,
                          tableWrappingStyle: {
                            overflow: 'visible',
                          },
                          label: ' ',
                          labelProps: {
                            style: {
                              flex: 1,
                            },
                          },
                          passProps: {
                            turnOffTableSort: true,
                            tableWrappingStyle: {
                              overflow: 'visible',
                            },
                          },
                          layoutProps: {},
                          ignoreTableHeaders: [ '_id', ],
                          headers: [ {
                            label: 'Data Field',
                            sortid: 'uploaded_variable_name',
                            sortable: false,
                            headerColumnProps: {
                              style: {
                                width: '50%',
                              },
                            },
                          }, {
                            label: 'Data Type',
                            sortid: 'data_type',
                            // formtype: 'dropdown',
                            sortable: false,
                            // dropdownProps: {
                            //   selection: true,
                            //   fluid: true,
                            // },
                            headerColumnProps: {
                              style: {
                                width: '20%',
                              },
                            },
                            columnProps: {
                              style: {
                                overflow: 'visible',
                              },
                            },
                          }, {
                            label: 'Categorical?',
                            sortid: 'distinct_category',
                            formtype: 'checkbox',
                            sortable: false,
                            useRowProps: true,
                            passProps: {
                            },
                            // dropdownProps: {
                            //   selection: true,
                            //   fluid: true,
                            // },
                            columnProps: {
                              style: {
                                overflow: 'visible',
                              },
                            },
                          }, ],
                        }, ],
                      }),
                      ],
                    },
                  ],
                },
                asyncprops: {
                  formdata: [ 'datasourcedata', 'data', ],
                  __formOptions: [ 'datasourcedata', 'data', 'formoptions', ],
                },
              },
            ],
          },
        ],
      },
      resources: {
        datasourcedata: '/optimization/api/datasources/:id?pagination=datasources&type=getDataSourceSchema',
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
      'callbacks': ['func:window.setHeaders', ],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Machine Learning',
        navLabel: 'Machine Learning',
      },
    },
  },
};
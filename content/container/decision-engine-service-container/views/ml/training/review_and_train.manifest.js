'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../utilities');
const shared = utilities.views.shared;
const formElements = shared.props.formElements.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const getRadioButtonGroup = utilities.views.decision.shared.components.radioButtonGroup;
const mlTabs = utilities.views.ml.components.mlTabs;
// const mlmodelTabs = utilities.views.optimization.components.mlmodelTabs;
const references = utilities.views.constants.references;
const randomKey = Math.random;

module.exports = {
  containers: {
    '/ml/models/:id/training/review_and_train': {
      layout: {
        privileges: [101, 102, 103 ],
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        children: [
          mlTabs('models'),
          plainHeaderTitle({ title: 'Train Your Model', subtitle: 'Follow the steps below to train a predictive model', }),
          styles.fullPageDivider,
          {
            component: 'Container',
            props: {
              style: {},
            },
            children: [{
              component: 'Columns',
              children: [{
                component: 'Column',
                props: {
                  style: {
                    flex: 'none',
                    paddingRight: '20px',
                  }
                },
                children: [{
                  component: 'ResponsiveSteps',
                  props: {
                    steps: [{
                      status: 'finish',
                      title: 'Basic Information',
                    }, {
                      status: 'finish',
                      title: 'Select Model Type',
                    }, {
                      status: 'finish',
                      title: 'Provide Historical Data',
                    }, {
                      status: 'process',
                      title: 'Review & Train',
                    }, ],
                    stepsProps: {
                      direction: 'vertical',
                      current: 3,
                    },
                  },
                },],
              }, {
                component: 'Column',
                children: [plainGlobalButtonBar({
                  left: [],
                  right: [{
                    guideButton: true,
                    location: references.guideLinks.models['modelTraining'],
                  },],
                }), {
                  component: 'ResponsiveCard',
                  props: cardprops({
                    cardTitle: 'Review Your Data & Begin Model Training',
                  }),
                  children: [{
                    component: 'ResponsiveForm',
                    props: {
                      onSubmit: {
                        url: '/ml/api/models/:id/train',
                        params: [{
                          key: ':id',
                          val: 'model_id',
                        },],
                        options: {
                          headers: {},
                          method: 'POST',
                        },
                        successCallback: ['func:this.props.createNotification', 'func:this.props.reduxRouter.push',],
                        successProps: [{
                          type: 'success',
                          text: 'Changes saved successfully!',
                          timeout: 10000,
                        },{
                          pathname: '/ml/models',
                        }],
                        // responseCallback: 'func:this.props.reduxRouter.push',
                      },
                      hiddenFields: [{
                        form_name: 'model_type',
                        form_static_val: 'binary',
                      },],
                      formgroups: [
                        {
                          gridProps: {
                            key: randomKey(),
                          },
                          formElements: [{
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
                              label: 'Name',
                              sortid: 'uploaded_variable_name',
                              sortable: false,
                              headerColumnProps: {
                                style: {
                                  width: '20%',
                                },
                              },
                            }, {
                              label: {
                                component: 'span',
                                children: [{
                                  component: 'span',
                                  props: {
                                    style: {
                                      marginRight: '6px',
                                    },
                                  },
                                  children: 'Data Type',
                                }, {
                                  component: 'ResponsiveButton',
                                  props: {
                                    buttonProps: {
                                      className: 'question-button',
                                    },
                                    onClick: 'func:this.props.createModal',
                                    onclickProps: {
                                      pathname: '/modal/model-data-type',
                                      title: 'What is a Data Type?',
                                    },
                                  },
                                }],
                              },
                              sortid: 'data_type',
                              sortable: false,
                              headerColumnProps: {
                              },
                              columnProps: {
                                style: {
                                  overflow: 'visible',
                                },
                              },
                            }, {
                              label: {
                                component: 'span',
                                children: [{
                                  component: 'span',
                                  props: {
                                    style: {
                                      marginRight: '6px',
                                    },
                                  },
                                  children: 'Correlation',
                                }, {
                                  component: 'ResponsiveButton',
                                  props: {
                                    buttonProps: {
                                      className: 'question-button',
                                    },
                                    onClick: 'func:this.props.createModal',
                                    onclickProps: {
                                      pathname: '/modal/model-correlation',
                                      title: 'What is a Correlation?',
                                    },
                                  },
                                }],
                              }, 
                              sortid: 'correlation',
                              sortable: false,
                              headerColumnProps: {
                              },
                              columnProps: {
                                style: {
                                  overflow: 'visible',
                                },
                              },
                            }, {
                              label: {
                                component: 'span',
                                children: [{
                                  component: 'span',
                                  props: {
                                    style: {
                                      marginRight: '6px',
                                    },
                                  },
                                  children: 'Importance',
                                }, {
                                  component: 'ResponsiveButton',
                                  props: {
                                    buttonProps: {
                                      className: 'question-button',
                                    },
                                    onClick: 'func:this.props.createModal',
                                    onclickProps: {
                                      pathname: '/modal/model-importance',
                                      title: 'What Does "Importance" Mean?',
                                    },
                                  },
                                }],
                              },
                              sortid: 'importance',
                              sortable: false,
                              headerColumnProps: {
                              },
                              columnProps: {
                                style: {
                                  overflow: 'visible',
                                },
                              },
                            }, {
                              label: 'Range',
                              sortid: 'range',
                              sortable: false,
                              headerColumnProps: {
                              },
                              columnProps: {
                                style: {
                                  overflow: 'visible',
                                },
                              },
                            }, {
                              label: 'Average',
                              sortid: 'average',
                              sortable: false,
                              headerColumnProps: {
                              },
                              columnProps: {
                                style: {
                                  overflow: 'visible',
                                },
                              },
                            }, {
                              label: {
                                component: 'span',
                                children: [{
                                  component: 'span',
                                  props: {
                                    style: {
                                      marginRight: '6px',
                                    },
                                  },
                                  children: '# Unique',
                                }, {
                                  component: 'ResponsiveButton',
                                  props: {
                                    buttonProps: {
                                      className: 'question-button',
                                    },
                                    onClick: 'func:this.props.createModal',
                                    onclickProps: {
                                      pathname: '/modal/column-unique-counts',
                                      title: 'What is the "# Unique"?',
                                    },
                                  },
                                }],
                              },
                              sortid: 'column_unique_count',
                              sortable: false,
                              useRowProps: true,
                              columnProps: {
                                style: {
                                  overflow: 'visible',
                                },
                              },
                            }, {
                              label: {
                                component: 'span',
                                children: [{
                                  component: 'span',
                                  props: {
                                    style: {
                                      marginRight: '6px',
                                    },
                                  },
                                  children: 'Include?',
                                }, {
                                  component: 'ResponsiveButton',
                                  props: {
                                    buttonProps: {
                                      className: 'question-button',
                                    },
                                    onClick: 'func:this.props.createModal',
                                    onclickProps: {
                                      pathname: '/modal/included-columns',
                                      title: 'What Does "Include" Mean?',
                                    },
                                  },
                                }],
                              },
                              sortid: 'include_column',
                              formtype: 'checkbox',
                              sortable: false,
                              useRowProps: true,
                              passProps: {
                              },
                              columnProps: {
                                style: {
                                  overflow: 'visible',
                                },
                              },
                            }, ],
                          }, ],
                        },
                        {
                          gridProps: {
                            key: randomKey(),
                          },
                          formElements: [{
                            type: 'submit',
                            value: 'TRAIN MODEL',
                            passProps: {
                              color: 'isSuccess',
                              className: 'arrow-right-btn',
                            },
                            layoutProps: {
                              style: {
                                textAlign: 'right',
                                margin: '1rem 0',
                              }
                            },
                          },
                          ],
                        },
                      ],
                    },
                    asyncprops: {
                      formdata: ['mlmodeldata', 'mlmodel', 'datasource'],
                    }
                  },],
                },],
              }, ],
            },],
          },
        ],
      },
      resources: {
        mlmodeldata: '/ml/api/model/:id/review_and_train?pagination=mlmodels',
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
      'callbacks': ['func:window.hideModal', 'func:window.setHeaders',],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Machine Learning',
        navLabel: 'Machine Learning',
      },
    },
  },
};
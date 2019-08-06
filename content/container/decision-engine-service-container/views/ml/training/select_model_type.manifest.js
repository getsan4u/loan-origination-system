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
    '/ml/models/:id/training/select_type': {
      layout: {
        privileges: [101, 102, 103],
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
                  },
                },
                children: [{
                  component: 'ResponsiveSteps',
                  props: {
                    steps: [{
                      status: 'finish',
                      title: 'Basic Information',
                    }, {
                      status: 'process',
                      title: 'Select Model Type',
                    }, {
                      status: '',
                      title: 'Provide Historical Data',
                    }, {
                      status: '',
                      title: 'Review & Train',
                    }, ],
                    stepsProps: {
                      direction: 'vertical',
                      // current: 1,
                    },
                  },
                }, ],
              }, {
                component: 'Column',
                children: [plainGlobalButtonBar({
                  left: [],
                  right: [{
                    guideButton: true,
                    location: references.guideLinks.models['modelTraining'],
                  }, ],
                }), {
                  component: 'ResponsiveCard',
                  props: cardprops({
                    cardTitle: 'Select The Type Of Model To Train',
                  }),
                  children: [{
                    component: 'ResponsiveForm',
                    props: {
                      blockPageUI: true,
                      onSubmit: {
                        url: '/ml/api/select_model_type/:id',
                        params: [{
                          key: ':id',
                          val: '_id',
                        }, ],
                        options: {
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          method: 'PUT',
                        },
                        successCallback: 'func:this.props.createNotification',
                        successProps: {
                          type: 'success',
                          text: 'Changes saved successfully!',
                          timeout: 10000,
                        },
                        responseCallback: 'func:this.props.reduxRouter.push',
                      },
                      formgroups: [{
                        gridProps: {
                          key: randomKey(),
                        },
                        formElements: [{
                          type: 'layout',
                          value: {
                            component: 'h3',
                            props: {
                              style: {
                                fontWeight: 'normal',
                              }
                            },
                            children: 'Industry-Specific Model Options'
                          },
                          passProps: {
                          },
                          layoutProps: {
                            style: {
                              textAlign: 'left',
                            },
                          },
                        },
                        ],
                      },
                      getRadioButtonGroup([{
                        name: 'type',
                        value: 'loan_default_risk',
                        icon: styles.moduleIcons[ 'adjust' ],
                        title: [{
                          component: 'span',
                          props: {
                            style: {
                              display: 'inline-block',
                              marginRight: '6px',
                            },
                          },
                          children: 'LOAN DEFAULT RISK',
                        }, {
                          component: 'ResponsiveButton',
                          props: {
                            buttonProps: {
                              className: 'question-button',
                            },
                            onClick: 'func:this.props.createModal',
                            onclickProps: {
                              pathname: '/modal/binary-model',
                              title: 'What is a Loan Default Risk Model?',
                            },
                          },
                        }, ],
                        subtext: 'This model type generates a score from 300-850 which predicts loan default risk',
                        subTextSize: '14px',
                      },
                      ]),
                      {
                        gridProps: {
                          key: randomKey(),
                        },
                        formElements: [{
                          type: 'layout',
                          value: styles.fullPageDivider,
                          passProps: {
                          },
                          layoutProps: {
                            style: {
                            },
                          },
                        },
                        ],
                      },
                      {
                        gridProps: {
                          key: randomKey(),
                        },
                        formElements: [{
                          type: 'layout',
                          value: {
                            component: 'h3',
                            props: {
                              style: {
                                fontWeight: 'normal',
                              }
                            },
                            children: 'Generic Model Options'
                          },
                          passProps: {
                          },
                          layoutProps: {
                            style: {
                              textAlign: 'left',
                            },
                          },
                        },
                        ],
                      },
                      getRadioButtonGroup([{
                        name: 'type',
                        value: 'binary',
                        icon: styles.moduleIcons[ 'adjust' ],
                        title: [{
                          component: 'span',
                          props: {
                            style: {
                              display: 'inline-block',
                              marginRight: '6px',
                            },
                          },
                          children: 'BINARY MODEL',
                        }, {
                          component: 'ResponsiveButton',
                          props: {
                            buttonProps: {
                              className: 'question-button',
                            },
                            onClick: 'func:this.props.createModal',
                            onclickProps: {
                              pathname: '/modal/binary-model',
                              title: 'What is a Binary Model?',
                            },
                          },
                        }, ],
                        subtext: 'Predicts the probability that an event will occur',
                        subTextSize: '14px',
                      }, {
                        name: 'type',
                        value: 'regression',
                        icon: styles.moduleIcons[ 'lineChart' ],
                        title: [{
                          component: 'span',
                          props: {
                            style: {
                              display: 'inline-block',
                              marginRight: '6px',
                            },
                          },
                          children: 'LINEAR MODEL',
                        }, {
                          component: 'ResponsiveButton',
                          props: {
                            buttonProps: {
                              className: 'question-button',
                            },
                            onClick: 'func:this.props.createModal',
                            onclickProps: {
                              pathname: '/modal/linear-model',
                              title: 'What is a Linear Model?',
                            },
                          },
                        }, ], 
                        subtext: 'Predicts the most likely numeric value',
                        subTextSize: '14px',
                      },
                      {
                        name: 'type',
                        value: 'categorical',
                        icon: styles.moduleIcons[ 'pieChart' ],
                        title: [{
                          component: 'span',
                          props: {
                            style: {
                              display: 'inline-block',
                              marginRight: '6px',
                            },
                          },
                          children: 'CATEGORICAL MODEL',
                        }, {
                          component: 'ResponsiveButton',
                          props: {
                            buttonProps: {
                              className: 'question-button',
                            },
                            onClick: 'func:this.props.createModal',
                            onclickProps: {
                              pathname: '/modal/categorical-model',
                              title: 'What is a Categorical Model?',
                            },
                          },
                        }, ], 
                        subtext: 'Predicts the most likely categorical value',
                        subTextSize: '14px',
                      },
                      ]),
                      {
                        gridProps: {
                          key: randomKey(),
                        },
                        formElements: [{
                          type: 'submit',
                          value: 'CONTINUE',
                          passProps: {
                            color: 'isSuccess',
                            className: 'arrow-right-btn',
                          },
                          layoutProps: {
                            style: {
                              textAlign: 'right',
                              margin: '1rem 0',
                            },
                          },
                        },
                        ],
                      },
                      ],
                    },
                    asyncprops: {
                      formdata: ['mlmodeldata', 'mlmodel', ],
                    },
                  }, ],
                }, ],
              }, ],
            }, ],
          },
        ],
      },
      resources: {
        mlmodeldata: '/ml/api/model/:id/select_type?format=json',
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
      'callbacks': ['func:window.setHeaders', ],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Machine Learning',
        navLabel: 'Machine Learning',
      },
    },
  },
};
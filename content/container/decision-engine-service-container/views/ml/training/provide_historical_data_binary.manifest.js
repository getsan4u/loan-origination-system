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
    '/ml/models/:id/training/historical_data_binary': {
      layout: {
        privileges: [ 101, 102, 103],
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
            children: [ {
              component: 'Columns',
              children: [ {
                component: 'Column',
                props: {
                  style: {
                    flex: 'none',
                    paddingRight: '20px',
                  }
                },
                children: [ {
                  component: 'ResponsiveSteps',
                  props: {
                    steps: [ {
                      status: 'finish',
                      title: 'Basic Information',
                    }, {
                      status: 'finish',
                      title: 'Select Model Type',
                    }, {
                      status: 'process',
                      title: 'Provide Historical Data',
                    }, {
                      status: '',
                      title: 'Review & Train',
                    }, ],
                    stepsProps: {
                      direction: 'vertical',
                      current: 2,
                    },
                  },
                }, ],
              }, {
                component: 'Column',
                children: [ plainGlobalButtonBar({
                  left: [],
                  right: [ {
                    component: 'ResponsiveButton',
                    props: {
                      onClick: 'func:this.props.createModal',
                      onclickProps: {
                        title: 'View & Download Example Data',
                        pathname: '/modal/view-example-data-binary',
                      },
                      buttonProps: {
                        color: 'isPrimary',
                      },
                    },
                    children: 'VIEW EXAMPLE DATA',
                  }, {
                    guideButton: true,
                    location: references.guideLinks.models[ 'modelTraining' ],
                  }, ],
                }), {
                  component: 'ResponsiveCard',
                  props: cardprops({
                    cardTitle: 'Upload Historical Data', 
                  }),
                  children: [ {
                    component: 'ResponsiveForm',
                    asyncprops: {
                      formdata: ['mlmodeldata', 'mlmodel',],
                    },
                    props: {
                      blockPageUI: true,
                      hiddenFields: [ {
                        form_name: 'model_type',
                        form_static_val: 'binary',
                      }, ],
                      onSubmit: {
                        url: '/ml/api/models/:id/data_source?upload=true',
                        params: [ {
                          key: ':id',
                          val: '_id',
                        }, ],
                        options: {
                          headers: {},
                          method: 'POST',
                        },
                        responseCallback: 'func:window.setHeaders',
                        successCallback: ['func:this.props.createNotification', 'func:this.props.createModal'],
                        successProps: [{
                          type: 'success',
                          text: 'Changes saved successfully!',
                          timeout: 10000,
                        }, {
                          title: 'Data Processing',
                          pathname: '/modal/ml/data_source_progress',
                        }],
                      },
                      formgroups: [
                        {
                          gridProps: {
                            key: randomKey(),
                          },
                          formElements: [ {
                            customLabel: {
                              component: 'span',
                              children: [{
                                component: 'span',
                                props: {
                                  style: {
                                    marginRight: '6px',
                                    verticalAlign: 'center',
                                  }
                                },
                                children: 'Document Selection',
                              }, {
                                component: 'ResponsiveButton',
                                props: {
                                  buttonProps: {
                                    className: 'question-button',
                                  },
                                  onClick: 'func:this.props.createModal',
                                  onclickProps: {
                                    pathname: '/modal/historical-data-binary',
                                    title: 'What Historical Data Is Required?',
                                  },
                                },
                              }],
                            },
                            type: 'file',
                            children: 'Choose File',
                          }, ],
                        },
                        {
                          gridProps: {
                            key: randomKey(),
                          },
                          formElements: [ {
                            type: 'layout',
                            value: {
                              component: 'ul',
                              children: [ {
                                component: 'li',
                                children: 'CSV, XLS, or XLSX file formats are accepted',
                              }, {
                                component: 'li',
                                children: 'The first row must include field names and following rows must contain historical observations',
                              }, {
                                component: 'li',
                                children: 'You must include a historical result field labeled "historical_result". Set this to true for historical observations where the event occurred and to false for observations where the event did not occur',
                              }, ],
                            },
                          }, ],
                        },
                        {
                          gridProps: {
                            key: randomKey(),
                          },
                          formElements: [ {
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
                              }
                            },
                          },
                          ],
                        },
                      ],
                    },
                  }, ],
                }, ],
              }, ],
            }, ],
          },
        ],
      },
      resources: {
        mlmodeldata: '/ml/api/model/:id?format=json',
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
      'callbacks': [ 'func:window.setHeaders', ],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Machine Learning',
        navLabel: 'Machine Learning',
      },
    },
  },
};
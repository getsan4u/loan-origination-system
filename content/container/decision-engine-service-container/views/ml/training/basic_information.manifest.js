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
    '/ml/models/training/basic_information': {
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
          // mlmodelTabs('mlmodels'),
          // plainGlobalButtonBar({
          //   left: [],
          //   right: [{
          //     guideButton: true,
          //     location: references.guideLinks.models['modelTraining'],
          //   },],
          // }),
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
                      status: '',
                      title: 'Basic Information',
                    }, {
                      status: '',
                      title: 'Select Model Type',
                    }, {
                      status: '',
                      title: 'Provide Historical Data',
                    }, {
                      status: '',
                      title: 'Review & Train',
                    },],
                    stepsProps: {
                      direction: 'vertical',
                      current: 0,
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
                  },],
                }), {
                  component: 'ResponsiveCard',
                  props: cardprops({
                    cardTitle: 'Name and Describe Your Model',
                  }),
                  children: [{
                    component: 'ResponsiveForm',
                    props: {
                      onSubmit: {
                        url: '/ml/api/initialize_new_model',
                        params: [{
                          key: ':id',
                          val: '_id',
                        }, ],
                        options: {
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          method: 'POST',
                        },
                        successCallback: 'func:this.props.createNotification',
                        successProps: {
                          type: 'success',
                          text: 'Changes saved successfully!',
                          timeout: 10000,
                        },
                        responseCallback: 'func:this.props.reduxRouter.push',
                      },
                      validations: [{
                        'name': 'name',
                        'constraints': {
                          'name': {
                            'presence': {
                              'message': '^Model Name is required.',
                            },
                          },
                        },
                      },],
                      formgroups: [
                        {
                          gridProps: {
                            key: randomKey(),
                          },
                          formElements: [{
                            label: 'Model Name',
                            name: 'name',
                            keyUp: 'func:window.nameOnChange',
                            onBlur: true,
                            validateOnBlur: true,
                            errorIconRight: true,
                            passProps: {},
                            layoutProps: {
                              style: {
                                textAlign: 'center',
                              },
                            },
                          }, ],
                        }, 
                        {
                          gridProps: {
                            key: randomKey(),
                          },
                          formElements: [{
                            customLabel: {
                              component: 'span',
                              children: [{
                                component: 'span',
                                children: 'Description',
                              }, {
                                component: 'span',
                                props: {
                                  style: {
                                    fontStyle: 'italic',
                                    color: '#ccc',
                                    marginLeft: '7px',
                                    fontWeight: 'normal',
                                  },
                                },
                                children: 'Optional',
                              }, ],
                            },
                            name: 'description',
                            type: 'textarea',
                            onBlur: true,
                            valueCheckOnBlur: true,
                            errorIconRight: true,
                            layoutProps: {
                              style: {
                                textAlign: 'center',
                              },
                            },
                          }, ],
                        },
                        {
                          gridProps: {
                            key: randomKey(),
                          },
                          formElements: [{
                            type: 'submit',
                            value: 'SELECT MODEL TYPE',
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
                  },],
                }, ],
              },],
            }, ],
          },
        ],
      },
      resources: {
        // mlmodeldata: '/optimization/api/get_mlmodel_data?pagination=mlmodels',
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
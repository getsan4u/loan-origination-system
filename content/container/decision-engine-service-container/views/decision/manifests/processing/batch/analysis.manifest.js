'use strict';

const utilities = require('../../../../../utilities');
const shared = utilities.views.shared;
const formElements = shared.props.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const periodic = require('periodicjs');
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
const decisionTabs = utilities.views.decision.shared.components.decisionTabs;
const strategyProcessingTabs = utilities.views.decision.shared.components.strategyProcessingTabs;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/decision/processing/batch/analysis': {
      layout: {
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        children: [
          decisionTabs('processing/individual/run'),
          plainHeaderTitle({
            title: 'Batch Processing',
          }),
          strategyProcessingTabs('batch'),
          {
            component: 'Container',
            props: {
              style: {},
            },
            children: [{
              component: 'ResponsiveForm',
              hasWindowFunc: true,
              bindprops: true,
              props: {
                blockPageUI: true,
                useDynamicData: true,
                flattenFormData: false,
                footergroups: false,
                updateFormOnResponse: true,
                dynamicResponseField: 'simulationdata',
                onSubmit: {
                  url: '/simulation/api/compare_simulations',
                  options: {
                    headers: {
                    },
                    method: 'POST',
                  },
                  responseCallback: 'func:this.props.setDynamicData',
                  // successCallback: 'func:window.resetSimulationNavIndex'
                  // responseCallback: 'func:window.handleCompareSimulationResponse',
                },
                formdata: {
                  init: true,
                  navbar: {},
                },
                hiddenFields: [{
                  form_name: 'init',
                  form_val: 'init',
                },],
                ref: 'func:window.addSimulationRef',
                formgroups: [
                  formGlobalButtonBar({
                    left: [{
                      type: 'submit',
                      value: 'ANALYZE RESULTS',
                      layoutProps: {
                        size: 'isNarrow',
                      },
                      passProps: {
                        color: 'isSuccess',
                      },
                    }, {
                      component: 'ResponsiveButton',
                      props: {
                        onClick: 'func:window.addComparisonSet',
                        buttonProps: {
                          color: 'isSuccess',
                        },
                      },
                      children: 'ADD COMPARISON',
                    },],
                    right: [{
                      guideButton: true,
                      location: references.guideLinks.simulation['/analysis'],
                    },],
                  }),
                  {
                    gridProps: {
                      key: randomKey(),
                    },
                    formElements: [],
                  },
                  {
                    gridProps: {
                      key: randomKey(),
                    },
                    card: {
                      props: cardprops({
                        cardTitle: 'Results Selection',
                        cardStyle: {
                          marginBottom: 0,
                        },
                      }),
                    },
                    formElements: [{
                      name: 'set.0',
                      type: 'dropdown',
                      passProps: {
                        selection: true,
                        fluid: true,
                        search: true,
                      },
                      layoutProps: {
                      },
                    },],
                  },
                  {
                    gridProps: {
                      key: randomKey(),
                      isMultiline: false,
                      className: 'dynamic-simulation',
                    },
                    formElements: [
                      {
                        type: 'layout',
                        layoutProps: {
                          style: {
                            maxWidth: '100%',
                          },
                        },
                        name: 'navbar',
                        value: {
                          component: 'div',
                          ignoreReduxProps: true,
                          thisprops: {
                            _children: ['dynamic', 'simulationdata', '_children', 'simulation_chart_card',],
                          },
                        },
                      },
                    ],
                  },
                ],
              },
              asyncprops: {
                __formOptions: ['analysisdata', 'formoptions',],
              },
            },
            ],
          },
        ],
      },
      resources: {
        analysisdata: '/simulation/api/get_analysis_data',
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
      callbacks: [
        'func:window.submitInitialSimulationForm',
        'func:window.setSimulationObserver',
        'func:window.setHeaders',
        'func:window.resetComparisonSets',
      ],
      onFinish: 'render',
      pageData: {
        'title': 'DigiFi | Decision Engine',
        'navLabel': 'Decision Engine',
      },
    },
  },
};
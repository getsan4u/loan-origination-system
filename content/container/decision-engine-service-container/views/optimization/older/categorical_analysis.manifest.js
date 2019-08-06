// 'use strict';

// const periodic = require('periodicjs');
// const utilities = require('../../utilities');
// const shared = utilities.views.shared;
// const formElements = shared.props.formElements.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const references = utilities.views.constants.references;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
// const optimizationTabs = utilities.views.optimization.components.optimizationTabs;
// const analysisTabs = utilities.views.optimization.components.analysisTabs;
// const randomKey = Math.random;

// module.exports = {
//   containers: {
//     '/optimization/analysis/categorical': {
//       layout: {
//         component: 'div',
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           optimizationTabs('analysis/binary'),
//           plainHeaderTitle({ title: 'Model Evaluation', }),
//           // styles.fullPageDivider,
//           analysisTabs('categorical'),
//           {
//             component: 'Container',
//             props: {
//               style: {},
//             },
//             children: [{
//               component: 'ResponsiveForm',
//               hasWindowFunc: true,
//               props: {
//                 useFormOptions: true,
//                 blockPageUI: true,
//                 useDynamicData: true,
//                 flattenFormData: false,
//                 footergroups: false,
//                 updateFormOnResponse: true,
//                 formtype: 'categorical',
//                 dynamicResponseField: 'optimizationcategoricaldata',
//                 onSubmit: {
//                   url: '/optimization/api/run_analysis',
//                   options: {
//                     headers: {
//                     },
//                     method: 'POST',
//                   },
//                   responseCallback: 'func:this.props.setDynamicData',
//                   // successCallback: 'func:window.resetSimulationNavIndex'
//                   // responseCallback: 'func:window.handleCompareSimulationResponse',
//                 },
//                 ref: 'func:window.addOptimizationRef',
//                 formgroups: [
//                   formGlobalButtonBar({
//                     left: [{
//                       type: 'layout',
//                       layoutProps: {
//                         size: 'isNarrow',
//                       },
//                       value: {
//                         component: 'ResponsiveButton',
//                         props: {
//                           onClick: 'func:window.submitOptimizationAnalysis',
//                           buttonProps: {
//                             color: 'isSuccess',
//                             size: 'isNarrow',
//                           },
//                         },
//                         children: 'EVALUATE MODEL',
//                       },
//                     }, {
//                       type: 'layout',
//                       layoutProps: {
//                         size: 'isNarrow',
//                       },
//                       value: {
//                         component: 'div',
//                         ignoreReduxProps: true,
//                         thisprops: {
//                           _children: ['dynamic', 'optimizationcategoricaldata', '_children', 'optimization_download_dropdown', ],
//                         },
//                       },
//                     },],
//                     right: [{
//                       guideButton: true,
//                       location: references.guideLinks.optimization['/analysis/categorical'],
//                     },],
//                   }),
//                   {
//                     gridProps: {
//                       key: randomKey(),
//                     },
//                     card: {
//                       props: cardprops({
//                         cardTitle: 'Model Selection',
//                         cardStyle: {
//                           marginBottom: 0,
//                         },
//                       }),
//                     },
//                     formElements: [{
//                       name: 'selected_model',
//                       type: 'dropdown',
//                       passProps: {
//                         selection: true,
//                         fluid: true,
//                         search: true,
//                       },
//                       layoutProps: {
//                       },
//                     },],
//                   },
//                   {
//                     gridProps: {
//                       key: randomKey(),
//                       isMultiline: false,
//                       className: 'dynamic-optimization',
//                     },
//                     formElements: [
//                       {
//                         type: 'layout',
//                         layoutProps: {
//                           style: {
//                             maxWidth: '100%',
//                           },
//                         },
//                         name: 'navbar',
//                         value: {
//                           component: 'div',
//                           ignoreReduxProps: true,
//                           thisprops: {
//                             _children: ['dynamic', 'optimizationcategoricaldata', '_children', 'optimization_chart_card',],
//                           },
//                         },
//                       },
//                     ],
//                   },
//                 ],
//               },
//               asyncprops: {
//                 formdata: ['dynamic', 'optimizationcategoricaldata', 'formdata',],
//                 __formOptions: ['analysisdata', 'formoptions',],
//                 // __formOptions: [ 'dynamic', 'optimizationdata', 'formoptions' ]
//               },
//             },],
//           },
//         ],
//       },
//       resources: {
//         analysisdata: {
//           url: '/optimization/api/analysis?classification=categorical',
//           options: {
//             onSuccess: ['func:window.setModelEvaluationDropdown',],
//           },
//         },
//         checkdata: {
//           url: '/auth/run_checks',
//           options: {
//             onSuccess: ['func:window.redirect',],
//             onError: ['func:this.props.logoutUser', 'func:window.redirect',],
//             blocking: true,
//             renderOnError: false,
//           },
//         },
//       },
//       callbacks: [
//         'func:window.setHeaders',
//         'func:window.setOptimizationObserver',
//       ],
//       onFinish: 'render',
//       pageData: {
//         title: 'DigiFi | Artificial Intelligence',
//         navLabel: 'Artificial Intelligence',
//       },
//     },
//   },
// };
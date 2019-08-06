// 'use strict';

// const utilities = require('../../../../utilities');
// const shared = utilities.views.shared;
// const formElements = shared.props.formElements.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
// const optimizationTabs = utilities.views.optimization.components.optimizationTabs;
// const mlProcessingTabs = utilities.views.optimization.components.mlProcessingTabs;
// let randomKey = Math.random;

// module.exports = {
//   'containers': {
//     [ '/optimization/processing/individual/:id' ]: {
//       layout: {
//         component: 'div',
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           optimizationTabs('processing/individual'),
//           plainHeaderTitle({
//             title: [ {
//               component: 'span',
//               children: 'Decision Processing',
//             }, ],
//             subtitle: 'Use your model to make decisions that replace or enhance human judgement',
//           }),
//           mlProcessingTabs('individual'),
//           {
//             component: 'Container',
//             props: {
//               className: 'simulation',
//             },
//             asyncprops: {
//               _children: [ 'pagedata', 'pageLayout', ],
//             },
//           }, ],
//       },
//       'resources': {
//         [ 'pagedata' ]: '/optimization/api/individual/run/:id?format=json&pagination=mlcases',
//         casedata: '/optimization/api/individual/cases?format=json&pagination=mlcases',
//         checkdata: {
//           url: '/auth/run_checks',
//           settings: {
//             onSuccess: [ 'func:window.redirect', ],
//             onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
//             blocking: true,
//             renderOnError: false,
//           },
//         },
//       },
//       'callbacks': [ 'func:window.globalBarSaveBtn', 'func:window.setHeaders', ],
//       pageData: {
//         title: 'DigiFi | Machine Learning',
//         navLabel: 'Machine Learning',
//       },
//       'onFinish': 'render',
//     },
//   },
// };

// 'use strict';

// const periodic = require('periodicjs');
// const utilities = require('../../utilities');
// const shared = utilities.views.shared;
// const formElements = shared.props.formElements.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const optimizationTabs = utilities.views.optimization.components.optimizationTabs;
// const getResourceList = require('../shared/components/overview_data_components').getResourceList;
// const getInfoBoxes = require('../shared/components/overview_data_components').getInfoBoxes;
// let randomKey = Math.random;

// module.exports = {
//   containers: {
//     '/optimization/overview': {
//       layout: {
//         component: 'div',
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           optimizationTabs('overview'),
//           plainHeaderTitle({
//             title: 'Artificial Intelligence',
//             subtitle: 'Train machine learning models that make powerful predictions',
//           }),
//           styles.fullPageDivider,
//           {
//             component: 'Container',
//             props: {
//               style: {
//                 marginTop: '2rem',
//               },
//             },
//             children: [ 
//               getInfoBoxes([{
//                 title: 'Provide Data Source',
//                 icon: [{
//                   component: 'div',
//                   props: {
//                     className: 'cloud-upload livicon',
//                   },
//                 },],
//                 textContent: [{
//                   component: 'p',
//                   children: 'Upload raw data that will be used to create machine learning models and evaluate their predictive strength.',
//                 },],
//                 button: [{
//                   component: 'ResponsiveButton',
//                   props: {
//                     onClick: 'func:this.props.reduxRouter.push',
//                     onclickBaseUrl: '/optimization/data_sources',
//                     buttonProps: {
//                       color: 'isSuccess',
//                     },
//                   },
//                   children: 'GO TO DATA SOURCES',
//                 },],
//               }, {
//                 title: 'Train Machine Learning',
//                 icon: [{
//                   component: 'div',
//                   props: {
//                     className: 'timer livicon',
//                   },
//                 },],
//                 textContent: [{
//                   component: 'p',
//                   children: 'Launch machine learning processes that transform data, select algorithms, and train predictive models.',
//                 },],
//                 button: [{
//                   component: 'ResponsiveButton',
//                   props: {
//                     onClick: 'func:this.props.reduxRouter.push',
//                     onclickBaseUrl: '/optimization/artificialintelligence',
//                     buttonProps: {
//                       color: 'isSuccess',
//                     },
//                   },
//                   children: 'GO TO Machine Learning', 
//                 },],
//               }, {
//                 title: 'Evaluate Predictive Power',
//                 icon: [{
//                   component: 'div',
//                   props: {
//                     className: 'bar-chart livicon',
//                   },
//                 },],
//                 textContent: [{
//                   component: 'p',
//                   children: 'Analyze models against test data and evaluate performance with key metrics and powerful visualizations.',
//                 },],
//                 button: [{
//                   component: 'ResponsiveButton',
//                   props: {
//                     onClick: 'func:this.props.reduxRouter.push',
//                     onclickBaseUrl: '/optimization/analysis/binary',
//                     buttonProps: {
//                       color: 'isSuccess',
//                     },
//                   },
//                   children: 'GO TO MODEL EVALUATION',
//                 },],
//               },], 'flow'),
//               {
//                 component: 'ResponsiveCard',
//                 props: cardprops({
//                   cardTitle: 'Helpful Resources',
//                   cardProps: {
//                     className: 'primary-card-gradient',
//                   },
//                 }),
//                 children: [getResourceList([{
//                   title: 'User Guide',
//                   externalIcon: true,
//                   doubleList: true,
//                   links: [{
//                     location: 'https://docs.digifi.io/docs/overview-ai',
//                     name: 'Overview of Artificial Intelligence',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/binary-model-evaluation',
//                     name: 'Binary Model Evaluation',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/adding-a-data-source',
//                     name: 'Adding a Data Source',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/linear-model-evaluation',
//                     name: 'Linear Model Evaluation',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/training-an-ml-model',
//                     name: 'Training a Model',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/categorical-model-evaluation',
//                     name: 'Categorical Model Evaluation',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/evaluating-predictive-power',
//                     name: 'Evaluating Predictive Power',
//                   }, {
//                     location: 'https://docs.digifi.io/docs/welcome-to-digifi',
//                     name: 'View All',
//                     style: {
//                       fontWeight: 700,
//                     },
//                   }, ],
//                 }, {
//                   title: 'DigiFi Support',
//                   textContent: [{
//                     name: 'Phone: 646.663.3392',
//                   }, {
//                     name: 'Email: support@digifi.io',
//                   }, ],
//                 },
//                 ]), ],
//               },],
//           },
//         ],
//       },
//       resources: {
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
//       callbacks: ['func:window.setHeaders', 'func:window.initOptimizationIcons',],
//       onFinish: 'render',
//       pageData: {
//         title: 'DigiFi | Artificial Intelligence',
//         navLabel: 'Artificial Intelligence',
//       },
//     },
//   },
// };
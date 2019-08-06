// 'use strict';

// const periodic = require('periodicjs');
// const utilities = require('../../../../utilities');
// const shared = utilities.views.shared;
// const formElements = utilities.views.decision.shared.components.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const references = utilities.views.constants.references;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
// const decisionTabs = utilities.views.decision.shared.components.decisionTabs;
// const account_management_tabs = utilities.views.settings.components.account_management_tabs;
// let randomKey = Math.random;

// module.exports = {
//   containers: {
//     '/company-settings/active_strategies': {
//       layout: {
//         component: 'div',
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           account_management_tabs('active_strategies'),
//           plainHeaderTitle({
//             title: 'Active Strategies',
//           }),
//           styles.fullPageDivider,
//           plainGlobalButtonBar({
//             right: [ {
//               guideButton: true,
//               location: references.guideLinks.decision['/activation'],
//             },
//             ],
//           }),
//           {
//             component: 'Container',
//             props: {
//               style: {},
//             },
//             asyncprops: {
//               _children: [ 'strategydata', 'form' ],
//             },
//           },
//         ],
//       },
//       resources: {
//         strategydata: '/integrations/get_strategies?manifest=true',
//         checkdata: {
//           url: '/auth/run_checks',
//           options: {
//             onSuccess: [ 'func:window.redirect', ],
//             onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
//             blocking: true,
//             renderOnError: false,
//           },
//         },
//       },
//       callbacks: [ 'func:window.globalBarSaveBtn', 'func:window.setHeaders', ],
//       onFinish: 'render',
//       pageData: {
//         title: 'DigiFi | Strategy Activation',
//         navLabel: 'Automation Management',
//       },
//     },
//   },
// };
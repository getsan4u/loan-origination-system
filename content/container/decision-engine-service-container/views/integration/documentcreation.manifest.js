// 'use strict';

// const periodic = require('periodicjs');
// const utilities = require('../../utilities');
// const shared = utilities.views.shared;
// const formElements = utilities.views.decision.shared.components.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const references = utilities.views.constants.references;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
// const integrationTabs = utilities.views.integration.components.integrationTabs;
// const documentTabs = utilities.views.integration.components.documentTabs;
// let randomKey = Math.random;

// module.exports = {
//   containers: {
//     '/integration/documents/creation': {
//       layout: {
//         component: 'div',
//         privileges: [ 101, ],
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           integrationTabs('documents/ocr'),
//           plainHeaderTitle({
//             title: 'Documents',
//           }),
//           documentTabs('creation'),
//           plainGlobalButtonBar({
//             right: [{
//               guideButton: true,
//               location: references.guideLinks.integration['/documents'],
//             },
//             ],  
//           }),
//           {
//             component: 'Container',
//             props: {
//               style: {},
//             },
//             children: [
//               {
//                 component: 'ResponsiveForm',
//                 props: {
//                   formgroups: [{
//                     gridProps: {
//                       key: randomKey(),
//                     },
//                     card: {
//                       doubleCard: true,
//                       leftDoubleCardColumn: {
//                         style: {
//                           display: 'flex',
//                         },
//                       },
//                       rightDoubleCardColumn: {
//                         style: {
//                           display: 'flex',
//                         },
//                       },
//                       leftCardProps: cardprops({
//                         cardTitle: 'Overview',
//                         cardStyle: {
//                           marginBottom: 0,
//                         },
//                       }),
//                       rightCardProps: cardprops({
//                         cardTitle: 'Document Creation Templates',
//                         cardStyle: {
//                           marginBottom: 0,
//                         },
//                       }),
//                     },
//                     formElements: [formElements({
//                       twoColumns: true,
//                       doubleCard: true,
//                       left: [{
//                         type: 'layout',
//                         value: {
//                           component: 'div',
//                           children: [{
//                             component: 'p',
//                             children: 'The platform can produce PDF documents as part of automated processes.',
//                           }, {
//                             component: 'p',
//                             children: 'Document creation templates are set up by DigiFi. Once added, documents can be created in processes by adding document creation modules to strategies. These modules will populate the document’s fields with the variables and/or values selected within the module configuration.',
//                           }, {
//                             component: 'p',
//                             children: 'To manage a document creation template, select it from the list on the right.',
//                           }, {
//                             component: 'p',
//                             children: 'To add additional document creation templates please contact DigiFi’s support team.',
//                           },
//                           ],
//                         },
//                       },
//                       ],
//                       right: [{
//                         type: 'layout',
//                         value: {
//                           component: 'ResponsiveTable',
//                           thisprops: {
//                             rows: ['formdata', 'rows', ],
//                             numItems: ['formdata', 'numItems', ],
//                             numPages: ['formdata', 'numPages', ],
//                           },
//                           props: {
//                             label: ' ',
//                             limit: 10,
//                             dataMap: [{
//                               'key': 'rows',
//                               value: 'rows',
//                             }, {
//                               'key': 'numItems',
//                               value: 'numItems',
//                             }, {
//                               'key': 'numPages',
//                               value: 'numPages',
//                             },
//                             ],
//                             calculatePagination: true,
//                             'flattenRowData': true,
//                             'addNewRows': false,
//                             'rowButtons': false,
//                             'useInputRows': true,
//                             simplePagination: true,
//                             hasPagination: true,
//                             baseUrl: '/integrations/get_documents?format=json&pagination=templatedocuments',
//                             passProps: {
//                               disableSort: true,
//                               tableWrappingStyle: {
//                                 overflow: 'visible',
//                               },
//                             },
//                             'sortable': false,
//                             'ignoreTableHeaders': ['id', ],
//                             headers: [{
//                               label: 'Document Name',
//                               sortid: 'name',
//                               sortable: false,
//                               headerColumnProps: {
//                                 style: {
//                                   width: '35%',
//                                 },
//                               },
//                               columnProps: {},
//                             }, {
//                               label: 'Status',
//                               sortid: 'display_status',
//                               sortable: false,
//                               headerColumnProps: {
//                                 style: {
//                                   width: '15%',
//                                 },
//                               },
//                               columnProps: {},
//                             }, {
//                               label: 'Description',
//                               sortid: 'description',
//                               sortable: false,
//                               columnProps: {},
//                             }, {
//                               label: ' ',
//                               headerColumnProps: {
//                                 style: {
//                                   width: '45px',
//                                 },
//                               },
//                               columnProps: {
//                                 style: {
//                                   whiteSpace: 'nowrap',
//                                 },
//                               },
//                               buttons: [{
//                                 passProps: {
//                                   buttonProps: {
//                                     icon: 'fa fa-pencil',
//                                     className: '__icon_button',
//                                   },
//                                   onClick: 'func:this.props.reduxRouter.push',
//                                   onclickBaseUrl: '/integration/documents/creation/:id',
//                                   onclickLinkParams: [{ 'key': ':id', 'val': '_id', },
//                                   ],
//                                 },
//                               },
//                               ],
//                             },
//                             ],
//                           },
//                         },
//                       },
//                       ],
//                     }),
//                     ],
//                   },                
//                   ],
//                 },
//                 asyncprops: {
//                   formdata: ['integrationdata', ],
//                 },
//               },
//             ],
//           },
//         ],
//       },
//       resources: {
//         integrationdata: '/integrations/get_documents?pagination=templatedocuments',
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
//       callbacks: [],
//       onFinish: 'render',
//       pageData: {
//         title: 'DecisionVision | Technical Setup',
//         navLabel: 'Technical Setup',
//       },
//     },
//   },
// };

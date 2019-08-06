// 'use strict';

// const periodic = require('periodicjs');
// const utilities = require('../../../utilities');
// const shared = utilities.views.shared;
// const formElements = utilities.views.decision.shared.components.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const references = utilities.views.constants.references;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
// const optimizationTabs = utilities.views.optimization.components.optimizationTabs;
// let randomKey = Math.random;

// module.exports = {
//   containers: {
//     '/optimization/ocr': {
//       layout: {
//         component: 'div',
//         privileges: [101,],
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           optimizationTabs('ocr'),
//           plainHeaderTitle({
//             title: 'OCR Templates',
//             subtitle: 'Set up templates for automatically extracting text from PDF documents',
//           }),
//           styles.fullPageDivider,
//           plainGlobalButtonBar({
//             left: [{
//               component: 'ResponsiveButton',
//               props: {
//                 onClick: 'func:this.props.createModal',
//                 onclickProps: {
//                   title: 'Create New OCR Template',
//                   pathname: '/optimization/create_ocr_template',
//                 },
//                 buttonProps: {
//                   color: 'isSuccess',
//                 },
//               },
//               children: 'CREATE NEW OCR TEMPLATE',
//             }, ],
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
//             children: [{
//               component: 'ResponsiveCard',
//               props: cardprops({
//                 headerStyle: {
//                   display: 'none',
//                 },
//                 cardStyle: {
//                   marginTop: 20,
//                 },
//               }),
//               children: [{
//                 component: 'ResponsiveTable',
//                 asyncprops: {
//                   rows: ['optimizationdata', 'rows',],
//                   numItems: ['optimizationdata', 'numItems',],
//                   numPages: ['optimizationdata', 'numPages',],
//                 },
//                 props: {
//                   label: ' ',
//                   limit: 10,
//                   dataMap: [{
//                     'key': 'rows',
//                     value: 'rows',
//                   }, {
//                     'key': 'numItems',
//                     value: 'numItems',
//                   }, {
//                     'key': 'numPages',
//                     value: 'numPages',
//                   },
//                   ],
//                   'flattenRowData': true,
//                   'addNewRows': false,
//                   'rowButtons': false,
//                   'useInputRows': true,
//                   simplePagination: true,
//                   hasPagination: true,
//                   baseUrl: '/optimization/api/get_documents?format=json&pagination=ocrdocuments',
//                   passProps: {
//                     disableSort: true,
//                     tableWrappingStyle: {
//                       overflow: 'visible',
//                     },
//                   },
//                   'sortable': false,
//                   'ignoreTableHeaders': ['id',],
//                   headers: [{
//                     label: 'OCR Template Name',
//                     sortid: 'name',
//                     sortable: false,
//                     headerColumnProps: {
//                       style: {
//                         width: '20%',
//                       },
//                     },
//                     columnProps: {},
//                   }, {
//                     label: 'Updated',
//                     sortid: 'updatedat',
//                     sortable: false,
//                     headerColumnProps: {
//                       style: {
//                         width: '15%',
//                       },
//                     },
//                     columnProps: {},
//                   }, {
//                     label: 'Description',
//                     sortid: 'description',
//                     sortable: false,
//                     headerColumnProps: {
//                       style: {
//                         width: '20%',
//                       },
//                     },
//                   }, {
//                     label: ' ',
//                     headerColumnProps: {
//                       style: {
//                         width: '45px',
//                       },
//                     },
//                     columnProps: {
//                       style: {
//                         whiteSpace: 'nowrap',
//                       },
//                     },
//                     buttons: [{
//                       passProps: {
//                         buttonProps: {
//                           icon: 'fa fa-pencil',
//                           className: '__icon_button',
//                         },
//                         onClick: 'func:this.props.reduxRouter.push',
//                         onclickBaseUrl: '/optimization/ocr/:id/0',
//                         onclickLinkParams: [{ 'key': ':id', 'val': '_id', },
//                         ],
//                       },
//                     }, {
//                       passProps: {
//                         buttonProps: {
//                           icon: 'fa fa-trash',
//                           color: 'isDanger',
//                           className: '__icon_button',
//                         },
//                         onClick: 'func:this.props.fetchAction',
//                         onclickBaseUrl: '/optimization/api/delete_ocr/:id',
//                         onclickLinkParams: [{ 'key': ':id', 'val': '_id', },],
//                         fetchProps: {
//                           method: 'DELETE',
//                         },
//                         successProps: {
//                           successCallback: 'func:this.props.refresh',
//                           success: {
//                             notification: {
//                               text: 'Changes saved successfully!',
//                               timeout: 10000,
//                               type: 'success',
//                             },
//                           },
//                         },
//                         confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
//                           title: 'Delete OCR Template',
//                           textContent: [ {
//                             component: 'p',
//                             children: 'Do you want to delete this OCR template?',
//                             props: {
//                               style: {
//                                 textAlign: 'left',
//                                 marginBottom: '1.5rem',
//                               },
//                             },
//                           }, ],
//                         }),
//                       },
//                     },
//                     ],
//                   },
//                   ],
//                 },
//               },],
//             },],
//           },
//         ],
//       },
//       resources: {
//         optimizationdata: '/optimization/api/get_documents?pagination=ocrdocuments',
//         checkdata: {
//           url: '/auth/run_checks',
//           options: {
//             onSuccess: ['func:window.redirect', ],
//             onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
//             blocking: true, 
//             renderOnError: false,
//           },
//         },
//       },
//       callbacks: [],
//       onFinish: 'render',
//       pageData: {
//         title: 'DecisionVision | Artificial Intelligence',
//         navLabel: 'Artificial Intelligence',
//       },
//     },
//   },
// };

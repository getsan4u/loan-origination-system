// 'use strict';

// const periodic = require('periodicjs');
// const utilities = require('../../utilities');
// const shared = utilities.views.shared;
// const formElements = shared.props.formElements.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const references = utilities.views.constants.references;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
// const integrationTabs = utilities.views.integration.components.integrationTabs;
// const documentTabs = utilities.views.integration.components.documentTabs;
// const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
// let randomKey = Math.random;

// module.exports = {
//   containers: {
//     '/integration/documents/creation/:id': {
//       layout: {
//         component: 'div',
//         privileges: [101,],
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           integrationTabs('documents/ocr'),
//           plainHeaderTitle({
//             title: [{
//               component: 'span',
//               asyncprops: {
//                 children: ['integrationdata', 'doc', 'name',],
//               },
//             },
//             ],
//           }),
//           {
//             component: 'Container',
//             props: {
//               className: 'simulation',
//             },
//             children: [{
//               component: 'ResponsiveForm',
//               props: {
//                 'onSubmit': {
//                   url: ' /integrations/documents/:id?type=templatedocument&update=description',
//                   'options': {
//                     'method': 'PUT',
//                   },
//                   'params': [
//                     {
//                       'key': ':id',
//                       'val': '_id',
//                     },
//                   ],
//                   successProps: {
//                     type: 'success',
//                     text: 'Changes saved successfully!',
//                     timeout: 10000,
//                   },
//                   successCallback: ['func:this.props.createNotification',],
//                 },
//                 blockPageUI: true,
//                 useFormOptions: true,
//                 flattenFormData: true,
//                 footergroups: false,
//                 formgroups: [formGlobalButtonBar({
//                   left: [{
//                     type: 'layout',
//                     layoutProps: {
//                       size: 'isNarrow',
//                       style: {},
//                     },
//                     value: {
//                       component: 'ResponsiveButton',
//                       children: 'DOWNLOAD DOCUMENT',
//                       thisprops: {
//                         onclickPropObject: ['formdata',],
//                       },
//                       props: {
//                         'onclickBaseUrl': '/integrations/download_document_template/:id?type=templatedocument&download_document=true',
//                         'onclickLinkParams': [{
//                           'key': ':id',
//                           'val': '_id',
//                         }, 
//                         ],
//                         aProps: {
//                           className: '__re-bulma_button __re-bulma_is-success',
//                         },
//                       },
//                     },
//                   }, ],
//                   right: [{
//                     type: 'submit',
//                     value: 'SAVE',
//                     passProps: {
//                       color: 'isPrimary',
//                     },
//                     layoutProps: {
//                       className: 'global-button-save',
//                     },
//                   }, {
//                     guideButton: true,
//                     location: references.guideLinks.integration[ '/dataintegrations/:id/overview' ],
//                   },
//                   ],
//                 }),
//                 {
//                   gridProps: {
//                     key: randomKey(),
//                   },
//                   card: {
//                     doubleCard: true,
//                     leftDoubleCardColumn: {
//                       style: {
//                         display: 'flex',
//                       },
//                     },
//                     rightDoubleCardColumn: {
//                       style: {
//                         display: 'flex',
//                       },
//                     },
//                     leftCardProps: cardprops({
//                       cardTitle: 'Overview',
//                       cardStyle: {
//                         marginBottom: 0,
//                       },
//                     }),
//                     rightCardProps: cardprops({
//                       cardTitle: 'Fillable Fields',
//                       cardStyle: {
//                         marginBottom: 0,
//                       },
//                     }),
//                   },
//                   formElements: [formElements({
//                     twoColumns: true,
//                     doubleCard: true,
//                     left: [{
//                       label: 'Document Name',
//                       name: 'name',
//                       passProps: {
//                         state: 'isDisabled',
//                       },
//                     }, {
//                       label: 'Created',
//                       name: 'created_at',
//                       passProps: {
//                         state: 'isDisabled',
//                       },
//                     }, {
//                       label: 'Updated',
//                       name: 'updated_at',
//                       passProps: {
//                         state: 'isDisabled',
//                       },
//                     }, {
//                       label: 'Description',
//                       name: 'description',
//                     },
//                     {
//                       name: 'status',
//                       type: 'switch',
//                       label: 'Status',
//                       layoutProps: {
//                         className: 'horizontal-switch',
//                       },
//                       labelProps: {
//                         style: {
//                           flex: 'none',
//                           width: '50px',
//                         },
//                       },
//                       onChange: 'func:window.changeDocumentCreationStatus',
//                       placeholder: 'Enabled (will appear as a Document Creation option)',
//                       placeholderProps: {
//                         className: 'documentCreationStatus',
//                       },
//                     },
//                     ],
//                     right: [{
//                       type: 'layout',
//                       value: {
//                         component: 'div',
//                         children: [{
//                           component: 'p',
//                           props: {
//                             style: {
//                               fontStyle: 'italic',
//                             },
//                           },
//                           children: 'The following fields can be filled in the document. The variables to provide for are set in the Document Creation module within a strategy.',
//                         },
//                         ],
//                       },
//                     }, {
//                       type: 'layout',
//                       value: {
//                         component: 'ResponsiveTable',
//                         props: {
//                           flattenRowData: true,
//                           useInputRows: false,
//                           addNewRows: false,
//                           hasPagination: false,
//                           headerLinkProps: {
//                             style: {
//                               textDecoration: 'none',
//                             },
//                           },
//                           headers: [{
//                             label: 'Field',
//                             sortid: 'display_name',
//                             sortable: false,
//                           }, {
//                             label: 'Data Type',
//                             sortid: 'data_type',
//                             sortable: false,
//                           }, ],
//                         },
//                         thisprops: {
//                           'rows': [
//                             'formdata', 'inputs',
//                           ],
//                         },
//                       },
//                     },],
//                   }),
//                   ],
//                 },
//                 ],
//               },
//               asyncprops: {
//                 formdata: ['integrationdata', 'doc',],
//               },
//             },
//             ],
//           },
//         ],
//       },
//       resources: {
//         integrationdata: {
//           url: '/integrations/get_documents/:id?type=templatedocument',
//           options: {
//           },
//         },
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
//       onFinish: 'render',
//       pageData: {
//         title: 'DecisionVision | Technical Setup - Overview & Credentials',
//         navLabel: 'Technical Setup',
//       },
//     },
//   },
// };

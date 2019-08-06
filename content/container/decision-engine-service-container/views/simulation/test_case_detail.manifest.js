// 'use strict';

// const periodic = require('periodicjs');
// const utilities = require('../../utilities');
// const shared = utilities.views.shared;
// const formElements = shared.props.formElements.formElements;
// const cardprops = shared.props.cardprops;
// const styles = utilities.views.constants.styles;
// const references = utilities.views.constants.references;
// const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
// const simulationTabs = utilities.views.simulation.components.simulationTabs;
// const formGlobalButtonBar = require('../../utilities/views/shared/component/globalButtonBar').formGlobalButtonBar;
// let randomKey = Math.random;

// module.exports = {
//   containers: {
//     '/processing/test_cases/:id/detail': {
//       layout: {
//         component: 'div',
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           simulationTabs('test_cases'),
//           plainHeaderTitle({ title: [{
//             component: 'span',
//             asyncprops: {
//               children: ['testcasedata', 'testcase', 'displayname', ],
//             },
//           },], }),
//           styles.fullPageDivider,
//           {
//             component: 'Container',
//             props:{
//               className: 'simulation',
//             },
//             children: [{
//               component: 'ResponsiveForm',
//               hasWindowFunc: true,
//               props: {
//                 blockPageUI: true,
//                 ref: 'func:window.addRef',
//                 'onSubmit': {
//                   url: '/simulation/api/test_cases/:id',
//                   'options': {
//                     'method': 'PUT',
//                   },
//                   'params': [
//                     {
//                       'key': ':id',
//                       'val': '_id',
//                     },
//                   ],
//                   successCallback: ['func:this.props.refresh', 'func:this.props.createNotification', ],
//                   successProps: [null, {
//                     type: 'success',
//                     text: 'Changes saved successfully!',
//                     timeout: 10000,
//                   }, ],
//                 },
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
//                       thisprops: {
//                         onclickPropObject: ['formdata', ],
//                       },
//                       props: {
//                         onClick: 'func:this.props.createModal',
//                         onclickProps: {
//                           title: 'Add Variable',
//                           pathname: '/modal/add_variable/:id',
//                           params: [{ key: ':id', val: '_id', }, ],
//                         },
//                         buttonProps: {
//                           color: 'isSuccess',
//                         },
//                       },
//                       children: 'ADD VARIABLE',
//                     },  
//                   }, {
//                     type: 'layout',
//                     layoutProps: {
//                       size: 'isNarrow',
//                       style: {},
//                     },
//                     value: {
//                       component: 'ResponsiveButton',
//                       children: 'DOWNLOAD CSV',
//                       thisprops: {
//                         onclickPropObject: ['formdata', ],
//                       },
//                       props: {
//                         'onclickBaseUrl': '/simulation/api/download_variables/:id/:organization?export_format=csv',
//                         'onclickLinkParams': [{
//                           'key': ':id',
//                           'val': '_id',
//                         }, {
//                           'key': ':organization',
//                           'val': 'organization',
//                         },
//                         ],
//                         aProps: {
//                           className: '__re-bulma_button __re-bulma_is-success',
//                         },
//                       },
//                     },
//                   }, {
//                     type: 'layout',
//                     layoutProps: {
//                       size: 'isNarrow',
//                     },
//                     value: {
//                       component: 'ResponsiveButton',
//                       thisprops: {
//                         onclickPropObject: ['formdata', ],
//                       },
//                       props: {
//                         onClick: 'func:this.props.createModal',
//                         onclickProps: {
//                           title: 'Upload CSV',
//                           pathname: '/modal/simulation/edit_test_case/:id',
//                           params: [{ key: ':id', val: '_id', }, ],
//                         },
//                         buttonProps: {
//                           color: 'isSuccess',
//                         },
//                       },
//                       children: 'UPLOAD CSV',
//                     },  
//                   },
//                   ],
//                   right: [{
//                     component: 'ResponsiveButton',
//                     props: {
//                       buttonProps: {
//                         color: 'isPrimary',
//                       },
//                       onClick: 'func:window.submitTestCaseForm',
//                     },
//                     children: 'SAVE',
//                   }, {
//                     guideButton: true,
//                       location: references.guideLinks.simulation['/test_cases/:id/detail'],
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
//                       cardTitle: 'Detail',
//                       cardStyle: {
//                         marginBottom: 0,
//                       },
//                     }),
//                   },
//                   formElements: [formElements({
//                     twoColumns: true,
//                     doubleCard: true,
//                     left: [{
//                       label: 'Case Name',
//                       name: 'displayname',
//                       passProps: {
//                         state: 'isDisabled',
//                       },
//                     }, {
//                       label: 'Created',
//                       name: 'formattedCreatedAt',
//                       passProps: {
//                         state: 'isDisabled',
//                       },
//                     }, {
//                       label: 'Updated',
//                       name: 'formattedUpdatedAt',
//                       passProps: {
//                         state: 'isDisabled',
//                       },
//                     }, {
//                       type: 'layout',
//                       layoutProps: {
//                         style: {
//                           position: 'absolute',
//                           right: '20px',
//                         },
//                       },  
//                       value: {
//                         component: 'ResponsiveButton',
//                         children: 'Create New Tag',
//                         props: {
//                           onClick: 'func:this.props.createModal',
//                           onclickProps: {
//                             title: 'Create New Tag',
//                             pathname: '/modal/simulation/create_population_tag',
//                           },
//                           style: {
//                             display: 'inline-flex',
//                             height: '100%',
//                             alignItems: 'center',
//                             paddingLeft: '5px',
//                             paddingRight: '5px',
//                             border: 'transparent',
//                           },
//                         },
//                       },
//                     }, {
//                       label: 'Population Tags',
//                       name: 'population_tags',
//                       type: 'dropdown',
//                       placeholder: ' ',
//                       passProps: {
//                         selection: true,
//                         multiple: true,
//                         fluid: true,
//                         search: true,
//                       },
//                     },
//                     {
//                       label: 'Description',
//                       name: 'description',
//                       placeholder: ' ',
//                       type: 'textarea',
//                     }, 
//                     ],
//                     right: [{
//                       type: 'layout',
//                       layoutProps: {
//                         className: 'tabbed-code-mirror',
//                       },
//                       name: 'value',
//                       value: {
//                         component: 'ResponsiveTabs',
//                         bindprops: true,
//                         props: {
//                           tabsProps: {
//                             tabStyle: 'isBoxed',
//                           },
//                           isButton: false,
//                         },
//                         thisprops: {
//                           tabs: ['tabs', ],
//                         },
//                       },
//                     },
//                     ],
//                   }),
//                   ],
//                 },
//                 ],
//               },
//               asyncprops: {
//                 formdata: ['testcasedata', 'testcase', ],
//                 __formOptions: ['testcasedata', 'formOptions', ],
//                 tabs: ['testcasedata', 'tabs', ],
//               },
//             },
//             ],
//           },
//         ],
//       },
//       resources: {
//         testcasedata: '/simulation/api/test_cases/:id?format=json',
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
//       callbacks: ['func:window.setHeaders', ],
//       onFinish: 'render',
//       pageData: {
//         title: 'DigiFi | Automated Processing',
//         navLabel: 'Automated Processing',
//       },
//     },
//   },
// };

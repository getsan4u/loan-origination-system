// 'use strict';

// const cardprops = require('../../utilities/views/shared/props/cardprops');
// const styles = require('../../utilities/views/constants/styles');
// const references = require('../../utilities/views/constants/references');
// const periodic = require('periodicjs');
// const reactappLocals = periodic.locals.extensions.get('periodicjs.ext.reactapp');
// const reactapp = reactappLocals.reactapp();
// const plainHeaderTitle = require('../../utilities/views/shared/component/layoutComponents').plainHeaderTitle;
// const plainGlobalButtonBar = require('../../utilities/views/shared/component/globalButtonBar').plainGlobalButtonBar;
// let randomKey = Math.random;
// const utilities = require('../../utilities');
// const account_management_tabs = utilities.views.settings.components.account_management_tabs;

// module.exports = {
//   containers: {
//     '/company-settings/account/products': {
//       layout: {
//         component: 'div',
//         privileges: [101,],
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           account_management_tabs('account/products'),
//           plainHeaderTitle({
//             title: 'Account Overview',
//           }),
//           {
//             'component': 'div',
//             'props': {
//               'className': 'global-sub-tabs',
//             },
//             'children': [
//               {
//                 'component': 'Container',
//                 'children': [
//                   {
//                     'component': 'Tabs',
//                     'bindprops': true,
//                     'props': {
//                       'tabStyle': 'isBoxed',
//                       'style': {
//                         'marginBottom': '-1px',
//                         'marginTop': '-10px',
//                       },
//                     },
//                     'children': [
//                       {
//                         'component': 'TabGroup',
//                         'bindprops': true,
//                         'children': [
//                           {
//                             'component': 'Tab',
//                             'bindprops': true,
//                             'props': {
//                               'isActive': true,
//                               'style': {
//                                 'textAlign': 'center',
//                                 'alignSelf': 'flex-end',
//                               },
//                             },
//                             'children': [
//                               {
//                                 'component': 'ResponsiveButton',
//                                 'props': {
//                                   'onClick': 'func:this.props.reduxRouter.push',
//                                   'onclickBaseUrl': '/company-settings/account/products',
//                                   'onclickLinkParams': [],
//                                   'style': {
//                                     'borderColor': 'transparent',
//                                   },
//                                 },
//                                 'children': 'Products',
//                               },
//                             ],
//                           },
//                           {
//                             'component': 'Tab',
//                             'bindprops': true,
//                             'props': {
//                               'isActive': false,
//                               'style': {
//                                 'textAlign': 'center',
//                                 'alignSelf': 'flex-end',
//                               },
//                             },
//                             'children': [
//                               {
//                                 'component': 'ResponsiveButton',
//                                 'props': {
//                                   'onClick': 'func:this.props.reduxRouter.push',
//                                   'onclickBaseUrl': '/company-settings/account/billing',
//                                   'onclickLinkParams': [],
//                                   'style': {
//                                     'borderColor': 'transparent',
//                                   },
//                                 },
//                                 'children': 'Billing',
//                               },
//                             ],
//                           },
//                           {
//                             'component': 'Tab',
//                             'bindprops': true,
//                             'props': {
//                               'isActive': false,
//                               'style': {
//                                 'textAlign': 'center',
//                                 'alignSelf': 'flex-end',
//                               },
//                             },
//                             'children': [
//                               {
//                                 'component': 'ResponsiveButton',
//                                 'props': {
//                                   'onClick': 'func:this.props.reduxRouter.push',
//                                   'onclickBaseUrl': '/company-settings/account/users',
//                                   'onclickLinkParams': [],
//                                   'style': {
//                                     'borderColor': 'transparent',
//                                   },
//                                 },
//                                 'children': 'Users',
//                               },
//                             ],
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//           plainGlobalButtonBar({
//             left: [],
//             right: [{
//               guideButton: true,
//               location: references.guideLinks.companySettings['productManagement'],
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
//                 'component': 'Columns',
//                 'props': {
//                   'responsive': 'isMobile',
//                   style: {
//                     flexWrap: 'wrap',
//                     padding: '0 5px',
//                   },
//                 },
//                 asyncprops: {
//                   _children: ['productdata', 'pageData', ],
//                 },
//               },
//             ],
//           },
//         ],
//       },
//       resources: {
//         productdata: '/auth/product_page',
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
//       callbacks: ['func:window.removeDisabledClassFromSwitch'],
//       onFinish: 'render',
//       pageData: {
//         title: 'DigiFi | Company Settings',
//         navLabel: 'Company Settings',
//       },
//     },
//   },
// };
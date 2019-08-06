// 'use strict';

// const formElements = require('../../utilities/views/shared/props/formElements').formElements;
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
//     '/company-settings/account': {
//       layout: {
//         component: 'div',
//         privileges: [999,],
//         props: {
//           style: styles.pageContainer,
//         },
//         children: [
//           account_management_tabs('account'),
//           plainHeaderTitle({
//             title: 'Account & Users',
//           }),
//           styles.fullPageDivider,
//           plainGlobalButtonBar({
//             left: [{
//               component: 'ResponsiveButton',
//               props: {
//                 onClick: 'func:this.props.fetchAction',
//                 onclickBaseUrl: '/user/check_number_of_users',
//                 fetchProps: {
//                   method: 'POST',
//                 },
//                 successProps: {
//                   successCallback: 'func:this.props.createModal',
//                 },
//                 buttonProps: {
//                   color: 'isSuccess',
//                 },
//               },
//               children: 'ADD NEW USER',
//             },],
//             right: [{
//               component: 'a',
//               comparisonprops: [{
//                 left: ['accountdata', 'isTrial', ],
//                 operation: 'eq',
//                 right: false,
//               },
//               ],
//               asyncprops: {
//                 accountdata: ['accountdata', 'user', 'association', 'organization', ],
//               },
//               props: {
//                 href: 'https://digifi.io',
//                 target: '_blank',
//                 rel: 'noopener noreferrer',
//                 className:'__re-bulma_button __re-bulma_is-primary',
//               },
//               children: 'BILLING PORTAL',
//             }, {
//               guideButton: true,
//                 location: references.guideLinks.companySettings['/account'],
//             },],
//           }),
//           {
//             component: 'Container',
//             props: {
//               style: {
//                 marginTop: 20,
//               },
//             },
//             children: [
//               {
//                 component: 'ResponsiveForm',
//                 comparisonprops: [{
//                   left: ['formdata', 'isTrial',],
//                   operation: 'eq',
//                   right: true,
//                 },
//                 ],
//                 props: {
//                   flattenFormData: true,
//                   footergroups: false,
//                   formgroups: [
//                     {
//                       card: {
//                         twoColumns: true,
//                         props: cardprops({
//                           cardTitle: 'Account Settings',
//                         }),
//                       },
//                       formElements: [formElements({
//                         twoColumns: true,
//                         doubleCard: false,
//                         left: [
//                           {
//                             label: 'Company Name',
//                             name: 'name',
//                             passProps: {
//                               state: 'isDisabled',
//                             },
//                           }, {
//                             label: 'Account Type',
//                             name: 'account.account_type',
//                             passProps: {
//                               state: 'isDisabled',
//                             },
//                           }, {
//                             label: 'Trial Expiration Date',
//                             name: 'account.expiration_date',
//                             passProps: {
//                               state: 'isDisabled',
//                             },
//                           },
//                         ],
//                         right: [
//                           {
//                             label: 'Maximum Users',
//                             name: 'account.users',
//                             passProps: {
//                               state: 'isDisabled',
//                             },
//                           }, {
//                             label: 'Current Users',
//                             name: 'currentUsers',
//                             passProps: {
//                               state: 'isDisabled',
//                             },
//                           },
//                         ],
//                       }),
//                       ],
//                     },
//                   ],
//                 },
//                 asyncprops: {
//                   formdata: ['accountdata', 'user', 'association', 'organization',],
//                 },
//               },
//               {
//                 component: 'ResponsiveForm',
//                 comparisonprops: [{
//                   left: ['formdata', 'isTrial',],
//                   operation: 'eq',
//                   right: false,
//                 },
//                 ],
//                 props: {
//                   flattenFormData: true,
//                   footergroups: false,
//                   formgroups: [
//                     {
//                       card: {
//                         twoColumns: true,
//                         props: cardprops({
//                           cardTitle: 'Account Settings',
//                         }),
//                       },
//                       formElements: [formElements({
//                         twoColumns: true,
//                         doubleCard: false,
//                         left: [
//                           {
//                             label: 'Company Name',
//                             name: 'name',
//                             passProps: {
//                               state: 'isDisabled',
//                             },
//                           }, {
//                             label: 'Account Type',
//                             name: 'account.account_type',
//                             passProps: {
//                               state: 'isDisabled',
//                             },
//                           },
//                         ],
//                         right: [
//                           {
//                             label: 'Maximum Users',
//                             name: 'account.users',
//                             passProps: {
//                               state: 'isDisabled',
//                             },
//                           }, {
//                             label: 'Current Users',
//                             name: 'currentUsers',
//                             passProps: {
//                               state: 'isDisabled',
//                             },
//                           },
//                         ],
//                       }),
//                       ],
//                     },
//                   ],
//                 },
//                 asyncprops: {
//                   formdata: ['accountdata', 'user', 'association', 'organization', ],
//                 },
//               },
//               {
//                 component: 'ResponsiveCard',
//                 props: cardprops({
//                   cardTitle: 'Authorized Users',
//                 }),
//                 children: [
//                   {
//                     component: 'ResponsiveTable',
//                     props: {
//                       flattenRowData: true,
//                       limit: 20,
//                       hasPagination: true,
//                       simplePagination: true,
//                       headerLinkProps: {
//                         style: {
//                           textDecoration: 'none',
//                           color: styles.colors.darkGreyText,
//                         },
//                       },
//                       headers: [{
//                         label: 'First Name',
//                         sortid: 'first_name',
//                         sortable: false,
//                       }, {
//                         label: 'Last Name',
//                         sortid: 'last_name',
//                         sortable: false,
//                       }, {
//                         label: 'Email',
//                         sortid: 'email',
//                         sortable: false,
//                       }, {
//                         label: 'Permissions Type',
//                         sortid: 'type',
//                         sortable: false,
//                       }, 
//                       {
//                         label: 'Phone Authentication',
//                         sortid: 'status.mfa',
//                         sortable: false,
//                       }, 
//                       {
//                         label: 'Email Verified',
//                         sortid: 'status.email_verified',
//                         sortable: false,
//                       },
//                       {
//                         'headerColumnProps': {
//                           style: {
//                             width: '80px',
//                           },
//                         },
//                         columnProps: {
//                           style: {
//                             whiteSpace: 'nowrap',
//                           },
//                         },
//                         label: ' ',
//                         buttons: [
//                           {
//                             passProps: {
//                               buttonProps: {
//                                 icon: 'fa fa-pencil',
//                                 className: '__icon_button',
//                               },
//                               onClick: 'func:this.props.createModal',
//                               onclickProps: {
//                                 title: 'Edit User',
//                                 pathname: '/modal/edit_user/:id',
//                                 params: [{ 'key': ':id', 'val': '_id', }, ],
//                               },
//                               'successProps':{
//                                 'success': true,
//                               },
//                             },
//                           },
//                           {
//                             passProps: {
//                               buttonProps: {
//                                 icon: 'fa fa-trash',
//                                 color: 'isDanger',
//                                 className: '__icon_button',
//                               },
//                               onClick: 'func:this.props.fetchAction',
//                               onclickBaseUrl: '/user/check_deleted_user/:id',
//                               onclickLinkParams: [{ 'key': ':id', 'val': '_id', },],
//                               fetchProps: {
//                                 method: 'POST',
//                               },
//                               successProps: {
//                                 successCallback: 'func:this.props.createModal',
//                               },
//                             },
//                           },
//                         ],
//                       },
//                       ],
//                     },
//                     asyncprops: {
//                       'rows': [
//                         'usersdata', 'org', 'association', 'users',
//                       ],
//                       'numPages': [
//                         'usersdata', 'org', 'accountstotalpages',
//                       ],
//                       'numItems': [
//                         'usersdata', 'org', 'accountstotal',
//                       ],
//                     },                    
//                   },
//                 ],
//               },
//             ],
//           }, 
//         ],
//       },
//       resources: {
//         accountdata: '/organization/get_general_info',
//         usersdata: '/organization/get_org',
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
//         title: 'DigiFi | Company Settings',
//         navLabel: 'Company Settings',
//       },
//     },
//   },
// };
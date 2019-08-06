// 'use strict';
// const capitalize = require('capitalize');
// const pluralize = require('pluralize');
// const utilities = require('../../../utilities');
// const formConfigs = require('../../../utilities/views/decision/shared/components/formConfigs');
// const decisionTabs = require('../../../utilities/views/decision/shared/components/decisionTabs');
// const collectionDetailTabs = require('../../../utilities/views/decision/shared/components/collectionDetailTabs');
// const detailAsyncHeaderTitle = require('../../../utilities/views/shared/component/layoutComponents').detailAsyncHeaderTitle;
// const detailHeaderButtons = require('../../../utilities/views/decision/shared/components/detailHeaderButtons');
// const styles = require('../../../utilities/views/constants/styles');
// const CONSTANTS = require('../../../utilities/views/decision/constants');
// const cardprops = require('../../../utilities/views/decision/shared/components/cardProps');
// const formElements = require('../../../utilities/views/decision/shared/components/formElements');
// const COMPARATOR_DROPDOWN = CONSTANTS.COMPARATOR_DROPDOWN;
// const randomKey = Math.random;
// const settings = {
//   title: 'Rule Detail',
//   type: 'rule',
//   location: 'detail',
// };

// function getRuleFormElement(options) {
//   let { prop, index, labels = {}, } = options;
//   let ruleFormElements = {
//     to: {
//       name: `rule*0*state_property_attribute_value_comparison`,
//       valueCheckOnBlur: true,
//       onBlur: true,
//       errorIconRight: true,
//       label: 'To (Phone Number)',
//       type: 'maskedinput',
//       value: '',
//       passProps: {
//         mask: 'func:window.phoneNumberFormatter',
//         guid: false,
//         placeholderChar: '\u2000',
//       },
//       layoutProps: {
//         style: {
//           width: '70%',
//           paddingRight: '7px',
//           display: 'inline-block',
//           verticalAlign: 'top',
//         }
//       },
//     },
//     state_property_attribute_value_comparison_type: {
//       name: `rule*${index}*state_property_attribute_value_comparison_type`,
//       type: 'dropdown',
//       passProps: {
//         selection: true,
//         fluid: true,
//       },
//       value: 'value',
//       validateOnChange: true,
//       errorIconRight: true,
//       options: [ {
//         'label': 'Value',
//         'value': 'value',
//       }, {
//         'label': 'Variable',
//         'value': 'variable',
//       }],
//       label: labels[ 'state_property_attribute_value_comparison_type' ] ||
//         'Value type',
//       labelProps: {
//         style: {
//           visibility: 'hidden',
//           whiteSpace: 'nowrap',
//         }
//       },
//       layoutProps: {
//         style: {
//           width: '30%',
//           display: 'inline-block',
//           verticalAlign: 'top',
//         }
//       },
//     },
//     first_state_property_attribute_value_comparison_type: {
//       name: `rule*0*state_property_attribute_value_comparison_type`,
//       type: 'dropdown',
//       passProps: {
//         selection: true,
//         fluid: true,
//       },
//       value: 'value',
//       validateOnChange: true,
//       errorIconRight: true,
//       options: [ {
//         'label': 'Value',
//         'value': 'value',
//       }, {
//         'label': 'Variable',
//         'value': 'variable',
//       }],
//       customLabel: {
//         component: 'ResponsiveButton',
//         children: 'Create New Variable',
//         props: {
//           onClick: 'func:window.closeModalAndCreateNewModal',
//           onclickProps: {
//             title: 'Create New Variable',
//             pathname: '/decision/variables/create',
//           },
//           style: {
//             display: 'inline-block',
//             lineHeight: 1,
//             fontWeight: 'normal',
//             cursor: 'pointer',
//             border: 'transparent',
//           },
//         },
//       },
//       labelProps: {
//         style: {
//           textAlign: 'right',
//         }
//       },
//       layoutProps: {
//         style: {
//           width: '30%',
//           display: 'inline-block',
//           verticalAlign: 'top',
//         }
//       },
//     },
//     text_content: {
//       name: `rule*1*state_property_attribute_value_comparison`,
//       type: 'textarea',
//       valueCheckOnBlur: true,
//       placeholder: ' ',
//       onBlur: true,
//       label: 'Text Message',
//       layoutProps: {
//         style: {
//           width: '70%',
//           display: 'inline-block',
//           verticalAlign: 'top',
//           paddingRight: '7px',
//         }
//       },
//     },
//     formheader: {
//       name: 'formheader',
//       type: 'layout',
//       value: {
//         component: 'div',
//         props: {
//           style: {
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             flexDirection: 'column',
//             margin: '10px 0',
//             position: 'relative',
//           }
//         },
//         children: [
//           {
//             component: 'hr',
//             props: {
//               style: {
//                 border: 'none',
//                 borderBottom: '1px dashed #bbb',
//                 width: '100%',
//               }
//             }
//           },
//           {
//             component: 'span',
//             props: {
//               style: {
//                 padding: '0 20px',
//                 background: 'white',
//                 position: 'absolute',
//                 color: '#bbb',
//                 fontWeight: 900,
//                 fontSize: '13px',
//               }
//             },
//             children: 'RULE PASSES IF'
//           }
//         ]
//       }
//     },
//   };
//   return Object.assign({}, ruleFormElements[ prop ]);
// }

// function getRuleFormValidations(index) {
//   const ruleValidations = {
//   };
//   return ruleValidations;
// }

// let filterFunc = {
//   'rule*0*state_property_attribute_value_comparison': 'func:window.textMessageToFilter',
//   'rule*1*state_property_attribute_value_comparison': 'func:window.textMessageContent',
// };

// function getStandardFields(idx, reducer) {
//   let standardFields = [];
//   return (reducer) ?
//     standardFields.reduce((reduced, element) => reducer({ reduced, element, idx }), undefined)
//     : standardFields;
// }

// let standardFilterReducer = (options) => {
//   let { element, reduced, idx } = options;
//   if (typeof reduced === 'undefined') {
//     reduced = {};
//   }
//   reduced[ `rule*${idx}*${element}` ] = filterFunc[ element ];
//   return reduced;
// }

// let standardOrderReducer = (options) => {
//   let { element, reduced, idx } = options;
//   if (typeof reduced === 'undefined') {
//     reduced = [];
//   }
//   reduced.push(`rule*${idx}*${element}`);
//   return reduced;
// };

// let standardFormElementsReducer = (options) => {
//   let { element, reduced, idx } = options;
//   if (typeof reduced === 'undefined') {
//     reduced = [];
//   }
//   let labelsArr = [];
//   reduced.push(getRuleFormElement({ prop: element, index: idx, labels: labelsArr[ idx ] }));
//   return reduced;
// }

// let { validations, hiddenFields, formgroups, additionalComponents } = formConfigs[ settings.type ].edit;
// let pluralizedType = pluralize(settings.type);
// let url = `/decision/api/standard_${pluralizedType}/:id?format=json`;
// let headerButtons = detailHeaderButtons({ type: settings.type, location: settings.location });
// module.exports = {
//   'containers': {
//     [ `/decision/rules/textmessage/:id` ]: {
//       layout: {
//         component: 'div',
//         children: [
//           {
//             component: 'Container',
//             children: [
//               {
//                 component: 'ResponsiveFormContainer',
//                 asyncprops: {
//                   formdata: [ 'ruledata', 'data' ],
//                   __formOptions: [ 'ruledata', 'formoptions' ],
//                 },
//                 props: {
//                   validations: {
//                     [ `rule*1*state_property_attribute_value_comparison` ]: {
//                       'name': `rule*1*state_property_attribute_value_comparison`,
//                       'constraints': {
//                         [ `rule*1*state_property_attribute_value_comparison` ]: {
//                           'length': {
//                             'maximum': 1600,
//                             'tooLong': '^Maximum 1600 charaters.'
//                           },
//                         },
//                       },
//                     },
//                   },
//                   formgroups: [ {
//                     gridProps: {
//                       key: randomKey(),
//                       className: '__dynamic_form_elements',
//                       style: {
//                         display: 'flex',
//                         justifyContent: 'center',
//                       },
//                     },
//                     formElements: [
//                       getRuleFormElement({
//                         prop: 'to', index: 0, labels: {
//                           'to': 'To (Phone Number)',
//                         },
//                       }),
//                       getRuleFormElement({
//                         prop: 'first_state_property_attribute_value_comparison_type', index: 0, labels: {},
//                       }),
//                       getRuleFormElement({
//                         prop: 'text_content', index: 1, labels: {
//                           'text_content': 'Text Message',
//                         },
//                       }),
//                       getRuleFormElement({
//                         prop: 'state_property_attribute_value_comparison_type', index: 1, labels: {},
//                       }),
//                     ],
//                     order: [
//                       'rule*0*state_property_attribute_value_comparison',
//                       'rule*0*state_property_attribute_value_comparison_type',
//                       'rule*1*state_property_attribute_value_comparison',
//                       'rule*1*state_property_attribute_value_comparison_type',
//                     ],
//                   }, {
//                     gridProps: {
//                       key: randomKey(),
//                       className: 'modal-footer-btns',
//                     },
//                     order: [ 'submit' ],
//                     formElements: [ {
//                       type: 'submit',
//                       name: 'submit',
//                       value: 'SAVE CHANGES',
//                       passProps: {
//                         color: 'isPrimary',
//                       },
//                       layoutProps: {
//                         style: {
//                           textAlign: 'center'
//                         }
//                       }
//                     }, ]
//                   }, ],
//                   renderFormElements: {
//                     'rule*0*state_property_attribute_value_comparison': 'func:window.textMessageToFilter',
//                     'rule*1*state_property_attribute_value_comparison': 'func:window.textMessageContent',
//                   },
//                   form: {
//                     "cardForm": false,
//                     cardFormTitle: 'Rule Detail',
//                     "cardFormProps": styles.cardFormProps,
//                     flattenFormData: true,
//                     footergroups: false,
//                     useFormOptions: true,
//                     onSubmit: {
//                       url: `/decision/api/standard_rules/:id?format=json&method=editRule&collection=rules`,
//                       params: [
//                         { 'key': ':id', 'val': '_id' },
//                       ],
//                       options: {
//                         headers: {
//                           'Content-Type': 'application/json',
//                         },
//                         method: 'PUT',
//                       },
//                       successProps: {
//                         type: 'success',
//                         text: 'Changes saved successfully!',
//                         timeout: 10000,
//                       },
//                       successCallback: 'func:window.hideModalandCreateNotificationandRefresh',
//                     },
//                     validations: [],
//                     hiddenFields: [ {
//                       form_name: '_id',
//                       form_val: '_id',
//                     }, {
//                       form_name: 'type',
//                       form_static_val: 'textmessage',
//                     }, {
//                       form_name: 'rule_type',
//                       form_static_val: 'AND',
//                     }, {
//                       form_name: 'name',
//                       form_val: 'name',
//                     }, {
//                       form_name: 'rule*0*static_state_property_attribute',
//                       form_static_val: 'to',
//                     }, {
//                       form_name: 'rule*1*static_state_property_attribute',
//                       form_static_val: 'body',
//                     }, ],
//                   },
//                 }
//               }
//             ],
//           }],
//       },
//       'resources': {
//         [ `ruledata` ]: `/decision/api/standard_rules/:id?modal=true&format=json`,
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
//       'callbacks': [ 'func:window.dynamicModalHeight' ],
//       'pageData': {
//         'title': settings.title,
//         'navLabel': 'Decision Product',
//       },
//       'onFinish': 'render',
//     },
//   },
// };

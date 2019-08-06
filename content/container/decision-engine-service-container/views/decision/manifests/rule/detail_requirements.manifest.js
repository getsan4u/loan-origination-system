'use strict';
const capitalize = require('capitalize');
const pluralize = require('pluralize');
const utilities = require('../../../../utilities');
const formConfigs = require('../../../../utilities/views/decision/shared/components/formConfigs');
const decisionTabs = require('../../../../utilities/views/decision/shared/components/decisionTabs');
const collectionDetailTabs = require('../../../../utilities/views/decision/shared/components/collectionDetailTabs');
const detailAsyncHeaderTitle = require('../../../../utilities/views/shared/component/layoutComponents').detailAsyncHeaderTitle;
const detailHeaderButtons = require('../../../../utilities/views/decision/shared/components/detailHeaderButtons');
const styles = require('../../../../utilities/views/constants/styles');
const CONSTANTS = require('../../../../utilities/views/decision/constants');
const commentsModal = require('../../../../utilities/views/decision/modals/comment');
const cardprops = require('../../../../utilities/views/decision/shared/components/cardProps');
const formElements = require('../../../../utilities/views/decision/shared/components/formElements');
const COMPARATOR_DROPDOWN = CONSTANTS.COMPARATOR_DROPDOWN;
const randomKey = Math.random;
const settings = {
  title: 'Rule Detail',
  type: 'rule',
  location: 'detail',
};

const ruleOverviewArr = [{
  label: 'Rule Display Name',
  name: 'display_title',
  passProps: {
    // state: 'isDisabled',
  },
}, {
  label: 'Rule Name',
  name: 'title',
  passProps: {
    state: 'isDisabled',
  },
}, {
  label: 'Version',
  name: 'version',
  passProps: {
    state: 'isDisabled',
  },
}, {
  label: 'Module Type',
  name: 'displaytype',
  passProps: {
    state: 'isDisabled',
  },
}, {
  label: 'Rule Type',
  name: 'rule_type_display',
  passProps: {
    state: 'isDisabled',
  },
}, {
  name: 'status',
  label: 'Status',
  passProps: {
    state: 'isDisabled',
  },
}, {
  label: 'Created',
  name: 'formattedCreatedAt',
  passProps: {
    state: 'isDisabled',
  },
}, {
  label: 'Updated',
  name: 'formattedUpdatedAt',
  passProps: {
    state: 'isDisabled',
  },
}, {
  label: 'Description',
  name: 'description',
  type: 'textarea',
  sortable: false,
  headerColumnProps: {
    style: {
      whiteSpace: 'normal',
    },
  },
},];

function getRuleFormElement(options) {
  let { prop, index, } = options;
  let ruleFormElements = {
    name: {
      name: 'name',
      label: 'Rule Name',
      type: 'text',
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      layoutProps: {
      },
    },
    description: {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      errorIcon: 'fa fa-exclamation',
      placeholder: ' ',
      layoutProps: {
      },
    },
    state_property_attribute: {
      name: `rule*${index}*state_property_attribute`,
      value: '',
      errorIconRight: true,
      label: 'Variable',
      type: 'dropdown',
      validateOnChange: true,
      passProps: {
        selection: true,
        fluid: true,
        search: true,
      },
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
          display: 'inline-block',
          verticalAlign: 'top',
        },
      },
    },
    variable_type: {
      type: 'layout',
      name: `rule*${index}*variable_type`,
      passProps: {
        className: '__re-bulma_column',
      },
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        },
      },
      value: {
        component: 'div',
        props: {
          className: '__re-bulma_control __form_element_has_value',
        },
        children: [{
          component: 'label',
          props: {
            className: '__re-bulma_label',
            style: {
              visibility: 'hidden',
              whiteSpace: 'nowrap',
            },
          },
          children: 'Variable Type',
        },
        {
          component: 'Input',
          props: {
            readOnly: true,
            value: '',
          },
        },],
      },
    },
    state_property_attribute_value_comparison: {
      name: `rule*${index}*state_property_attribute_value_comparison`,
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      label: 'Value',
      type: 'text',
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
          display: 'inline-block',
          verticalAlign: 'top',
        },
      },
    },
    state_property_attribute_value_comparison_type: {
      name: `rule*${index}*state_property_attribute_value_comparison_type`,
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      value: 'value',
      validateOnChange: true,
      errorIconRight: true,
      options: [{
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      },],
      label: 'Value type',
      labelProps: {
        style: {
          visibility: 'hidden',
          whiteSpace: 'nowrap',
        },
      },
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        },
      },
    },
    state_property_attribute_value_minimum: {
      name: `rule*${index}*state_property_attribute_value_minimum`,
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      createNumberMask: true,
      passProps: {
        mask: 'func:window.numberMaskTwo',
        guid: false,
        placeholderChar: '\u2000',
      },
      value: '',
      label: 'Minimum',
      type: 'maskedinput',
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
          display: 'inline-block',
          verticalAlign: 'top',
        },
      },
    },
    state_property_attribute_value_minimum_type: {
      name: `rule*${index}*state_property_attribute_value_minimum_type`,
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      value: 'value',
      validateOnChange: true,
      errorIconRight: true,
      options: [{
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      },],
      label: 'Minimum type',
      labelProps: {
        style: {
          visibility: 'hidden',
          whiteSpace: 'nowrap',
        },
      },
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        },
      },
    },
    state_property_attribute_value_maximum: {
      name: `rule*${index}*state_property_attribute_value_maximum`,
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      createNumberMask: true,
      passProps: {
        mask: 'func:window.numberMaskTwo',
        guid: false,
        placeholderChar: '\u2000',
      },
      value: '',
      label: 'Maximum',
      type: 'maskedinput',
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
          display: 'inline-block',
          verticalAlign: 'top',
        },
      },
    },
    state_property_attribute_value_maximum_type: {
      name: `rule*${index}*state_property_attribute_value_maximum_type`,
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      value: 'value',
      validateOnChange: true,
      errorIconRight: true,
      options: [{
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      },],
      label: 'Maximum type',
      labelProps: {
        style: {
          visibility: 'hidden',
          whiteSpace: 'nowrap',
        },
      },
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        },
      },
    },
    condition_group_id: {
      name: 'condition_group_id',
      label: 'OR Group ID',
      type: 'text',
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      layoutProps: {
      },
    },
    condition_test: {
      label: 'Comparison',
      name: `rule*${index}*condition_test`,
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      value: '',
      validateOnChange: true,
      errorIconRight: true,
      // layoutProps: {
      // },
      options: COMPARATOR_DROPDOWN,
    },
    'condition_adverse_codes': {
      name: 'condition_output*0*value',
      label: 'Decline Reason (If Rule Fails)',
      keyUp: 'func:window.nameOnChange',
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      type: 'text',
      layoutProps: {
        style: {
          width: '70%',
          paddingRight: '7px',
          display: 'inline-block',
          verticalAlign: 'top',
        },
      },
    },
    condition_adverse_codes_type: {
      name: 'condition_output*0*value_type',
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      label: 'Decline Reason Type',
      labelProps: {
        style: {
          visibility: 'hidden',
          whiteSpace: 'nowrap',
        },
      },
      value: 'value',
      validateOnChange: true,
      errorIconRight: true,
      options: [{
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      },],
      layoutProps: {
        style: {
          width: '30%',
          display: 'inline-block',
          verticalAlign: 'top',
        },
      },
    },
    'rule_separator': {
      name: `rule*${index}*rule_separator`,
      type: 'layout',
      value: {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            margin: '10px 0',
            position: 'relative',
          },
        },
        children: [
          {
            component: 'hr',
            props: {
              style: {
                border: 'none',
                borderBottom: '1px dashed #bbb',
                width: '100%',
              },
            },
          },
          {
            component: 'span',
            props: {
              style: {
                padding: '0 20px',
                background: 'white',
                position: 'absolute',
                color: '#bbb',
                fontWeight: 900,
                fontSize: '13px',
              },
            },
            children: 'AND',
          },
        ],
      },
    },
    add_button: {
      name: 'plus_counter',
      label: ' ',
      type: 'button',
      max: 3,
      passProps: {
        children: 'ADD CONDITION',
        color: 'isPrimary',
      },
      layoutProps: {
        style: {
          display: 'inline-block',
          margin: '1rem 5px',
        },
      },
      onClick: 'func:window.plusCounterOnClick',
      value: 0,
    },
    delete_button: {
      label: ' ',
      name: 'minus_counter',
      type: 'button',
      onClick: 'func:window.minusCounterOnClick',
      value: 0,
      passProps: {
        children: 'DELETE CONDITION',
        color: 'isDanger',
      },
      layoutProps: {
        style: {
          display: 'inline-block',
          margin: '1rem 5px',
        },
      },
    },
    formheader: {
      name: 'formheader',
      type: 'layout',
      value: {
        component: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            margin: '10px 0',
            position: 'relative',
          },
        },
        children: [
          {
            component: 'hr',
            props: {
              style: {
                border: 'none',
                borderBottom: '1px dashed #bbb',
                width: '100%',
              },
            },
          },
          {
            component: 'span',
            props: {
              style: {
                padding: '0 20px',
                background: 'white',
                position: 'absolute',
                color: '#bbb',
                fontWeight: 900,
                fontSize: '13px',
              },
            },
            children: 'RULE PASSES IF',
          },
        ],
      },
    },
    outputheader: {
      name: 'outputheader',
      type: 'layout',
      layoutProps: {
        className: 'card-full-width-section',
      },
      value: {
        component: 'p',
        props: {
          style: {
            fontWeight: 700,
          },
        },
        children: 'Result',
      },
    },
  };
  return Object.assign({}, ruleFormElements[ prop ]);
}

function getRuleFormValidations(index) {
  const ruleValidations = {
    [ `rule*${index}*state_property_attribute` ]: {
      'name': `rule*${index}*state_property_attribute`,
      'constraints': {
        [ `rule*${index}*state_property_attribute` ]: {
          'presence': { 'message': '^Variable is required.', },
        },
      },
    },
    [ `rule*${index}*condition_test` ]: {
      'name': [`rule*${index}*condition_test`,],
      'constraints': {
        [ `rule*${index}*condition_test` ]: {
          'presence': { 'message': '^Comparator is required.', },
        },
      },
    },
    [ `rule*${index}*state_property_attribute_value_minimum` ]: {
      'name': `rule*${index}*state_property_attribute_value_minimum`,
      'constraints': {
        [ `rule*${index}*state_property_attribute_value_minimum` ]: {
          'presence': { 'message': '^Minimum is required.', },
        },
      },
    },
    [ `rule*${index}*state_property_attribute_value_maximum` ]: {
      'name': `rule*${index}*state_property_attribute_value_maximum`,
      'constraints': {
        [ `rule*${index}*state_property_attribute_value_maximum` ]: {
          'presence': { 'message': '^Maximum is required.', },
        },
      },
    },
    [ `rule*${index}*state_property_attribute_value_comparison` ]: {
      'name': `rule*${index}*state_property_attribute_value_comparison`,
      'constraints': {
        [ `rule*${index}*state_property_attribute_value_comparison` ]: {
          'presence': { 'message': '^Value is required.', },
        },
      },
    },
    [ `rule*${index}*condition_test` ]: {
      'name': `rule*${index}*condition_test`,
      'constraints': {
        [ `rule*${index}*condition_test` ]: {
          'presence': { 'message': '^Comparator is required.', },
        },
      },
    },
  };
  return ruleValidations;
}

let filterFunc = {
  'condition_test': 'func:window.comparatorFilterTwo',
  'state_property_attribute_value_minimum': 'func:window.minimumFilterTwo',
  'state_property_attribute_value_maximum': 'func:window.maximumFilterTwo',
  'state_property_attribute_value_minimum_type': 'func:window.minMaxTypeFilter',
  'state_property_attribute_value_maximum_type': 'func:window.minMaxTypeFilter',
  'state_property_attribute_value_comparison_type': 'func:window.valueTypeFilter',
  'state_property_attribute_value_comparison': 'func:window.valueFilterTwo',
  'variable_type': 'func:window.variableTypeFilterTwo',
  'state_property_attribute': 'func:window.variableDropdownFilter',
  'rule_separator': 'func:window.ruleSeparaterFilter',
  'add_button': 'func:window.plusCounterFilter',
  'delete_button': 'func:window.minusCounterFilter',
};

function getStandardFields(idx, reducer) {
  let standardFields = ['state_property_attribute',
    'variable_type',
    'condition_test',
    'state_property_attribute_value_comparison',
    'state_property_attribute_value_comparison_type',
    'state_property_attribute_value_minimum',
    'state_property_attribute_value_minimum_type',
    'state_property_attribute_value_maximum',
    'state_property_attribute_value_maximum_type',];
  return (reducer) ?
    standardFields.reduce((reduced, element) => reducer({ reduced, element, idx, }), undefined)
    : standardFields;
}

let standardFilterReducer = (options) => {
  let { element, reduced, idx, } = options;
  if (typeof reduced === 'undefined') {
    reduced = {};
  }
  reduced[ `rule*${idx}*${element}` ] = filterFunc[ element ];
  return reduced;
};

let standardOrderReducer = (options) => {
  let { element, reduced, idx, } = options;
  if (typeof reduced === 'undefined') {
    reduced = [];
  }
  reduced.push(`rule*${idx}*${element}`);
  return reduced;
};

let standardFormElementsReducer = (options) => {
  let { element, reduced, idx, } = options;
  if (typeof reduced === 'undefined') {
    reduced = [];
  }
  reduced.push(getRuleFormElement({ prop: element, index: idx, }));
  return reduced;
};

let { validations, hiddenFields, formgroups, additionalComponents, } = formConfigs[ settings.type ].edit;
let pluralizedType = pluralize(settings.type);
let url = `/decision/api/standard_${pluralizedType}/:id?format=json`;
let headerButtons = detailHeaderButtons({ type: settings.type, location: settings.location, });
module.exports = {
  'containers': {
    [ '/decision/rules/requirements/:id/detail' ]: {
      layout: {
        privileges: [101, 102,],
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        children: [decisionTabs(pluralizedType),
          detailAsyncHeaderTitle({ title: settings.title, type: settings.type, }),
          collectionDetailTabs({ tabname: settings.location, collection: settings.type, category: true, }),
          headerButtons,
          {
            component: 'Container',
            children: [
              {
                component: 'ResponsiveFormContainer',
                asyncprops: {
                  formdata: ['ruledata', 'data',],
                  __formOptions: ['ruledata', 'formoptions',],
                },
                props: {
                  validations: Object.assign({}, getRuleFormValidations(0), getRuleFormValidations(1), getRuleFormValidations(2), getRuleFormValidations(3)),
                  formgroups: [
                    {
                      gridProps: {
                        key: randomKey(),
                      },
                      order: ['submit',],
                      formElements: [{
                        name: 'submit',
                        type: 'submit',
                        value: 'SAVE',
                        passProps: {
                          color: 'isPrimary',
                        },
                        layoutProps: {
                          className: 'global-button-save',
                        },
                      },],
                    },
                    {
                      gridProps: {
                        key: randomKey(),
                        // className: '__dynamic_form_elements',
                      },
                      card: {
                        doubleCard: true,
                        leftDoubleCardColumn: {
                          style: {
                            display: 'flex',
                          },
                        },
                        rightDoubleCardColumn: {
                          style: {
                            display: 'flex',
                          },
                        },
                        leftCardProps: cardprops({
                          cardTitle: 'Overview',
                          cardStyle: {
                            marginBottom: 0,
                          },
                        }),
                        rightCardProps: cardprops({
                          cardTitle: 'Rule',
                          cardStyle: {
                            marginBottom: 0,
                            textAlign: 'center',
                          },
                        }),
                      },
                      formElements: [formElements({
                        twoColumns: true,
                        doubleCard: true,
                        left: ruleOverviewArr,
                        right: [
                          getRuleFormElement({ prop: 'formheader', }),
                          getRuleFormElement({ prop: 'add_button', }),
                          getRuleFormElement({ prop: 'delete_button', }),
                          ...getStandardFields(0, standardFormElementsReducer),
                          getRuleFormElement({ prop: 'rule_separator', index: 1, }),
                          ...getStandardFields(1, standardFormElementsReducer),
                          getRuleFormElement({ prop: 'rule_separator', index: 2, }),
                          ...getStandardFields(2, standardFormElementsReducer),
                          getRuleFormElement({ prop: 'rule_separator', index: 3, }),
                          ...getStandardFields(3, standardFormElementsReducer),
                          getRuleFormElement({ prop: 'outputheader', }),
                          getRuleFormElement({
                            prop: 'condition_adverse_codes',
                          }),
                          getRuleFormElement({
                            prop: 'condition_adverse_codes_type',
                          }),
                        ],
                        rightOrder: [
                          'formheader',
                          ...getStandardFields(0, standardOrderReducer),
                          'rule*1*rule_separator',
                          ...getStandardFields(1, standardOrderReducer),
                          'rule*2*rule_separator',
                          ...getStandardFields(2, standardOrderReducer),
                          'rule*3*rule_separator',
                          ...getStandardFields(3, standardOrderReducer),
                          'plus_counter',
                          'minus_counter',
                          'outputheader',
                          'condition_output*0*value',
                          'condition_output*0*value_type',
                        ],
                      }),
                      ],
                    }, {
                      gridProps: {
                        key: randomKey(),
                      },
                      card: {
                        props: cardprops({
                          cardTitle: 'Dependencies',
                          cardStyle: {
                            marginBottom: 0,
                          },
                        }),
                      },
                      order: ['strategies',],
                      formElements: [{
                        type: 'datatable',
                        name: 'strategies',
                        flattenRowData: true,
                        useInputRows: false,
                        addNewRows: false,
                        ignoreTableHeaders: ['_id',],
                        headers: [
                          {
                            label: 'Strategy Name',
                            sortid: 'display_name',
                            sortable: false,
                            headerColumnProps: {
                              style: {
                                width: '30%',
                              },
                            },
                          }, {
                            label: 'Version',
                            sortid: 'version',
                            sortable: false,
                          }, {
                            label: 'Status',
                            sortid: 'status',
                            sortable: false,
                          }, {
                            label: 'Updated',
                            momentFormat: styles.momentFormat.birthdays,
                            sortid: 'updatedat',
                            sortable: false,
                          }, {
                            label: 'Description',
                            sortid: 'description',
                            sortable: false,
                            headerColumnProps: {
                              style: {
                                width: '20%',
                              },
                            },
                          }, {
                            label: ' ',
                            headerColumnProps: {
                              style: {
                                width: '80px',
                              },
                            },
                            columnProps: {
                              style: {
                                whiteSpace: 'nowrap',
                              },
                            },
                            buttons: [{
                              passProps: {
                                buttonProps: {
                                  icon: 'fa fa-pencil',
                                  className: '__icon_button',
                                },
                                onClick: 'func:this.props.reduxRouter.push',
                                onclickBaseUrl: '/decision/strategies/:id/overview',
                                onclickLinkParams: [{ 'key': ':id', 'val': '_id', },],
                              },
                            },
                            ],
                          },],
                      },],
                    },],
                  renderFormElements: Object.assign({}, getStandardFields(0, standardFilterReducer), getStandardFields(1, standardFilterReducer), getStandardFields(2, standardFilterReducer), getStandardFields(3, standardFilterReducer), {
                    'rule*1*rule_separator': 'func:window.ruleSeparaterFilter',
                    'rule*2*rule_separator': 'func:window.ruleSeparaterFilter',
                    'rule*3*rule_separator': 'func:window.ruleSeparaterFilter',
                    'plus_counter': 'func:window.plusCounterFilter',
                    'minus_counter': 'func:window.minusCounterFilter',
                    'condition_output*0*value': 'func:window.adverseFilter',
                  }),
                  form: {
                    'cardForm': false,
                    cardFormTitle: 'Rule Detail',
                    'cardFormProps': styles.cardFormProps,
                    flattenFormData: true,
                    footergroups: false,
                    useFormOptions: true,
                    onSubmit: {
                      url: '/decision/api/standard_rules/:id?format=json',
                      params: [
                        { 'key': ':id', 'val': '_id', },
                      ],
                      options: {
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        method: 'PUT',
                      },
                      successProps: {
                        type: 'success',
                        text: 'Changes saved successfully!',
                        timeout: 10000,
                      },
                      successCallback: 'func:window.editFormSuccessCallback',
                    },
                    validations: [],
                    hiddenFields: [{
                      form_name: '_id',
                      form_val: '_id',
                    }, {
                      form_name: 'type',
                      form_val: 'type',
                    }, {
                      form_name: 'rule_type',
                      form_val: 'rule_type',
                    }, {
                      form_name: 'name',
                      form_val: 'name',
                    }, {
                      form_name: 'version',
                      form_val: 'version',
                    },],
                  },
                },
              },
            ],
          },],
      },
      'resources': {
        [ `${settings.type}data` ]: `/decision/api/standard_${pluralizedType}/:id?format=json`,
        checkdata: {
          url: '/auth/run_checks',
          settings: {
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true, 
            renderOnError: false,
          },
        },
      },
      'callbacks': ['func:window.globalBarSaveBtn',],
      'pageData': {
        'title': 'DigiFi | Decision Engine',
        'navLabel': 'Decision Engine',
      },
      'onFinish': 'render',
    },
  },
};

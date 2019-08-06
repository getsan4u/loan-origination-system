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
  label: 'Rule System Name',
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
      },
    },
    variable_type: {
      type: 'layout',
      name: `rule*${index}*variable_type`,
      passProps: {
        className: '__re-bulma_column',
      },
      value: {
        component: 'div',
        props: {
          className: '__re-bulma_control __form_element_has_value',
        },
        children: [{
          component: 'label',
          props: {
            className: '__re-bulma_control-label',
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
      label: 'Minimum',
      type: 'text',
      layoutProps: {
      },
    },
    state_property_attribute_value_minimum_type: {
      name: `rule*${index}*state_property_attribute_value_minimum_type`,
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      value: '',
      validateOnChange: true,
      errorIconRight: true,
      options: [{
        label: 'Select Type',
        value: '',
      }, {
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      },],
      layoutProps: {
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
      label: 'Maximum',
      type: 'text',
      layoutProps: {
      },
    },
    state_property_attribute_value_maximum_type: {
      name: `rule*${index}*state_property_attribute_value_maximum_type`,
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      value: '',
      validateOnChange: true,
      errorIconRight: true,
      options: [{
        label: 'Select Type',
        value: '',
      }, {
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      },],
      layoutProps: {
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
      name: 'condition_adverse_codes',
      label: 'Decline Reason (If Rule Fails)',
      keyUp: 'func:window.nameOnChange',
      validateOnBlur: true,
      onBlur: true,
      errorIconRight: true,
      type: 'text',
      // layoutProps: {
      // },
    },
    condition_adverse_codes_type: {
      name: 'condition_adverse_codes_type',
      type: 'dropdown',
      passProps: {
        selection: true,
        fluid: true,
      },
      label: ' ',
      value: '',
      validateOnChange: true,
      errorIconRight: true,
      options: [{
        label: 'Select Type',
        value: '',
      }, {
        'label': 'Value',
        'value': 'value',
      }, {
        'label': 'Variable',
        'value': 'variable',
      },],
      layoutProps: {
      },
    },
    'rule_separator': {
      name: `rule*${index}*rule_separator`,
      type: 'layout',
      value: {
        component: 'p',
        children: '------------------------------------------------- AND -------------------------------------------------',
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
    },
    formheader: {
      name: 'formheader',
      type: 'layout',
      value: {
        component: 'p',
        children: '------------------------------------------- RULE PASSES IF -------------------------------------------',
      },
    },
    outputheader: {
      name: 'outputheader',
      type: 'layout',
      value: {
        component: 'div',
        children: [{
          component: 'h3',
          children: 'Result',
        },],
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

let { validations, hiddenFields, formgroups, additionalComponents, } = formConfigs[ settings.type ].edit;
let pluralizedType = pluralize(settings.type);
let url = `/decision/api/standard_${pluralizedType}/:id?format=json`;
let headerButtons = detailHeaderButtons({ type: settings.type, location: settings.location, });
module.exports = {
  'containers': {
    [ '/decision/rules/limits/:id/detail' ]: {
      layout: {
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
                  formgroups: [{
                    gridProps: {
                      key: randomKey(),
                    },
                    formElements: [{
                      type: 'submit',
                      value: 'SAVE',
                      passProps: {
                        color: 'isPrimary',
                      },
                      layoutProps: {
                        className: 'global-button-save',
                      },
                    },],
                  }, {
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
                        },
                      }),
                    },
                    formElements: [formElements({
                      twoColumns: true,
                      doubleCard: true,
                      left: ruleOverviewArr,
                      right: [
                        getRuleFormElement({ prop: 'formheader', }),
                        getRuleFormElement({ prop: 'add_button', index: 0, }),
                        getRuleFormElement({ prop: 'delete_button', index: 0, }),
                        getRuleFormElement({ prop: 'state_property_attribute', index: 0, }),
                        getRuleFormElement({ prop: 'variable_type', index: 0, }),
                        getRuleFormElement({ prop: 'state_property_attribute_value_comparison', index: 0, }),
                        getRuleFormElement({ prop: 'state_property_attribute_value_minimum', index: 0, }),
                        getRuleFormElement({ prop: 'state_property_attribute_value_maximum', index: 0, }),
                        getRuleFormElement({
                          prop: 'state_property_attribute_value_minimum_type', index: 0,
                        }),
                        getRuleFormElement({
                          prop: 'state_property_attribute_value_maxiumum_type', index: 0,
                        }),
                        getRuleFormElement({ prop: 'condition_test', index: 0, }),
                        getRuleFormElement({
                          prop: 'condition_adverse_codes',
                        }),
                        getRuleFormElement({
                          prop: 'condition_adverse_codes_type',
                        }),
                        getRuleFormElement({ prop: 'add_button', index: 1, }),
                        getRuleFormElement({ prop: 'delete_button', index: 1, }),
                        getRuleFormElement({ prop: 'rule_separator', index: 1, }),
                        getRuleFormElement({ prop: 'state_property_attribute', index: 1, }),
                        getRuleFormElement({ prop: 'variable_type', index: 1, }),
                        getRuleFormElement({ prop: 'state_property_attribute_value_comparison', index: 1, }),
                        getRuleFormElement({ prop: 'state_property_attribute_value_minimum', index: 1, }),
                        getRuleFormElement({ prop: 'state_property_attribute_value_maximum', index: 1, }),
                        getRuleFormElement({
                          prop: 'state_property_attribute_value_minimum_type', index: 1,
                        }),
                        getRuleFormElement({
                          prop: 'state_property_attribute_value_maxiumum_type', index: 1,
                        }),
                        getRuleFormElement({ prop: 'condition_test', index: 1, }),
                        getRuleFormElement({ prop: 'rule_separator', index: 2, }),
                        getRuleFormElement({ prop: 'state_property_attribute', index: 2, }),
                        getRuleFormElement({ prop: 'variable_type', index: 2, }),
                        getRuleFormElement({ prop: 'state_property_attribute_value_comparison', index: 2, }),
                        getRuleFormElement({ prop: 'state_property_attribute_value_minimum', index: 2, }),
                        getRuleFormElement({ prop: 'state_property_attribute_value_maximum', index: 2, }),
                        getRuleFormElement({
                          prop: 'state_property_attribute_value_minimum_type', index: 2,
                        }),
                        getRuleFormElement({
                          prop: 'state_property_attribute_value_maxiumum_type', index: 2,
                        }),
                        getRuleFormElement({ prop: 'condition_test', index: 2, }),
                        getRuleFormElement({ prop: 'rule_separator', index: 3, }),
                        getRuleFormElement({ prop: 'state_property_attribute', index: 3, }),
                        getRuleFormElement({ prop: 'variable_type', index: 3, }),
                        getRuleFormElement({ prop: 'state_property_attribute_value_comparison', index: 3, }),
                        getRuleFormElement({ prop: 'state_property_attribute_value_minimum', index: 3, }),
                        getRuleFormElement({ prop: 'state_property_attribute_value_maximum', index: 3, }),
                        getRuleFormElement({
                          prop: 'state_property_attribute_value_minimum_type', index: 3,
                        }),
                        getRuleFormElement({
                          prop: 'state_property_attribute_value_maxiumum_type', index: 3,
                        }),
                        getRuleFormElement({ prop: 'condition_test', index: 3, }),
                        getRuleFormElement({ prop: 'outputheader', }),
                      ],
                      rightOrder: [
                        'formheader',
                        'rule*0*state_property_attribute',
                        'rule*0*variable_type',
                        'rule*0*condition_test',
                        'rule*0*state_property_attribute_value_comparison',
                        'rule*0*state_property_attribute_value_minimum',
                        'rule*0*state_property_attribute_value_minimum_type',
                        'rule*0*state_property_attribute_value_maximum',
                        'rule*0*state_property_attribute_value_maximum_type',
                        'rule*1*add_button',
                        'rule*1*delete_button',
                        'rule*1*rule_separator',
                        'rule*1*state_property_attribute',
                        'rule*1*variable_type',
                        'rule*1*condition_test',
                        'rule*1*state_property_attribute_value_comparison',
                        'rule*1*state_property_attribute_value_minimum',
                        'rule*1*state_property_attribute_value_minimum_type',
                        'rule*1*state_property_attribute_value_maximum',
                        'rule*1*state_property_attribute_value_maximum_type',
                        'rule*2*rule_separator',
                        'rule*2*state_property_attribute',
                        'rule*2*variable_type',
                        'rule*2*condition_test',
                        'rule*2*state_property_attribute_value_comparison',
                        'rule*2*state_property_attribute_value_minimum',
                        'rule*2*state_property_attribute_value_minimum_type',
                        'rule*2*state_property_attribute_value_maximum',
                        'rule*2*state_property_attribute_value_maximum_type',
                        'rule*3*rule_separator',
                        'rule*3*state_property_attribute',
                        'rule*3*variable_type',
                        'rule*3*condition_test',
                        'rule*3*state_property_attribute_value_comparison',
                        'rule*3*state_property_attribute_value_minimum',
                        'rule*3*state_property_attribute_value_minimum_type',
                        'rule*3*state_property_attribute_value_maximum',
                        'rule*3*state_property_attribute_value_maximum_type',
                        'plus_counter',
                        'minus_counter',
                        'outputheader',
                        'condition_adverse_codes',
                        'condition_adverse_codes_type',
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
                  renderFormElements: {
                    'rule*0*condition_test': 'func:window.comparatorFilterTwo',
                    'rule*1*condition_test': 'func:window.comparatorFilterTwo',
                    'rule*1*state_property_attribute_value_minimum': 'func:window.minimumFilterTwo',
                    'rule*1*state_property_attribute_value_maximum': 'func:window.maximumFilterTwo',
                    'rule*1*state_property_attribute_value_minimum_type': 'func:window.minimumFilterTwo',
                    'rule*1*state_property_attribute_value_maximum_type': 'func:window.maximumFilterTwo',
                    'rule*1*state_property_attribute_value_comparison': 'func:window.valueFilterTwo',
                    'rule*1*variable_type': 'func:window.variableTypeFilterTwo',
                    'rule*1*': 'func:window.addNewConditionFilterTwo',
                    'rule*1*state_property_attribute': 'func:window.variableDropdownFilter',
                    'rule*1*rule_separator': 'func:window.ruleSeparaterFilter',
                    'rule*2*condition_test': 'func:window.comparatorFilterTwo',
                    'rule*0*state_property_attribute_value_minimum': 'func:window.minimumFilterTwo',
                    'rule*0*state_property_attribute_value_maximum': 'func:window.maximumFilterTwo',
                    'rule*0*state_property_attribute_value_minimum_type': 'func:window.minimumFilterTwo',
                    'rule*0*state_property_attribute_value_maximum_type': 'func:window.maximumFilterTwo',
                    'rule*2*state_property_attribute_value_minimum': 'func:window.minimumFilterTwo',
                    'rule*2*state_property_attribute_value_maximum': 'func:window.maximumFilterTwo',
                    'rule*2*state_property_attribute_value_minimum_type': 'func:window.minimumFilterTwo',
                    'rule*2*state_property_attribute_value_maximum_type': 'func:window.maximumFilterTwo',
                    'rule*0*state_property_attribute_value_comparison': 'func:window.valueFilterTwo',
                    'rule*2*state_property_attribute_value_comparison': 'func:window.valueFilterTwo',
                    'rule*0*variable_type': 'func:window.variableTypeFilterTwo',
                    'rule*2*variable_type': 'func:window.variableTypeFilterTwo',
                    'rule*2*': 'func:window.addNewConditionFilterTwo',
                    'rule*0*state_property_attribute': 'func:window.variableDropdownFilter',
                    'rule*2*state_property_attribute': 'func:window.variableDropdownFilter',
                    'rule*2*rule_separator': 'func:window.ruleSeparaterFilter',
                    'rule*3*rule_separator': 'func:window.ruleSeparaterFilter',
                    'rule*3*condition_test': 'func:window.comparatorFilterTwo',
                    'rule*3*state_property_attribute_value_minimum': 'func:window.minimumFilterTwo',
                    'rule*3*state_property_attribute_value_maximum': 'func:window.maximumFilterTwo',
                    'rule*3*state_property_attribute_value_minimum_type': 'func:window.minimumFilterTwo',
                    'rule*3*state_property_attribute_value_maximum_type': 'func:window.maximumFilterTwo',
                    'rule*3*state_property_attribute_value_comparison': 'func:window.valueFilterTwo',
                    'rule*3*variable_type': 'func:window.variableTypeFilterTwo',
                    'rule*3*': 'func:window.addNewConditionFilterTwo',
                    'rule*3*state_property_attribute': 'func:window.variableDropdownFilter',
                    'rule*3*rule_separator': 'func:window.ruleSeparaterFilter',
                    'plus_counter': 'func:window.plusCounterFilter',
                    'minus_counter': 'func:window.minusCounterFilter',
                  },
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
                      form_name: 'name',
                      form_val: 'name',
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

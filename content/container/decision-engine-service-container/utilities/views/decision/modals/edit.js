'use strict';

const moment = require('moment');
const shared_utilities = require('../shared');
const styles = require('../../constants').styles;
const randomKey = Math.random;
const formConfig = shared_utilities.components.formConfigs;
const pluralize = require('pluralize');

function editModal(options) {
  let { validations, hiddenFields, formgroups } = formConfig[ options.type ].edit;
  let pluralizedType = pluralize(options.type);
  let pluralizedDependency = pluralize(options.dependency);
  let pathname = (options.category && options.type !== 'strategy')
    ? `/decision/${pluralizedDependency}/${options.category}/:id/edit`
    : (options.category)
      ? `/decision/${pluralizedDependency}/:id/edit/${options.category}`
      : `/decision/${pluralizedDependency}/:id/edit`

  let onChange = (options.dependency === 'rule') ? 'func:window.on_change_comparator' : '';
  let onSubmitUrl = (options.type === 'strategy') ? `/decision/api/standard_${pluralizedDependency}/:id?method=add` : `/decision/api/standard_${pluralizedDependency}/:id?collection=rule`
  validations = validations[ options.category ] || validations;
  hiddenFields = hiddenFields[ options.category ] || hiddenFields || [];
  formgroups = formgroups.edit_modal;
  formgroups = (options.category) ? formgroups[ options.category ] : formgroups;
  let form = (options.type === 'strategy' && options.category === 'ruleset') ? {
    component: 'ResponsiveFormContainer',
    asyncprops: {
      formdata: [ `${options.dependency}data`, 'data' ],
      __formOptions: [ `${options.dependency}data`, 'formoptions' ],
    },
    props: {
      formgroups,
      validations: {
        type: {
          'name': 'type',
          'constraints': {
            'type': {
              'presence': { 'message': '^Rule Set Type is required.' },
            },
          },
        },
        ruleset: {
          'name': 'ruleset',
          'constraints': {
            'ruleset': {
              'presence': { 'message': '^Rule Set is required.' },
            },
          },
        },
        conditions_check: {
          'name': 'conditions_check',
          'constraints': {
            'conditions_check': {
              'presence': { 'message': '^Applicable Population is required.' },
            },
          },
        },
        conditions: {
          'name': 'conditions',
          'constraints': {
            'conditions': {
              'presence': { 'message': '^Population Rule Set is required.' },
            },
          },
        },
      },
      renderFormElements: {
        type: 'func:window.rulesetTypeFilter',
        ruleset: 'func:window.selectRulesetFilter',
        conditions_check: 'func:window.applicablePopulationFilter',
        conditions: 'func:window.selectPopulationFilter',
      },
      form: {
        flattenFormData: true,
        footergroups: false,
        useFormOptions: true,
        onChange,
        onSubmit: {
          url: onSubmitUrl,
          params: [
            { 'key': ':id', 'val': '_id', },
          ],
          options: {
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'PUT',
          },
          success: true,
          successCallback: 'func:this.props.hideModal',
          successProps: 'last',
          responseCallback: 'func:this.props.refresh',
        },
        validations: [],
        hiddenFields: [],
        formgroups: [],
      }
    }
  } : {
      component: 'ResponsiveForm',
      props: {
        flattenFormData: true,
        footergroups: false,
        useFormOptions: true,
        onChange,
        onSubmit: {
          url: onSubmitUrl,
          params: [
            { 'key': ':id', 'val': '_id', },
          ],
          options: {
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'PUT',
          },
          success: true,
          successCallback: 'func:this.props.hideModal',
          successProps: 'last',
          responseCallback: 'func:this.props.refresh',
        },
        validations,
        hiddenFields,
        formgroups,
      },
      asyncprops: {
        formdata: [ `${options.dependency}data`, 'data' ],
        __formOptions: [ `${options.dependency}data`, 'formoptions' ],
      },
    };
  return {
    'containers': {
      [ pathname ]: {
        layout: {
          component: 'Hero',
          props: {
          },
          children: [ form ],
        },
        'resources': Object.assign({}, {
          [ `${options.dependency}data` ]: `/decision/api/standard_${pluralizedDependency}/:id?modal=true&edit=true&format=json&type=${options.category}`,
          checkdata: {
            url: '/auth/run_checks',
            options: {
              onSuccess: [ 'func:window.redirect', ],
              onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
              blocking: true, 
              renderOnError: false,
            },
          },
        }, options.resources),
        'callbacks': ['func:window.dynamicModalHeight'],
        'pageData': {
          'title': 'DigiFi | Decision Engine',
          'navLabel': 'Decision Engine',
        },
        'onFinish': 'render',
      },
    },
  };
}

module.exports = editModal;
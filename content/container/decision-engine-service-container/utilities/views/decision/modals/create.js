'use strict';

const moment = require('moment');
const shared_utilities = require('../shared');
const styles = require('../../constants').styles;
const randomKey = Math.random; 
const formConfig = shared_utilities.components.formConfigs;
const pluralize = require('pluralize');

function createModal(options) {
  let { validations, hiddenFields, formgroups } = formConfig[ options.type ].create;
  let pluralizedType = pluralize(options.type);
  let pathname = (options.category) ? `/decision/${pluralizedType}/${options.category}/new` : `/decision/${pluralizedType}/new`;
  validations = validations[options.category] ||  validations;
  hiddenFields = hiddenFields[options.category] ||  hiddenFields;
  formgroups = formgroups[ options.category ] || formgroups;
  let form = (pluralizedType === 'variables') ? {
    component: 'ResponsiveForm',
    props: {
      flattenFormData: true,
      footergroups: false,
      useFormOptions: true,
      onChange: 'func:window.checkVariableSystemName',
      onSubmit: {
        url: `/decision/api/standard_${pluralizedType}`,
        options: {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
        successCallback: 'func:window.closeModalAndCreateNotification',
        successProps: {
          text: 'Changes saved successfully!',
          timeout: 10000,
          type: 'success',
        },
        responseCallback: 'func:this.props.reduxRouter.push',
      },
      validations,
      hiddenFields,
      formgroups,
    },
    asyncprops: {
      formdata: [ `${options.type}data`, 'data' ],
      __formOptions: [ `${options.type}data`, 'formoptions' ],
    },
  } : {
    component: 'ResponsiveForm',
    props: {
      flattenFormData: true,
      footergroups: false,
      useFormOptions: true,
      onSubmit: {
        url: `/decision/api/standard_${pluralizedType}`,
        options: {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
        successCallback: 'func:window.closeModalAndCreateNotification',
        successProps: {
          text: 'Changes saved successfully!',
          timeout: 10000,
          type: 'success',
        },
        responseCallback: 'func:this.props.reduxRouter.push',
      },
      validations,
      hiddenFields,
      formgroups,
    },
    asyncprops: {
      formdata: [ `${options.type}data`, 'data' ],
      __formOptions: [ `${options.type}data`, 'formoptions' ],
    },
  }
  
  return {
    'containers': {
      [pathname]: {
        layout: {
          component: 'Hero',
          props: {
          },
          children: [form,],
        },
        'resources': {
          checkdata: {
            url: '/auth/run_checks',
            options: {
              onSuccess: [ 'func:window.redirect', ],
              onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
              blocking: true, 
              renderOnError: false,
            },
          },
        },
        'callbacks': (pluralizedType === 'variables') ? ['func:window.dynamicModalHeight', 'func:window.hideVariableSystemName'] : ['func:window.dynamicModalHeight'],
        'pageData': {
          'title': 'DigiFi | Decision Engine',
          'navLabel': 'Decision Engine',
        },
        'onFinish': 'render',
      },
    },
  };
}

module.exports = createModal;
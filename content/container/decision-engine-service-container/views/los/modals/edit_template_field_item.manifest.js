'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    [ '/los/templates/:id/edit_field_item/:idx' ]: {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [
          {
            component: 'ResponsiveFormContainer',
            asyncprops: {
              formdata: [ 'templatedata', 'data', ],
              __formOptions: [ 'templatedata', 'formoptions', ],
            },
            props: {
              formgroups: [
                {
                  gridProps: {
                    key: randomKey(),
                  },
                  formElements: [ {
                    name: 'value',
                    customLabel: {
                      component: 'span',
                      thisprops: {
                        children: [ 'formdata', 'name', ],
                      },
                    },
                    layoutProps: {
                      style: {
                        width: '70%',
                        paddingRight: '7px',
                        display: 'inline-block',
                        verticalAlign: 'top',
                      },
                    },
                  }, {
                    type: 'dropdown',
                    name: 'value_type',
                    passProps: {
                      selection: true,
                      fluid: true,
                      selectOnBlur: false,
                    },
                    label: 'Value Type',
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
                    options: [ {
                      label: 'Variable',
                      value: 'variable',
                    }, {
                      label: 'Value',
                      value: 'value',
                    }, ],
                  },
                  ],
                },
                {
                  gridProps: {
                    key: randomKey(),
                    className: 'modal-footer-btns',
                  },
                  formElements: [ {
                    type: 'submit',
                    value: 'SAVE CHANGES',
                    passProps: {
                      color: 'isPrimary',
                    },
                    layoutProps: {},
                  },
                  ],
                }, ],
              renderFormElements: {
                'value': 'func:window.losTemplateFieldValueFilter',
              },
              form: {
                flattenFormData: true,
                footergroups: false,
                useFormOptions: true,
                setInitialValues: false,
                'onSubmit': {
                  url: '/los/api/templates/:id?format=json&type=patch_field_item',
                  options: {
                    method: 'PUT',
                  },
                  params: [ { key: ':id', val: '_id', }, ],
                  successCallback: 'func:window.closeModalAndCreateNotification',
                  successProps: {
                    text: 'Changes saved successfully!',
                    timeout: 10000,
                    type: 'success',
                  },
                  responseCallback: 'func:this.props.refresh',
                },
                hiddenFields: [ {
                  'form_name': 'name',
                  'form_val': 'name',
                }, ],
              },
            },
          }, ],
      },
      'resources': {
        templatedata: '/los/api/templates/:id/field/:idx',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: [ 'func:window.redirect', ],
            onError: [ 'func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      callbacks: [ 'func:window.setHeaders', ],
      'onFinish': 'render',
    },
  },
};
'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    [ '/los/products/:id/add_template_item' ]: {
      layout: {
        privileges: [ 101, 102, 103, ],
        component: 'Container',
        props: {},
        children: [
          {
            component: 'ResponsiveFormContainer',
            asyncprops: {
              formdata: [ 'urldata', ],
            },
            props: {
              formgroups: [
                {
                  gridProps: {
                    key: randomKey(),
                  },
                  formElements: [ {
                    name: 'name',
                    label: 'Description',
                  }, ],
                }, {
                  gridProps: {
                    className: '__dynamic_form_elements',
                    key: randomKey(),
                  },
                  formElements: [{
                    type: 'dropdown',
                    name: 'value_type',
                    passProps: {
                      selection: true,
                      fluid: true,
                      selectOnBlur: false,
                    },
                    label: 'Data Type',
                    options: [ {
                      label: 'Text',
                      value: 'text',
                    }, {
                      label: 'Monetary',
                      value: 'monetary',
                    }, {
                      label: 'Percentage',
                      value: 'percentage',
                    }, {
                      label: 'Number',
                      value: 'number',
                    }, {
                      label: 'Date',
                      value: 'date',
                    }, {
                      label: 'True/False',
                      value: 'boolean',
                    } ],
                  },  {
                    name: 'value',
                    customLabel: {
                      component: 'span',
                      children: [ {
                        component: 'span',
                        children: 'Default Value',
                      }, {
                        component: 'span',
                        children: 'Optional',
                        props: {
                          style: {
                            fontStyle: 'italic',
                            marginLeft: '2px',
                            fontWeight: 'normal',
                            color: '#969696',
                          },
                        },
                      }, ],
                    },
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
                    value: 'ADD ITEM',
                    passProps: {
                      color: 'isPrimary',
                    },
                    layoutProps: {},
                  },
                  ],
                }, ],
              renderFormElements: {
                'value': 'func:window.losProductItemValueFilter',
              },
              form: {
                flattenFormData: true,
                footergroups: false,
                setInitialValues: false,
                'onSubmit': {
                  url: '/los/api/products/:id?format=json&type=patch_template_item',
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
              },
            },

          }, ],
      },
      'resources': {
        urldata: '/los/api/get_parsed_url?parsed_id=3',
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

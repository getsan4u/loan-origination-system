'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    [ '/los/companies/:id/edit_key_information/:idx' ]: {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [
          {
            component: 'ResponsiveFormContainer',
            asyncprops: {
              formdata: [ 'companydata', 'data', ],
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
                    key: randomKey(),
                  },
                  formElements: [ {
                    name: 'value',
                    label: 'Value',
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
                'value': 'func:window.losKeyInfoValueFilter',
              },
              form: {
                flattenFormData: true,
                footergroups: false,
                setInitialValues: false,
                'onSubmit': {
                  url: '/los/api/customers/companies/:id?format=json&type=patch_key_information',
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
        companydata: '/los/api/customers/companies/:id/key_information/:idx',
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
    [ '/los/people/:id/edit_key_information/:idx' ]: {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [
          {
            component: 'ResponsiveFormContainer',
            asyncprops: {
              formdata: ['peopledata', 'data',],
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
                    key: randomKey(),
                  },
                  formElements: [ {
                    name: 'value',
                    label: 'Value',
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
                'value': 'func:window.losKeyInfoValueFilter',
              },
              form: {
                flattenFormData: true,
                footergroups: false,
                setInitialValues: false,
                'onSubmit': {
                  url: '/los/api/customers/people/:id?format=json&type=patch_key_information',
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
        peopledata: '/los/api/customers/people/:id/key_information/:idx',
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
    [ '/los/intermediaries/:id/edit_key_information/:idx' ]: {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [
          {
            component: 'ResponsiveFormContainer',
            asyncprops: {
              formdata: [ 'intermediarydata', 'data', ],
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
                    key: randomKey(),
                  },
                  formElements: [ {
                    name: 'value',
                    label: 'Value',
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
                'value': 'func:window.losKeyInfoValueFilter',
              },
              form: {
                flattenFormData: true,
                footergroups: false,
                setInitialValues: false,
                'onSubmit': {
                  url: '/los/api/intermediaries/:id?format=json&type=patch_key_information',
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
        intermediarydata: '/los/api/intermediaries/:id/key_information/:idx',
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

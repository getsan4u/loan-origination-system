'use strict';
const moment = require('moment');
const pluralize = require('pluralize');
const utilities = require('../../../utilities');
const styles = utilities.views.constants.styles;
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/los/applications/new/new_customer': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [ {
          component: 'ResponsiveFormContainer',
          asyncprops: {
            __formOptions: [ 'applicationdata', 'formoptions' ],
            formdata: [ 'applicationdata', 'formdata' ],
          },
          props: {
            formgroups: [
              {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  name: 'product',
                  validateOnChange: true,
                  leftIcon: 'fas fa-star',
                  customLabel: {
                    component: 'span',
                    props: {
                      className: '__re-bulma_label',
                      style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                      }
                    },
                    children: [ {
                      component: 'span',
                      children: 'Product',
                    }, {
                      component: 'label',
                      props: {
                        style: {
                          textAlign: 'right',
                        }
                      },
                      children: [ {
                        component: 'ResponsiveButton',
                        children: 'Add New Product',
                        props: {
                          onClick: 'func:window.closeModalAndCreateNewModal',
                          onclickProps: {
                            title: 'Add New Product',
                            pathname: '/los/products/new',
                          },
                          style: {
                            display: 'inline-block',
                            lineHeight: 1,
                            fontWeight: 'normal',
                            cursor: 'pointer',
                            border: 'transparent',
                          },
                        },
                      }, ]
                    }, ],
                  },
                  errorIconRight: true,
                  type: 'dropdown',
                  passProps: {
                    selection: true,
                    fluid: true,
                    search: true,
                    selectOnBlur: false,
                  },
                }, ],
              },
              {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  name: 'customer_name',
                  label: 'Customer Name',
                  leftIcon: 'fas fa-user',
                  validateOnBlur: true,
                  errorIconRight: true,
                  onBlur: true,
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                  style: { textAlign: 'right', },
                  className: '__dynamic_form_elements',
                },
                formElements: [ {
                  type: 'Semantic.checkbox',
                  label: 'Add a Co-Applicant',
                  passProps: { className: 'reverse-label', },
                  layoutProps: {
                    style: {
                      marginBottom: '0'
                    },
                  },
                  name: 'has_coapplicant',
                }, ],
              },
              {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [
                  {
                    type: 'maskedinput',
                    leftIcon: 'fas fa-usd-circle',
                    name: 'loan_amount',
                    placeholder: undefined,
                    createNumberMask: true,
                    validateOnBlur: true,
                    errorIconRight: true,
                    onBlur: true,
                    passProps: {
                      mask: 'func:window.testMaskDollarInput',
                      guide: false,
                      autoComplete: 'off',
                      autoCorrect: 'off',
                      autoCapitalize: 'off',
                      spellCheck: false,
                    },
                    label: 'Loan Amount',
                  },
                ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  type: 'progress',
                  passProps: {
                    unstackable: true,
                  },
                  label: 'Application Status',
                  name: 'status',
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  type: 'group',
                  name: '',
                  label: '',
                  layoutProps: {
                    style: {
                    },
                  },
                  groupElements: [ {
                    name: 'createdat',
                    passProps: {
                      state: 'isDisabled',
                    },
                    label: 'Date Created',
                    leftIcon: 'fas fa-calendar-alt',
                  }, {
                    type: 'singleDatePicker',
                    name: 'estimated_close_date',
                    leftIcon: 'fas fa-calendar-check',
                    customLabel: {
                      component: 'span',
                      children: [ {
                        component: 'span',
                        children: 'Estimated Close Date',
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
                    layoutProps: {
                      className: 'create-application'
                    },
                    passProps: {
                      placeholder: '',
                      hideKeyboardShortcutsPanel: true,
                    },
                  }, ],
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  label: 'Team Members',
                  name: 'team_members',
                  type: 'dropdown',
                  leftIcon: 'fas fa-users',
                  validateOnChange: true,
                  errorIconRight: true,
                  passProps: {
                    selection: true,
                    multiple: true,
                    fluid: true,
                    search: true,
                  },
                },
                ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  name: 'intermediary',
                  leftIcon: 'fas fa-seedling',
                  customLabel: {
                    component: 'span',
                    children: [ {
                      component: 'span',
                      children: 'Intermediary',
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
                  type: 'dropdown',
                  errorIconRight: true,
                  validateOnChange: true,
                  errorIcon: 'fa fa-exclamation',
                  validIcon: 'fa fa-check',
                  passProps: {
                    selection: true,
                    fluid: true,
                    search: true,
                    selectOnBlur: false,
                  },
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  name: 'labels',
                  leftIcon: 'fas fa-tags',
                  type: 'dropdown',
                  passProps: {
                    selection: true,
                    multiple: true,
                    fluid: true,
                    search: true,
                  },
                  customLabel: {
                    component: 'span',
                    children: [ {
                      component: 'span',
                      children: 'Labels',
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
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [ {
                  type: 'submit',
                  value: 'CREATE APPLICATION',
                  passProps: {
                    color: 'isPrimary',
                  },
                  layoutProps: {},
                },
                ],
              },
            ],
            validations: {
              loan_amount: {
                'name': 'loan_amount',
                'constraints': {
                  'loan_amount': {
                    'presence': {
                      'message': '^Loan Amount is required.',
                    },
                  },
                },
              },
              customer_name: {
                'name': 'customer_name',
                'constraints': {
                  'customer_name': {
                    'presence': {
                      'message': '^Customer Name is required.',
                    },
                  },
                },
              },
              status: {
                'name': 'status',
                'constraints': {
                  'status': {
                    'presence': {
                      'message': '^Application Status is required.',
                    },
                  },
                },
              },
              product: {
                'name': 'product',
                'constraints': {
                  'product': {
                    'presence': {
                      'message': '^Product is required.',
                    },
                  },
                },
              },
              team_members: {
                'name': 'team_members',
                'constraints': {
                  'team_members': {
                    'presence': {
                      'message': '^Team Members is required.',
                    },
                  },
                },
              },
            },
            renderFormElements: {
              'has_coapplicant': 'func:window.losNewCustomerHasCoApplicantFilter',
              'coapplicant': 'func:window.losNewCustomerCoApplicantFilter',
            },
            form: {
              flattenFormData: true,
              footergroups: false,
              useFormOptions: true,
              setInitialValues: false,
              'onSubmit': {
                url: '/los/api/applications?type=new&format=json',
                options: {
                  method: 'POST',
                },
                successCallback: 'func:window.closeModalAndCreateNotification',
                successProps: {
                  text: 'Changes saved successfully!',
                  timeout: 10000,
                  type: 'success',
                },
                responseCallback: 'func:this.props.reduxRouter.push',
              }
            },
          },
        },
        ],
      },
      'resources': {
        applicationdata: '/los/api/applications/new?type=new',
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
    '/los/applications/new/existing_customer': {
      layout: {
        privileges: [ 101, 102, 103 ],
        component: 'Container',
        props: {},
        children: [
          {
            component: 'ResponsiveFormContainer',
            asyncprops: {
              __formOptions: [ 'applicationdata', 'formoptions' ],
              formdata: [ 'applicationdata', 'formdata' ],
            },
            props: {
              validations: {
                customer_name: {
                  'name': 'customer_name',
                  'constraints': {
                    'customer_name': {
                      'presence': {
                        'message': '^Customer Name is required.',
                      },
                    },
                  },
                },
                status: {
                  'name': 'status',
                  'constraints': {
                    'status': {
                      'presence': {
                        'message': '^Application Status is required.',
                      },
                    },
                  },
                },
                loan_amount: {
                  'name': 'loan_amount',
                  'constraints': {
                    'loan_amount': {
                      'presence': {
                        'message': '^Loan Amount is required.',
                      },
                    },
                  },
                },
                product: {
                  'name': 'product',
                  'constraints': {
                    'product': {
                      'presence': {
                        'message': '^Product is required.',
                      },
                    },
                  },
                },
                team_members: {
                  'name': 'team_members',
                  'constraints': {
                    'team_members': {
                      'presence': {
                        'message': '^Team Members is required.',
                      },
                    },
                  },
                },
              },
              formgroups: [ {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  name: 'product',
                  leftIcon: 'fas fa-star',
                  errorIconRight: true,
                  validateOnChange: true,
                  customLabel: {
                    component: 'span',
                    props: {
                      className: '__re-bulma_label',
                      style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                      }
                    },
                    children: [ {
                      component: 'span',
                      children: 'Product',
                    }, {
                      component: 'label',
                      props: {
                        style: {
                          textAlign: 'right',
                        }
                      },
                      children: [ {
                        component: 'ResponsiveButton',
                        children: 'Add New Product',
                        props: {
                          onClick: 'func:window.closeModalAndCreateNewModal',
                          onclickProps: {
                            title: 'Add New Product',
                            pathname: '/los/products/new',
                          },
                          style: {
                            display: 'inline-block',
                            lineHeight: 1,
                            fontWeight: 'normal',
                            cursor: 'pointer',
                            border: 'transparent',
                          },
                        },
                      }, ]
                    }, ],
                  },
                  errorIcon: 'fa fa-exclamation',
                  validIcon: 'fa fa-check',
                  type: 'dropdown',
                  passProps: {
                    selection: true,
                    fluid: true,
                    search: true,
                    selectOnBlur: false,
                  },
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  name: 'customer_name',
                  label: 'Customer Name',
                  leftIcon: 'fas fa-user',
                  type: 'dropdown',
                  errorIconRight: true,
                  validateOnChange: true,
                  errorIcon: 'fa fa-exclamation',
                  validIcon: 'fa fa-check',
                  passProps: {
                    selection: true,
                    fluid: true,
                    search: true,
                    selectOnBlur: false,
                  },
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                  style: { textAlign: 'right', },
                  className: '__dynamic_form_elements',
                },
                formElements: [ {
                  type: 'Semantic.checkbox',
                  label: 'Add a Co-Applicant',
                  passProps: { className: 'reverse-label', },
                  layoutProps: {
                    style: {
                      marginBottom: '0'
                    },
                  },
                  name: 'has_coapplicant',
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  type: 'maskedinput',
                  name: 'loan_amount',
                  leftIcon: 'fas fa-usd-circle',
                  placeholder: undefined,
                  createNumberMask: true,
                  validateOnBlur: true,
                  errorIconRight: true,
                  onBlur: true,
                  passProps: {
                    mask: 'func:window.testMaskDollarInput',
                    guide: false,
                    autoComplete: 'off',
                    autoCorrect: 'off',
                    autoCapitalize: 'off',
                    spellCheck: false,
                  },
                  label: 'Loan Amount',
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  type: 'progress',
                  passProps: {
                    unstackable: true,
                  },
                  label: 'Application Status',
                  name: 'status',
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  type: 'group',
                  name: '',
                  label: '',
                  layoutProps: {
                    style: {
                    },
                  },
                  groupElements: [ {
                    name: 'createdat',
                    leftIcon: 'fas fa-calendar-alt',
                    passProps: {
                      state: 'isDisabled',
                    },
                    label: 'Date Created',
                  }, {
                    type: 'singleDatePicker',
                    name: 'estimated_close_date',
                    leftIcon: 'fas fa-calendar-check',
                    layoutProps: {
                      className: 'create-application'
                    },
                    customLabel: {
                      component: 'span',
                      children: [ {
                        component: 'span',
                        children: 'Estimated Close Date',
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
                    passProps: {
                      placeholder: '',
                      hideKeyboardShortcutsPanel: true,
                    },
                  }, ],
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  label: 'Team Members',
                  name: 'team_members',
                  leftIcon: 'fas fa-user',
                  type: 'dropdown',
                  validateOnChange: true,
                  errorIconRight: true,
                  passProps: {
                    selection: true,
                    multiple: true,
                    fluid: true,
                    search: true,
                  },
                  options: [],
                },
                ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  name: 'intermediary',
                  leftIcon: 'fas fa-seedling',
                  customLabel: {
                    component: 'span',
                    children: [ {
                      component: 'span',
                      children: 'Intermediary',
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
                  type: 'dropdown',
                  errorIconRight: true,
                  validateOnChange: true,
                  errorIcon: 'fa fa-exclamation',
                  validIcon: 'fa fa-check',
                  passProps: {
                    selection: true,
                    fluid: true,
                    search: true,
                    selectOnBlur: false,
                  },
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                },
                formElements: [ {
                  name: 'labels',
                  type: 'dropdown',
                  leftIcon: 'fas fa-tags',
                  passProps: {
                    selection: true,
                    multiple: true,
                    fluid: true,
                    search: true,
                  },
                  customLabel: {
                    component: 'span',
                    children: [ {
                      component: 'span',
                      children: 'Labels',
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
                }, ],
              }, {
                gridProps: {
                  key: randomKey(),
                  className: 'modal-footer-btns',
                },
                formElements: [ {
                  type: 'submit',
                  value: 'CREATE APPLICATION',
                  passProps: {
                    color: 'isPrimary',
                  },
                  layoutProps: {},
                },
                ],
              },
              ],
              renderFormElements: {
                'customer_name': 'func:window.losCreateAppCustomerNameFilter',
                'has_coapplicant': 'func:window.losHasCoApplicantFilter',
                'coapplicant': 'func:window.losCoApplicantFilter',
              },
              form: {
                setInitialValues: false,
                flattenFormData: true,
                footergroups: false,
                useFormOptions: true,
                'onSubmit': {
                  url: '/los/api/applications?type=existing&format=json',
                  options: {
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
              },
            },

          }, ],
      },
      'resources': {
        applicationdata: '/los/api/applications/new?type=existing',
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
    }
  },
};
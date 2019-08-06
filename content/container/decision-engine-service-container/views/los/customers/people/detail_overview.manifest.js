'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../../utilities');
const cardprops = utilities.views.shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const buttonAsyncHeaderTitle = utilities.views.shared.component.layoutComponents.buttonAsyncHeaderTitle;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
const formElements = utilities.views.shared.props.formElements.formElements;
const losTabs = utilities.views.los.components.losTabs;
const peopleTabs = utilities.views.los.components.peopleTabs;
const peopleNotes = utilities.views.los.components.peopleNotes;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/los/people/:id': {
      layout: {
        component: 'div',
        privileges: [ 101, 102, 103, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          losTabs('Customers'),
          buttonAsyncHeaderTitle({
            type: 'people',
            title: true,
          }, {
            component: 'ResponsiveButton',
            props: {
              onclickProps: {
                title: 'Edit Name',
                pathname: '/los/people/:id/rename',
                params: [ { key: ':id', val: '_id', }, ],
              },
              onClick: 'func:this.props.createModal',
              spanProps: {
                className: '__ra_rb button_page_title'
              },
            },
            asyncprops: {
              onclickPropObject: [ 'peopledata', 'person' ],
              children: [ 'peopledata', 'data', 'display_title' ],
            },
          }),
          peopleTabs(''),
          {
            component: 'Container',
            props: {
            },
            children: [ {
              component: 'Columns',
              children: [ {
                component: 'Column',
                props: {
                  style: {},
                },
                children: [ {
                  component: 'ResponsiveForm',
                  asyncprops: {
                    formdata: [ 'peopledata', 'person', ],
                    peopledata: [ 'peopledata', ],
                    __formOptions: [ 'peopledata', 'formoptions', ],
                  },
                  props: {
                    flattenFormData: true,
                    footergroups: false,
                    onSubmit: {
                      url: '/los/api/customers/people/:id',
                      params: [ { key: ':id', val: '_id', }, ],
                      'options': {
                        'method': 'PUT',
                      },
                      successCallback: [ 'func:this.props.refresh', 'func:this.props.createNotification', ],
                      successProps: [ null, {
                        type: 'success',
                        text: 'Changes saved successfully!',
                        timeout: 10000,
                      },
                      ],
                    },
                    validations: [
                    ],
                    formgroups: [
                      formGlobalButtonBar({
                        left: [ {
                          component: 'ResponsiveButton',
                          children: 'CREATE APPLICATION',
                          asyncprops: {
                            buttondata: [ 'peopledata', 'data', ],
                          },
                          props: {
                            onclickThisProp: [ 'buttondata', ],
                            onclickProps: {
                              title: 'Create Application (Existing Customer)',
                              pathname: '/los/applications/new/existing_customer',
                            },
                            buttonProps: {
                              color: 'isSuccess',
                            },
                            onClick: 'func:this.props.createModal',
                          },
                        }, ],
                        right: [ {
                          type: 'submit',
                          value: 'SAVE',
                          passProps: {
                            color: 'isPrimary',
                          },
                          layoutProps: {
                            className: 'global-button-save',
                          },
                        },
                        ],
                      }),
                      {
                        gridProps: {
                          key: randomKey(),
                          style: {
                            display: 'inline-block',
                            width: '50%',
                            margin: 0,
                          },
                          subColumnProps: {
                            style: {
                              padding: '0 10px 0 0',
                            }
                          }
                        },
                        card: {
                          props: cardprops({
                            cardTitle: 'Personal Information',
                            cardStyle: {
                              marginBottom: 0,
                            },
                          }),
                        },
                        formElements: [ {
                          type: 'text',
                          name: 'job_title',
                          leftIcon: 'fas fa-user',
                          label: 'Job Title',
                          passProps: {
                          },
                        }, {
                          type: 'dropdown',
                          name: 'company',
                          leftIcon: 'fas fa-building',
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
                              children: 'Company',
                            }, {
                              component: 'label',
                              props: {
                                style: {
                                  textAlign: 'right',
                                }
                              },
                              children: [ {
                                component: 'ResponsiveButton',
                                children: 'Add New Company',
                                props: {
                                  onClick: 'func:this.props.createModal',
                                  onclickProps: {
                                    title: 'Add New Company',
                                    pathname: '/los/people/new/new_company',
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
                          passProps: {
                            selection: true,
                            fluid: true,
                            search: true,
                            selectOnBlur: false,
                          },
                        }, {
                          type: 'text',
                          name: 'email',
                          leftIcon: 'fas fa-envelope',
                          label: 'Email Address',
                          'errorIcon': 'fa fa-exclamation',
                        }, {
                          type: 'maskedinput',
                          name: 'phone',
                          label: 'Phone Number',
                          leftIcon: 'fas fa-phone rotated',
                          passProps: {
                            guide: false,
                            mask: 'func:window.phoneNumberFormatter',
                            autoComplete: 'off',
                            autoCorrect: 'off',
                            autoCapitalize: 'off',
                            spellCheck: false,
                          },
                          'errorIcon': 'fa fa-exclamation',
                        }, {
                          type: 'text',
                          name: 'address',
                          leftIcon: 'far fa-map-marker-alt',
                          label: 'Home Address',
                          'errorIcon': 'fa fa-exclamation',
                        }, {
                          type: 'singleDatePicker',
                          name: 'dob',
                          label: 'Date of Birth',
                          leftIcon: 'fas fa-calendar-alt',
                          passProps: {
                            placeholder: '',
                            hideKeyboardShortcutsPanel: true,
                          },
                        },

                        {
                          type: 'maskedinput',
                          name: 'ssn',
                          label: 'Social Security Number',
                          leftIcon: 'fas fa-lock-alt',
                          passProps: {
                            mask: 'func:window.SSNFormatter',
                            guide: false,
                            autoComplete: 'off',
                            autoCorrect: 'off',
                            autoCapitalize: 'off',
                            spellCheck: false,
                          },
                        }, {
                          type: 'group',
                          groupElements: [ {
                            type: 'text',
                            name: 'createdat',
                            label: 'Created',
                            leftIcon: 'fas fa-calendar-alt',
                            passProps: {
                              state: 'isDisabled',
                            },
                          }, {
                            type: 'text',
                            name: 'updatedat',
                            label: 'Updated',
                            leftIcon: 'fas fa-calendar-plus',
                            passProps: {
                              state: 'isDisabled',
                            },
                          }, ],
                        },

                        ],
                      },
                      {
                        gridProps: {
                          key: randomKey(),
                          style: {
                            display: 'inline-block',
                            width: '50%',
                            verticalAlign: 'top',
                            textAlign: 'right',
                            margin: 0,
                          },
                        },
                        formElements: [ {
                          type: 'layout',
                          layoutProps: {
                            style: {
                              padding: '0 0 0 10px',
                            }
                          },
                          value: {
                            component: 'div',
                            children: [ {
                              component: 'ResponsiveCard',
                              props: cardprops({
                                cardTitle: 'Key Information',
                                cardStyle: {},
                              }),
                              children: [ {
                                component: 'ResponsiveTable',
                                thisprops: {
                                  rows: [ 'peopledata', 'person', 'key_information', ],
                                },
                                props: {
                                  dataMap: [ {
                                    'key': 'rows',
                                    value: 'rows',
                                  }, ],
                                  flattenRowData: true,
                                  limit: 15,
                                  hasPagination: false,
                                  simplePagination: false,
                                  'useInputRows': true,
                                  headerLinkProps: {
                                    style: {
                                      textDecoration: 'none',
                                    },
                                  },
                                  headers: [ {
                                    label: 'Description',
                                    sortid: 'name',
                                    sortable: false,
                                  }, {
                                    label: 'Value',
                                    sortid: 'value',
                                    sortable: false,
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
                                    buttons: [ {
                                      passProps: {
                                        buttonProps: {
                                          icon: 'fa fa-pencil',
                                          className: '__icon_button',
                                        },
                                        onClick: 'func:this.props.createModal',
                                        onclickProps: {
                                          title: 'Edit Key Information',
                                          pathname: '/los/people/:id/edit_key_information/:idx',
                                          params: [ {
                                            key: ':id',
                                            val: '_id',
                                          }, {
                                            key: ':idx',
                                            val: 'idx',
                                          }, ],
                                        },
                                      },
                                    }, {
                                      passProps: {
                                        buttonProps: {
                                          icon: 'fa fa-trash',
                                          color: 'isDanger',
                                          className: '__icon_button',
                                        },
                                        onClick: 'func:this.props.fetchAction',
                                        onclickBaseUrl: '/los/api/customers/people/:id/key_information/:idx?type=delete_key_information',
                                        onclickLinkParams: [ {
                                          key: ':id',
                                          val: '_id',
                                        }, {
                                          key: ':idx',
                                          val: 'idx',
                                        }, ],
                                        fetchProps: {
                                          method: 'PUT',
                                        },
                                        successProps: {
                                          success: {
                                            notification: {
                                              text: 'Changes saved successfully!',
                                              timeout: 10000,
                                              type: 'success',
                                            },
                                          },
                                          successCallback: 'func:this.props.refresh',
                                        },
                                        confirmModal: Object.assign({}, styles.defaultconfirmModalStyle, {
                                          title: 'Delete Key Information',
                                          textContent: [ {
                                            component: 'p',
                                            children: 'Do you want to permanently delete this information?',
                                            props: {
                                              style: {
                                                textAlign: 'left',
                                                marginBottom: '1.5rem',
                                              },
                                            },
                                          }, ],
                                        }),
                                      },
                                    }, ],
                                  }, ],
                                },
                              }, {
                                thisprops: {
                                  onclickPropObject: [ 'peopledata', 'person', ],
                                },
                                component: 'ResponsiveButton',
                                children: 'ADD KEY INFORMATION ITEM',
                                props: {
                                  onClick: 'func:this.props.createModal',
                                  onclickProps: {
                                    title: 'Add Key Information Item',
                                    pathname: '/los/people/:id/add_key_information_item',
                                    params: [ {
                                      key: ':id',
                                      val: '_id',
                                    }, ],
                                  },
                                  buttonProps: {
                                    color: 'isSuccess',
                                  },
                                },
                              }, ],
                            }, {
                              component: 'ResponsiveCard',
                              props: cardprops({
                                cardTitle: 'Loan Applications',
                                cardStyle: {},
                              }),
                              children: [ {
                                component: 'ResponsiveTable',
                                thisprops: {
                                  rows: [ 'peopledata', 'person', 'person_applications', 'rows', ],
                                  numItems: [ 'peopledata', 'person', 'person_applications', 'numItems', ],
                                  numPages: [ 'peopledata', 'person', 'person_applications', 'numPages', ],
                                },
                                props: {
                                  dataMap: [ {
                                    'key': 'rows',
                                    value: 'rows',
                                  }, {
                                    'key': 'numItems',
                                    value: 'numItems',
                                  }, {
                                    'key': 'numPages',
                                    value: 'numPages',
                                  }, ],
                                  flattenRowData: true,
                                  limit: 5,
                                  hasPagination: true,
                                  simplePagination: true,
                                  'useInputRows': true,
                                  headerLinkProps: {
                                    style: {
                                      textDecoration: 'none',
                                    },
                                  },
                                  headers: [ {
                                    label: 'Date Created',
                                    sortid: 'createdat',
                                    sortable: true,
                                  }, {
                                    label: 'Product',
                                    sortid: 'product',
                                    sortable: false,
                                  }, {
                                    label: 'Status',
                                    sortid: 'status',
                                    sortable: false,
                                  }, {
                                    label: 'Amount Requested',
                                    sortid: 'loan_amount',
                                    sortable: true,
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
                                    buttons: [ {
                                      passProps: {
                                        buttonProps: {
                                          icon: 'fa fa-pencil',
                                          className: '__icon_button',
                                        },
                                        onClick: 'func:this.props.reduxRouter.push',
                                        onclickBaseUrl: '/los/applications/:id',
                                        onclickLinkParams: [ {
                                          'key': ':id',
                                          'val': '_id',
                                        }, ],
                                      },
                                    }, ],
                                  } ],
                                },
                              }, ],
                            }, ]
                          }
                        } ]
                      },
                    ],
                  },
                }, ],
              }, ],
            },
              peopleNotes,
            ],
          },
        ],
      },
      resources: {
        notedata: '/los/api/customers/:id/notes?entity_type=person',
        peopledata: '/los/api/customers/people/:id',
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
      callbacks: [],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Lending CRM',
        navLabel: 'Lending CRM',
      },
    },
  },
};
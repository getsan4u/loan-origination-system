'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../utilities');
const cardprops = utilities.views.shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const buttonAsyncHeaderTitle = utilities.views.shared.component.layoutComponents.buttonAsyncHeaderTitle;
const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
const formElements = utilities.views.shared.props.formElements.formElements;
const losTabs = utilities.views.los.components.losTabs;
const intermediaryTabs = utilities.views.los.components.intermediaryTabs;
const notes = utilities.views.los.components.notes;
const companyNotes = utilities.views.los.components.companyNotes;
const italicLabelStyle = {
  fontStyle: 'italic',
  marginLeft: '2px',
  fontWeight: 'normal',
  color: '#969696',
};
let randomKey = Math.random;


module.exports = {
  containers: {
    '/los/intermediaries/:id': {
      layout: {
        component: 'div',
        privileges: [ 101, 102, 103, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          losTabs('Intermediaries'),
          buttonAsyncHeaderTitle({
            type: 'intermediary',
            title: true,
          }, {
              component: 'ResponsiveButton',
              props: {
                onclickProps: {
                  title: 'Edit Name',
                  pathname: '/los/intermediaries/:id/rename',
                  params: [ { key: ':id', val: '_id', }, ],
                },
                onClick: 'func:this.props.createModal',
                spanProps: {
                  className: '__ra_rb button_page_title'
                },
              },
              asyncprops: {
                onclickPropObject: [ 'intermediarydata', 'intermediary' ],
                children: [ 'intermediarydata', 'data', 'display_title' ],
              },
            }),
            intermediaryTabs(''),
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
                    intermediarydata: [ 'intermediarydata', ],
                    peopledata: [ 'peopledata', ],
                    formdata: [ 'intermediarydata', 'intermediary', ],
                    __formOptions: [ 'intermediarydata', 'formoptions', ],
                    privilege_id: [ 'checkdata', 'permissionCode', ],
                  },
                  props: {
                    flattenFormData: true,
                    footergroups: false,
                    onSubmit: {
                      url: '/los/api/intermediaries/:id?type=patch',
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
                            buttondata: [ 'intermediarydata', 'data', ],
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
                        }, {
                          component: 'Semantic.Dropdown',
                          thisprops: {
                            privilege_id: [ 'privilege_id', ],
                          },
                          comparisonorprops: true,
                          comparisonprops: [ {
                            left: [ 'privilege_id' ],
                            operation: 'eq',
                            right: 101,
                          }, {
                            left: [ 'privilege_id' ],
                            operation: 'eq',
                            right: 102,
                          } ],
                          props: {
                            className: '__re-bulma_button __re-bulma_is-success',
                            text: 'ADD PERSON',
                            onSubmit: null,
                          },
                          children: [ {
                            component: 'Semantic.DropdownMenu',
                            props: {
                              onSubmit: null,
                            },
                            children: [ {
                              component: 'Semantic.Item',
                              props: {
                                onSubmit: null,
                              },
                              children: [ {
                                component: 'ResponsiveButton',
                                children: 'NEW PERSON',
                                thisprops: {
                                  formdata: [ 'formdata', ],
                                },
                                props: {
                                  onclickThisProp: [ 'formdata', ],
                                  onClick: 'func:this.props.createModal',
                                  onclickProps: {
                                    pathname: '/los/intermediaries/:id/new/new_person',
                                    title: 'Add Person to Intermediary (New Person)',
                                    params: [ {
                                      key: ':id',
                                      val: '_id',
                                    } ],
                                  },
                                },
                              }, ],
                            }, {
                              component: 'Semantic.Item',
                              props: {
                                onSubmit: null,
                              },
                              children: [ {
                                component: 'ResponsiveButton',
                                children: 'EXISTING PERSON',
                                thisprops: {
                                  formdata: [ 'formdata', ],
                                },
                                props: {
                                  onclickThisProp: [ 'formdata', ],
                                  onclickProps: {
                                    title: 'Add Person to Intermediary (Existing Person)',
                                    pathname: '/los/intermediaries/:id/new/existing_person',
                                    params: [ {
                                      key: ':id',
                                      val: '_id'
                                    } ],
                                  },
                                  onClick: 'func:this.props.createModal',
                                },
                              }, ],
                            }, ],
                          }, ],
                        } ],
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
                            cardTitle: 'Intermediary Overview',
                            cardStyle: {
                              marginBottom: 0,
                            },
                          }),
                        },
                        formElements: [ {
                          name: 'type',
                          leftIcon: 'fas fa-star',
                          type: 'dropdown',
                          passProps: {
                            selection: true,
                            fluid: true,
                            selectOnBlur: false,
                          },
                          options: [ {
                            label: '',
                            value: '',
                          }, {
                            label: 'Affiliate',
                            value: 'affiliate',
                          }, {
                            label: 'Broker',
                            value: 'broker',
                          }, {
                            label: 'Contractor',
                            value: 'contractor',
                          }, {
                            label: 'Dealer',
                            value: 'dealer',
                          }, {
                            label: 'Retailer',
                            value: 'retailer',
                          }, {
                            label: 'Other',
                            value: 'other',
                          }, ],
                          label: 'Intermediary Type',
                        }, {
                          name: 'primary_contact',
                          leftIcon: 'fas fa-address-book',
                          label: 'Primary Contact Person',
                          type: 'dropdown',
                          passProps: {
                            selection: true,
                            fluid: true,
                            search: true,
                            selectOnBlur: false,
                          },
                        }, {
                          type: 'group',
                          name: '',
                          label: '',
                          layoutProps: {
                            style: {
                            },
                          },
                          groupElements: [ {
                            type: 'text',
                            name: 'primary_contact_phone',
                            leftIcon: 'phone rotated',
                            label: '',
                            passProps: {
                              readOnly: true,
                            },
                          }, {
                            type: 'text',
                            name: 'primary_contact_email',
                            leftIcon: 'fas fa-envelope',
                            label: '',
                            passProps: {
                              readOnly: true,
                            },
                          }, ],
                        }, {
                          type: 'text',
                          name: 'address',
                          label: 'Corporate Address',
                          leftIcon: 'far fa-map-marker-alt',
                          'errorIcon': 'fa fa-exclamation',
                        }, {
                          type: 'text',
                          name: 'website',
                          label: 'Website',
                          leftIcon: 'far fa-globe',
                          'errorIcon': 'fa fa-exclamation',
                        },
                        {
                          name: 'ein',
                          leftIcon: 'fas fa-id-badge',
                          label: 'Employer Identification Number',
                          type: 'maskedinput',
                          errorIconRight: true,
                          errorIcon: 'fa fa-exclamation',
                          createNumberMask: true,
                          passProps: {
                            mask: 'func:window.taxIdInputLimit',
                            guide: false,
                            autoComplete: 'off',
                            autoCorrect: 'off',
                            autoCapitalize: 'off',
                            spellCheck: false,
                          },
                        },
                        {
                          type: 'textarea',
                          name: 'description',
                          label: 'Company Description',
                          'errorIcon': 'fa fa-exclamation',
                        }, {
                          type: 'group',
                          groupElements: [ {
                            type: 'text',
                            name: 'createdat',
                            leftIcon: 'fas fa-calendar-alt',
                            label: 'Created',
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
                      }, {
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
                                  rows: [ 'intermediarydata', 'intermediary', 'key_information', ],
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
                                          pathname: '/los/intermediaries/:id/edit_key_information/:idx',
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
                                        onclickBaseUrl: '/los/api/customers/companies/:id/key_information/:idx?type=delete_key_information',
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
                                  onclickPropObject: [ 'intermediarydata', 'intermediary', ],
                                },
                                component: 'ResponsiveButton',
                                children: 'ADD KEY INFORMATION ITEM',
                                props: {
                                  onClick: 'func:this.props.createModal',
                                  onclickProps: {
                                    title: 'Add Key Information Item',
                                    pathname: '/los/intermediaries/:id/add_key_information_item',
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
                                cardTitle: 'People',
                                cardStyle: {},
                              }),
                              children: [ {
                                component: 'ResponsiveTable',
                                props: {
                                  flattenRowData: true,
                                  limit: 5,
                                  dataMap: [ {
                                    'key': 'rows',
                                    value: 'rows',
                                  }, {
                                    'key': 'numItems',
                                    value: 'numItems',
                                  }, {
                                    'key': 'numPages',
                                    value: 'numPages',
                                  } ],
                                  calculatePagination: true,
                                  hasPagination: true,
                                  simplePagination: true,
                                  // 'tableSearch': true,
                                  // 'simpleSearchFilter': true,
                                  // filterSearchProps: {
                                  //   icon: 'fa fa-search',
                                  //   hasIconRight: false,
                                  //   className: 'global-table-search',
                                  //   placeholder: 'SEARCH PEOPLE',
                                  // },
                                  headers: [
                                    {
                                      label: 'Name',
                                      sortid: 'name',
                                      sortable: true,
                                      link: {
                                        baseUrl: '/los/people/:id',
                                        params: [
                                          {
                                            key: ':id',
                                            val: '_id',
                                          },
                                        ],
                                      },
                                      linkProps: {
                                        style: {
                                        },
                                      },
                                    },
                                    {
                                      label: 'Job Title',
                                      // headerColumnProps: {
                                      //   style: {
                                      //     width: '10%'
                                      //   },
                                      // },
                                      sortid: 'job_title',
                                      sortable: true,
                                    }, {
                                      label: 'Phone',
                                      sortid: 'phone',
                                      sortable: true,
                                    }, {
                                      label: 'Email',
                                      sortid: 'email',
                                      sortable: true,
                                    }, {
                                      label: ' ',
                                      headerColumnProps: {
                                        style: {
                                          width: '80px'
                                        },
                                      },
                                      columnProps: {
                                        style: {
                                          whiteSpace: 'nowrap',
                                        }
                                      },
                                      buttons: [ {
                                        passProps: {
                                          buttonProps: {
                                            icon: 'fa fa-pencil',
                                            className: '__icon_button'
                                          },
                                          onClick: 'func:this.props.reduxRouter.push',
                                          onclickBaseUrl: '/los/people/:id',
                                          onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                                        },
                                      }, {
                                        passProps: {
                                          buttonProps: {
                                            icon: 'fa fa-trash',
                                            color: 'isDanger',
                                            className: '__icon_button'
                                          },
                                          onClick: 'func:this.props.fetchAction',
                                          onclickBaseUrl: '/los/api/customers/people/:id?type=removeCompanyPerson',
                                          onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
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
                                            title: 'Remove Person from Company',
                                            textContent: [ {
                                              component: 'p',
                                              children: 'Do you want to remove this person from this company?',
                                              props: {
                                                style: {
                                                  textAlign: 'left',
                                                  marginBottom: '1.5rem',
                                                }
                                              }
                                            }, ],
                                          })
                                        },
                                      }, ],
                                    }, ],
                                  headerLinkProps: {
                                    style: {
                                      textDecoration: 'none',
                                    },
                                  },
                                },
                                thisprops: {
                                  rows: [ 'peopledata', 'rows', ],
                                  numItems: [ 'peopledata', 'numItems', ],
                                  numPages: [ 'peopledata', 'numPages', ],
                                  baseUrl: [ 'peopledata', 'baseUrl', ],
                                },
                              } ],
                            }, ],
                          }
                        }, ]
                      },
                    ],
                  },
                }, ],
              }, ],
            },
              // companyNotes,
            ],
          },
        ],
      },
      resources: {
        // notedata: '/los/api/customers/:id/notes?entity_type=intermediary',
        intermediarydata: '/los/api/intermediaries/:id',
        peopledata: '/los/api/intermediaries/:id/people?paginate=true',
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
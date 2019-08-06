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
const DATA_TYPES_DROPDOWN = CONSTANTS.DATA_TYPES_DROPDOWN;
const VARIABLE_TYPES_DROPDOWN = CONSTANTS.VARIABLE_TYPES_DROPDOWN;
const commentsModal = require('../../../../utilities/views/decision/modals/comment');
const cardprops = require('../../../../utilities/views/decision/shared/components/cardProps');
const formElements = require('../../../../utilities/views/decision/shared/components/formElements');
const randomKey = Math.random;
const settings = {
  title: 'Strategy Detail',
  type: 'strategy',
  location: 'detail',
};

let { validations, hiddenFields, formgroups, additionalComponents, } = formConfigs[ settings.type ].edit;
let pluralizedType = pluralize(settings.type);
let url = `/decision/api/standard_${pluralizedType}/:id?format=json`;
let headerButtons = detailHeaderButtons({ type: settings.type, location: settings.location, });

module.exports = {
  'containers': {
    [ `/decision/${pluralizedType}/:id/${settings.location}` ]: {
      layout: {
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        children: [decisionTabs(pluralizedType),
          detailAsyncHeaderTitle({ title: settings.title, type: settings.type, }),
          collectionDetailTabs({ tabname: settings.location, collection: settings.type, }),
          {
            component: 'Container',
            headerButtons,
            children: [
              {
                component: 'ResponsiveForm',
                props: {
                  flattenFormData: true,
                  footergroups: false,
                  useFormOptions: true,
                  onSubmit: {
                    url,
                    params: [
                      { 'key': ':id', 'val': '_id', },
                    ],
                    settings: {
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
                  // validations,
                  hiddenFields: hiddenFields,
                  formgroups: formgroups[ settings.location ],
                },
                asyncprops: {
                  formdata: [`${settings.type}data`, 'data',],
                  __formOptions: [`${settings.type}data`, 'formsettings',],
                },
              }, {
                component: 'ResponsiveForm',
                comparisonprops: [{
                  'left': ['formdata', 'type',],
                  'operation': 'eq',
                  'right': 'Input',
                },],
                props: {
                  flattenFormData: true,
                  footergroups: false,
                  useFormOptions: true,
                  onSubmit: {
                    url: '/decision/api/standard_variables/:id?format=json',
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
                    successCallback: ['func:this.props.refresh', 'func:this.props.createNotification',],
                  },
                  // validations: createValidations.output,
                  hiddenFields: [{
                    form_name: '_id',
                    form_val: '_id',
                  },],
                  formgroups: [{
                    gridProps: {
                      key: randomKey(),
                    },
                    formElements: [{
                      type: 'submit',
                      value: 'Save Changes',
                      passProps: {
                        color: 'isPrimary',
                      },
                      layoutProps: {
                        style: {
                        },
                      },
                    },],
                  }, {
                    gridProps: {
                      key: randomKey(),
                    },
                    card: {
                      twoColumns: true,
                      props: cardprops({
                        cardTitle: 'Overview',
                      }),
                    },
                    formElements: [formElements({
                      twoColumns: true,
                      left: [
                        {
                          label: 'Variable Name',
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
                          name: 'type',
                          label: 'Variable Type',
                          type: 'dropdown',
                          value: '',
                          passProps: {
                            selection: true,
                            fluid: true,
                            state: 'isDisabled',
                          },
                          layoutProps: {
                          },
                          options: VARIABLE_TYPES_DROPDOWN,
                        }, {
                          name: 'data_type',
                          label: 'Data Type',
                          type: 'dropdown',
                          value: '',
                          passProps: {
                            selection: true,
                            fluid: true,
                          },
                          layoutProps: {
                          },
                          options: DATA_TYPES_DROPDOWN,
                        }, {
                          name: 'status',
                          label: 'Status',
                          passProps: {
                            state: 'isDisabled',
                          },
                        },
                      ],
                      right: [{
                        label: 'Created',
                        momentFormat: styles.momentFormat.birthdays,
                        name: 'createdat',
                        passProps: {
                          state: 'isDisabled',
                        },
                      }, {
                        label: 'Updated',
                        name: 'updatedat',
                        momentFormat: styles.momentFormat.birthdays,
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
                      },],
                    }),],
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
                      name: 'rules',
                      flattenRowData: true,
                      useInputRows: false,
                      addNewRows: false,
                      ignoreTableHeaders: ['_id',],
                      headers: [
                        {
                          label: 'Rule Name',
                          sortid: 'name',
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
                          label: 'Type',
                          sortid: 'type',
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
                              onclickBaseUrl: '/decision/rules/:id/detail',
                              onclickLinkParams: [{ 'key': ':id', 'val': '_id', },],
                            },
                          },
                          ],
                        },],
                    },],
                  },],
                },
                asyncprops: {
                  formdata: [`${settings.type}data`, 'data',],
                  __formOptions: [`${settings.type}data`, 'formoptions',],
                },
              }, {
                component: 'ResponsiveForm',
                comparisonprops: [{
                  'left': ['formdata', 'type',],
                  'operation': 'eq',
                  'right': 'Calculated',
                },],
                props: {
                  flattenFormData: true,
                  footergroups: false,
                  useFormOptions: true,
                  onSubmit: {
                    url: '/decision/api/standard_variables/:id?format=json',
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
                    successCallback: ['func:this.props.refresh', 'func:this.props.createNotification',],
                  },
                  // validations: createValidations.output,
                  hiddenFields: [{
                    form_name: '_id',
                    form_val: '_id',
                  },],
                  formgroups: [{
                    gridProps: {
                      key: randomKey(),
                    },
                    formElements: [{
                      type: 'submit',
                      value: 'Save Changes',
                      passProps: {
                        color: 'isPrimary',
                      },
                      layoutProps: {
                        style: {
                        },
                      },
                    },],
                  }, {
                    gridProps: {
                      key: randomKey(),
                    },
                    card: {
                      twoColumns: true,
                      props: cardprops({
                        cardTitle: 'Overview',
                      }),
                    },
                    formElements: [formElements({
                      twoColumns: true,
                      left: [
                        {
                          label: 'Variable Name',
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
                          name: 'type',
                          label: 'Variable Type',
                          type: 'dropdown',
                          value: '',
                          passProps: {
                            selection: true,
                            fluid: true,
                            state: 'isDisabled',
                          },
                          layoutProps: {
                          },
                          options: VARIABLE_TYPES_DROPDOWN,
                        }, {
                          name: 'data_type',
                          label: 'Data Type',
                          type: 'dropdown',
                          value: '',
                          passProps: {
                            selection: true,
                            fluid: true,
                          },
                          layoutProps: {
                          },
                          options: DATA_TYPES_DROPDOWN,
                        }, {
                          name: 'status',
                          label: 'Status',
                          passProps: {
                            state: 'isDisabled',
                          },
                        },
                      ],
                      right: [{
                        label: 'Created',
                        // momentFormat: styles.momentFormat.birthdays,
                        name: 'formattedCreatedAt',
                        passProps: {
                          state: 'isDisabled',
                        },
                      }, {
                        label: 'Updated',
                        name: 'formattedUpdatedAt',
                        // momentFormat: styles.momentFormat.birthdays,
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
                      },],
                    }),],
                  }, {
                    gridProps: {
                      key: randomKey(),
                    },
                    card: {
                      props: cardprops({
                        cardTitle: 'Calculation',
                      }),
                    },
                    formElements: [{
                      type: 'layout',
                      value: {
                        component: 'div',
                        bindprops: true,
                        children: [{
                          component: 'span',
                          thisprops: {
                            children: ['formdata', 'state_property_attribute',],
                          },
                        }, {
                          component: 'span',
                          children: ' =',
                        },],
                      },
                    }, {
                      name: 'value',
                      type: 'code',
                    },],
                  }, {
                    gridProps: {
                      key: randomKey(),
                    },
                    card: {
                      props: cardprops({
                        cardTitle: 'Variables Required for Calculation',
                      }),
                    },
                    formElements: [{
                      name: 'required_variables',
                      label: 'Variables',
                      type: 'dropdown',
                      // validateOnChange: true,
                      passProps: {
                        selection: true,
                        multiple: true,
                        fluid: true,
                        search: true,
                      },
                      layoutProps: {
                        horizontalform: true,
                      },
                    },],
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
                      type: 'layout',
                      value: {
                        component: 'ResponsiveTable',
                        bindprops: true,
                        thisprops: {
                          rows: ['formdata', 'rules',],
                          numItems: ['formdata', 'numItems',],
                          numPages: ['formdata', 'numPages',],
                        },
                        props: {
                          flattenRowData: true,
                          limit: 5,
                          numItems: 5,
                          numPages: 1,
                          dataMap: [{
                            'key': 'rows',
                            value: 'rows',
                          }, {
                            'key': 'numItems',
                            value: 'numItems',
                          }, {
                            'key': 'numPages',
                            value: 'numPages',
                          },],
                          hasPagination: true,
                          simplePagination: true,
                          // baseUrl: `/decision/api/standard_${options.collection}/:id`,
                          'tableSearch': false,
                          'simpleSearchFilter': false,
                          headers: [
                            {
                              label: 'Rule Name',
                              sortid: 'name',
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
                              label: 'Type',
                              sortid: 'type',
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
                                  onclickBaseUrl: '/decision/rules/:id/detail',
                                  onclickLinkParams: [{ 'key': ':id', 'val': '_id', },],
                                },
                              },
                              ],
                            },],
                        },
                      },
                    },
                    ],
                  },],
                },
                asyncprops: {
                  formdata: [`${settings.type}data`, 'data',],
                  __formOptions: [`${settings.type}data`, 'formoptions',],
                },
              },],
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
      'pageData': {
        'title': 'DigiFi | Decision Engine',
        'navLabel': 'Decision Engine',
      },
      'onFinish': 'render',
    },
  },
};

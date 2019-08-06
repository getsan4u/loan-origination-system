'use strict';
const capitalize = require('capitalize');
const pluralize = require('pluralize');
const utilities = require('../../../../utilities');
const formConfigs = require('../../../../utilities/views/decision/shared/components/formConfigs');
const decisionTabs = require('../../../../utilities/views/decision/shared/components/decisionTabs');
const collectionDetailTabs = require('../../../../utilities/views/decision/shared/components/collectionDetailTabs');
const detailAsyncHeaderTitle = require('../../../../utilities/views/shared/component/layoutComponents').detailAsyncHeaderTitle;
const plainGlobalButtonBar = require('../../../../utilities/views/shared/component/globalButtonBar').plainGlobalButtonBar;
const styles = require('../../../../utilities/views/constants/styles');
const references = require('../../../../utilities/views/constants/references');
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
let url = '/decision/api/standard_strategies/:id?format=json';

module.exports = {
  'containers': {
    [ '/decision/strategies/:id/overview' ]: {
      layout: {
        privileges: [101, 102, 103],
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        children: [decisionTabs(pluralizedType),
          detailAsyncHeaderTitle({ title: settings.title, type: settings.type, }),
          collectionDetailTabs({ tabname: 'overview', collection: settings.type, }),
          plainGlobalButtonBar({
            left: [
              {
                component: 'Semantic.Dropdown',
                asyncprops: {
                  privilege_id: [ 'checkdata', 'permissionCode',],
                },
                comparisonorprops: true,
                comparisonprops: [{
                  left: ['privilege_id'],
                  operation: 'eq',
                  right: 101,
                }, {
                  left: ['privilege_id'],
                  operation: 'eq',
                  right: 102,
                }],
                props: {
                  className: '__re-bulma_button __re-bulma_is-success',
                  text: 'ADD MODULE',
                },
                children: [{
                  component: 'Semantic.DropdownMenu',
                  children: [{
                    component: 'Semantic.Item',
                    children: [{
                      component: 'ResponsiveButton',
                      children: 'CREATE NEW',
                      asyncprops: {
                        buttondata: ['strategydata', 'data',],
                      },
                      props: {
                        onclickThisProp: ['buttondata',],
                        onClick: 'func:this.props.createModal',
                        onclickProps: {
                          pathname: '/decision/strategies/:id/add_decision_module',
                          params: [{ 'key': ':id', 'val': '_id', }, ],
                          title: 'Create New Process Module',
                        },
                      },
                    }, ],
                  }, {
                    component: 'Semantic.Item',
                    children: [{
                      component: 'ResponsiveButton',
                      asyncprops: {
                        buttondata: ['strategydata', 'data',],
                      },
                      props: {
                        onclickThisProp: ['buttondata',],
                        onclickProps: {
                          title: 'Copy Existing Process Module',
                          pathname: '/decision/strategies/:id/add_existing_decision_module',
                          params: [{ key: ':id', val: '_id', },],
                        },
                        onClick: 'func:this.props.createModal',
                      },
                      children: 'COPY EXISTING',
                    }, ],
                  },],
                },],
              },
              /*{
                component: 'ResponsiveButton',
                children: 'CREATE NEW VERSION',
                comparisonorprops: true,
                comparisonprops: [{
                  left: ['privilege_id'],
                  operation: 'eq',
                  right: 101,
                }, {
                  left: ['privilege_id'],
                  operation: 'eq',
                  right: 102,
                }],
                asyncprops: {
                  onclickPropObject: ['strategydata', 'data',],
                  privilege_id: [ 'checkdata', 'permissionCode',],
                },
                props: {
                  buttonProps: {
                    color: 'isSuccess',
                  },
                  onClick: 'func:this.props.fetchAction',
                  onclickBaseUrl: '/decision/api/standard_strategies?type=version',
                  fetchProps: {
                    method: 'POST',
                  },
                  successProps: {
                    success: {
                      notification: {
                        text: 'Created New Version',
                        timeout: 10000,
                        type: 'success',
                      },
                    },
                    successCallback: 'func:this.props.reduxRouter.push',
                  },
                  confirmModal: styles.newVersionConfirmModalStyle,
                },
              }, */ {
                component: 'ResponsiveButton',
                children: 'CREATE NEW VERSION',
                comparisonorprops: true,
                comparisonprops: [{
                  left: ['privilege_id'],
                  operation: 'eq',
                  right: 101,
                }, {
                  left: ['privilege_id'],
                  operation: 'eq',
                  right: 102,
                }],
                asyncprops: {
                  onclickPropObject: ['strategydata', 'data',],
                  privilege_id: [ 'checkdata', 'permissionCode',],
                },
                props: {
                  buttonProps: {
                    color: 'isSuccess',
                  },
                  onClick: 'func:window.submitWithLoader',
                  confirmModal: styles.newVersionConfirmModalStyle,
                },
              },],
            right: [
              // {
              // component: 'Semantic.Dropdown',
              // props: {
              //   className: '__re-bulma_button __re-bulma_is-primary',
              //   text: 'EXPORT STRATEGY',
              // },
              // children: [{
              //   component: 'Semantic.DropdownMenu',
              //   children: [{
              //     component: 'Semantic.Item',
              //     children: [{
              //       component: 'ResponsiveButton',
              //       asyncprops: {
              //         onclickPropObject: ['strategydata', 'data',],
              //       },
              //       children: 'CODE (JSON)',
              //       props: {
              //         aProps: {},
              //         'onclickBaseUrl': '/decision/api/standard_strategies/:id/export_strategy?export=json',
              //         onclickLinkParams: [{ key: ':id', val: '_id', }, ],
              //       },
              //     }, ],
              //   },],
              // },],
              // },
              {
              guideButton: true,
                location: references.guideLinks.rulesEngine.strategiesDetailProcessFlow,
            },],
          }),
          {
            component: 'Container',
            props: {
            },
            children: [{
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
                // validations,
                hiddenFields: hiddenFields,
                formgroups: formgroups[ settings.location ],
              },
              asyncprops: {
                formdata: [`${settings.type}data`, 'data',],
                __formOptions: [`${settings.type}data`, 'formsettings',],
              },
            }, {
              component: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'row',
                },
              },
              children: [{
                component: 'ResponsiveForm',
                props: {
                  flattenFormData: true,
                  style: {
                    width: '50%',
                    marginRight: '10px',
                  },
                  footergroups: false,
                  useFormOptions: true,
                  onSubmit: {
                    url: '/decision/api/standard_strategies/:id?format=json',
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
                  }, ],
                  formgroups: [{
                    gridProps: {
                      key: randomKey(),
                      style: {
                        display: 'none',
                      },
                    },
                    formElements: [{
                      type: 'submit',
                      value: 'SAVE',
                      passProps: {
                        color: 'isPrimary',
                      },
                      layoutProps: {
                        className: 'global-button-save',
                        size: 'isNarrow',
                        style: {},
                      },
                    },],
                  }, {
                    gridProps: {
                      key: randomKey(),
                      // subColumnProps: {
                      //   size: 'isHalf',
                      // }
                    },
                    card: {
                      props: cardprops({
                        cardTitle: 'Overview',
                      }),
                    },
                    formElements: [
                      {
                        label: 'Strategy Display Name',
                        name: 'display_title',
                        passProps: {
                          state: 'isDisabled',
                        },
                      },
                      {
                        label: 'Strategy System Name',
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
                        placeholder: ' ',
                        headerColumnProps: {
                          style: {
                            whiteSpace: 'normal',
                          },
                        },
                      },],
                  },],
                },
                asyncprops: {
                  formdata: [`${settings.type}data`, 'data',],
                  __formOptions: [`${settings.type}data`, 'formoptions',],
                },
              }, {
                component: 'ResponsiveForm',
                hasWindowFunc: true,
                props: {
                  ref: 'func:window.addRef',
                  flattenFormData: true,
                  style: {
                    width: '50%',
                  },
                  footergroups: false,
                  useFormOptions: true,
                  onSubmit: {
                    url: '/decision/api/standard_strategies/:id?method=updateModuleOrder',
                    params: [
                      { 'key': ':id', 'val': '_id', },
                      { 'key': ':index', 'val': 'index', },
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
                  formgroups: [ 
                    {
                      gridProps: {
                        key: randomKey(),
                        className: 'dnd-modules',
                        style: {
                          margin: 0,
                          marginRight: '-10px',
                          display: 'flex',
                          flexDirection: 'column',
                        },
                      },
                      formElements: [{
                        type: 'layout',
                        layoutProps: {
                          className: 'border-top-gradient',
                          style: {
                            background: 'white',
                            border: '1px solid #ccc',
                            padding: '15px',
                            margin: '0 10px 3px',
                          },
                        },
                        value: {
                          component: 'div',
                          props: {
                            style: {
                              textAlign: 'center',
                              fontSize: styles.fontSizes.contentLargeTwo.fontSize,
                              fontWeight: 700,
                            },
                          },
                          children: 'Start Process',
                        },
                      }, {
                        type: 'layout',
                        layoutProps: {
                          style: {
                            paddingTop: 0,
                            paddingBottom: 0,
                            position: 'relative',
                            bottom: '-10px',
                          },
                        },
                        value: {
                          component: 'div',
                          comparisonprops: [{
                            left: ['has_modules', ],
                            operation: 'eq',
                            right: false,
                          }, ],
                          thisprops: {
                            has_modules: ['formdata', 'has_modules',],
                          },
                          props: {
                            style: {
                              textAlign: 'center',
                              fontSize: styles.fontSizes.contentLargeTwo.fontSize,
                              fontWeight: 700,
                            },
                          },
                          children: [
                            {
                              component: 'Icon',
                              props: {
                                icon: 'fa fa-long-arrow-down',
                                style: {
                                  fontSize: '12px',
                                  position: 'absolute',
                                  color: styles.colors.gray,
                                  top: '-20px',
                                  left: 0,
                                  right: 0,
                                  margin: '0 auto',
                                },
                              },
                            },
                            {
                              component: 'div',
                              children: 'Add a process module to begin building your automated process',
                              props: {
                                style: {
                                  color: styles.colors.gray,
                                  maxWidth: '250px',
                                  fontWeight: 400,
                                  fontStyle: 'italic',
                                  margin: '3px auto',
                                  fontSize: styles.fontSizes.contentLarge.fontSize,
                                },
                              },
                            }, {
                              component: 'Icon',
                              props: {
                                icon: 'fa fa-long-arrow-down',
                                style: {
                                  fontSize: '12px',
                                  position: 'absolute',
                                  color: styles.colors.gray,
                                  bottom: '-20px',
                                  left: 0,
                                  right: 0,
                                  margin: '0 auto',
                                },
                              },
                            },],
                        },
                      }, {
                        type: 'layout',
                        layoutProps: {
                          style: {
                            padding: 0,
                          },
                        },
                        name: 'updated_formatted_module_run_order',
                        value: {
                          component: 'div',
                        },
                      }, {
                        type: 'dndtable',
                        name: 'formatted_module_run_order',
                        hasWindowFunction: true,
                        submitOnChange: true,
                        handleRowUpdate: 'func:window.handleModuleRunOrderUpdate',
                        flattenRowData: true,
                        useInputRows: false,
                        addNewRows: false,
                        toggleRowKeys: ['active', 'type',],
                        toggleRowClass: {
                          active: {
                            false: 'module-disabled',
                          },
                          type: {
                            scorecard: 'scorecard',
                            output: 'output',
                            requirements: 'requirements',
                            calculations: 'calculations',
                          },
                        },
                        passProps: {
                          itemHeight: 45,
                          helperClass: 'helper module-helper',
                        },
                        headers: [{
                          label: '',
                          sortid: 'module',
                          sortable: false,
                          columnProps: {
                            style: {},
                          },
                        }, {
                          label: '',
                          sortid: 'buttons',
                          sortable: false,
                          columnProps: {
                            style: {
                              width: '90px',
                            },
                          },
                        }, ],
                        ignoreTableHeaders: ['_id',],
                      }, {
                        type: 'layout',
                        layoutProps: {
                          style: {
                            background: 'white',
                            border: '1px solid #ccc',
                            margin: '-10px 10px 0px',
                            padding: '15px',
                          },
                        },
                        value: {
                          component: 'div',
                          props: {
                            style: {
                              textAlign: 'center',
                              fontSize: styles.fontSizes.contentLargeTwo.fontSize,
                              fontWeight: 700,
                            },
                          },
                          children: 'End Process',
                        },
                      }, ],
                    }, ],
                },
                asyncprops: {
                  formdata: [`${settings.type}data`, 'data',],
                  __formOptions: [`${settings.type}data`, 'formsettings',],
                },
              },],
            }, ],
          },],
      },
      'resources': {
        [ 'strategydata' ]: '/decision/api/standard_strategies/:id?format=json',
        checkdata: {
          url: '/auth/run_checks',
          settings: {
            onSuccess: ['func:window.redirect', 'func:window.fannie',],
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

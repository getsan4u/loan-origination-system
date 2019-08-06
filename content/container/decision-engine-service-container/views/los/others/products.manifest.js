'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../utilities');
const cardprops = utilities.views.shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const losTabs = utilities.views.los.components.losTabs;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/los/others/products': {
      layout: {
        component: 'div',
        privileges: [ 101, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          losTabs('Other'),
          {
            component: 'div',
            props: {
              style: {
                margin: '1rem 0px 1.5rem'
              }
            }
          },
          plainGlobalButtonBar({
            left: [ {
              component: 'ResponsiveButton',
              asyncprops: {
                onclickPropObject: [ 'applicationdata', 'application' ],
              },
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  title: 'Create Product Type',
                  pathname: '/los/products/new',
                },
                buttonProps: {
                  color: 'isSuccess',
                },
              },
              children: 'CREATE PRODUCT TYPE',
            }, ],
            right: [ 
            //   {
            //   component: 'Semantic.Dropdown',
            //   asyncprops: {
            //     privilege_id: [ 'checkdata', 'permissionCode', ],
            //   },
            //   comparisonorprops: true,
            //   comparisonprops: [ {
            //     left: [ 'privilege_id' ],
            //     operation: 'eq',
            //     right: 101,
            //   }, {
            //     left: [ 'privilege_id' ],
            //     operation: 'eq',
            //     right: 102,
            //   } ],
            //   props: {
            //     className: '__re-bulma_button __re-bulma_is-primary',
            //     text: 'DOWNLOAD',
            //   },
            //   children: [ {
            //     component: 'Semantic.DropdownMenu',
            //     children: [ {
            //       component: 'Semantic.Item',
            //       children: [ {
            //         component: 'ResponsiveButton',
            //         children: 'CREATE NEW',
            //         asyncprops: {
            //           buttondata: [ 'strategydata', 'data', ],
            //         },
            //         props: {
            //           onclickThisProp: [ 'buttondata', ],
            //           onClick: 'func:this.props.createModal',
            //           onclickProps: {
            //             pathname: '/decision/strategies/:id/add_decision_module',
            //             params: [ { 'key': ':id', 'val': '_id', }, ],
            //             title: 'Create New Process Module',
            //           },
            //         },
            //       }, ],
            //     }, {
            //       component: 'Semantic.Item',
            //       children: [ {
            //         component: 'ResponsiveButton',
            //         asyncprops: {
            //           buttondata: [ 'strategydata', 'data', ],
            //         },
            //         props: {
            //           onclickThisProp: [ 'buttondata', ],
            //           onclickProps: {
            //             title: 'Copy Existing Process Module',
            //             pathname: '/decision/strategies/:id/add_existing_decision_module',
            //             params: [ { key: ':id', val: '_id', }, ],
            //           },
            //           onClick: 'func:this.props.createModal',
            //         },
            //         children: 'COPY EXISTING',
            //       }, ],
            //     }, ],
            //   }, ],
            // }, 
            ],
          }),
          {
            component: 'Container',
            props: {
              style: {},
            },
            children: [ {
              component: 'ResponsiveCard',
              props: cardprops({
                cardTitle: 'Loan Product Types',
              }),
              children: [ {
                component: 'ResponsiveTable',
                props: {
                  flattenRowData: true,
                  limit: 50,
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
                  hasPagination: false,
                  simplePagination: true,
                  baseUrl: '/los/api/products?paginate=true',
                  'tableSearch': true,
                  'simpleSearchFilter': true,
                  filterSearchProps: {
                    icon: 'fa fa-search',
                    hasIconRight: false,
                    className: 'global-table-search',
                    placeholder: 'SEARCH LOAN PRODUCTS',
                  },
                  headers: [
                    {
                      label: 'Product Name',
                      headerColumnProps: {
                        style: {
                          width: '30%'
                        },
                      },
                      sortid: 'name',
                      sortable: true,
                    },
                    {
                      label: 'Customer Type',
                      sortid: 'customer_type',
                      sortable: true,
                    }, {
                      label: 'Created',
                      sortid: 'createdat',
                      sortable: true,
                    }, {
                      label: 'Updated',
                      sortid: 'updatedat',
                      sortable: true,
                    }, {
                      label: 'Description',
                      sortid: 'description',
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
                          onclickBaseUrl: '/los/others/products/:id',
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
                          onclickBaseUrl: '/los/api/products/:id',
                          onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                          fetchProps: {
                            method: 'DELETE',
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
                            title: 'Delete Strategy',
                            textContent: [ {
                              component: 'p',
                              children: 'Do you want to permanently delete this Strategy?',
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
                asyncprops: {
                  rows: [ 'applicationdata', 'rows', ],
                  numItems: [ 'applicationdata', 'numItems', ],
                  numPages: [ 'applicationdata', 'numPages', ],
                },
              } ],
            }, ],
          },
        ],
      },
      resources: {
        applicationdata: '/los/api/products?paginate=true',
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
      callbacks: [ 'func:window.updateGlobalSearchBar', ],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Lending CRM',
        navLabel: 'Lending CRM',
      },
    },
  },
};
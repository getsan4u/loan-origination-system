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
    '/los/others/applicationlabels': {
      layout: {
        component: 'div',
        privileges: [ 101, 102, 103 ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          losTabs('Other'),
          plainHeaderTitle({
            title: 'Application Labels',
          }),
          styles.fullPageDivider,
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
                onclickPropObject: [ 'labeldata', ],
              },
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  title: 'Create Label',
                  pathname: '/los/applicationlabels/new',
                },
                buttonProps: {
                  color: 'isSuccess',
                },
              },
              children: 'CREATE LABEL',
            }, ],
            right: [],
          }),
          {
            component: 'Container',
            props: {
              style: {},
            },
            children: [ {
              component: 'ResponsiveCard',
              props: cardprops({
                headerStyle: {
                  display: 'none',
                }
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
                  hasPagination: true,
                  simplePagination: true,
                  baseUrl: '/los/api/applicationlabels?paginate=true',
                  // 'tableSearch': true,
                  // 'simpleSearchFilter': true,
                  // filterSearchProps: {
                  //   icon: 'fa fa-search',
                  //   hasIconRight: false,
                  //   className: 'global-table-search',
                  //   placeholder: 'SEARCH LOAN PRODUCTS',
                  // },
                  headers: [
                    {
                      label: 'Label',
                      headerColumnProps: {
                        // style: {
                        //   width: '30%'
                        // },
                      },
                      columnProps: {
                        style: {
                          overflow: 'visible',
                        },
                      },
                      sortid: 'name',
                      sortable: true,
                    },
                    {
                      label: 'Created',
                      sortid: 'createdat',
                      sortable: true,
                    }, {
                      label: 'Updated',
                      sortid: 'updatedat',
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
                          onClick: 'func:this.props.createModal',
                          onclickProps: {
                            pathname: '/los/applicationlabels/:id',
                            params: [ { 'key': ':id', 'val': '_id', }, ],
                            title: 'Edit Label',
                          },
                        },
                      }, {
                        passProps: {
                          buttonProps: {
                            icon: 'fa fa-trash',
                            color: 'isDanger',
                            className: '__icon_button'
                          },
                          onClick: 'func:this.props.fetchAction',
                          onclickBaseUrl: '/los/api/applicationlabels/:id',
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
                            title: 'Delete Label',
                            textContent: [ {
                              component: 'p',
                              children: 'Do you want to permanently delete this Label?',
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
                  rows: [ 'labeldata', 'rows', ],
                  numItems: [ 'labeldata', 'numItems', ],
                  numPages: [ 'labeldata', 'numPages', ],
                },
              } ],
            }, ],
          },
        ],
      },
      resources: {
        labeldata: '/los/api/applicationlabels?paginate=true',
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
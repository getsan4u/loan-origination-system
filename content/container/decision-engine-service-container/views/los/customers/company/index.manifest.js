'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../../utilities');
const cardprops = utilities.views.shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const losTabs = utilities.views.los.components.losTabs;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/los/companies': {
      layout: {
        component: 'div',
        privileges: [ 101, 102, 103, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          losTabs('Customers'),
          {
            component: 'div',
            props: {
              style: {
                margin: '1rem 0px 1.5rem'
              }
            }
          },
          plainGlobalButtonBar({
            left: [{
              component: 'ResponsiveButton',
              children: 'CREATE COMPANY',
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  pathname: '/los/company/new',
                  title: 'Create Company',
                },
                buttonProps: {
                  color: 'isSuccess',
                },
              },
            }, ],
            right: [],
          }),
          {
            component: 'Container',
            props: {
              style: {},
            },
            children: [{
              component: 'ResponsiveCard',
              props: cardprops({
                cardTitle: 'Companies',
              }),
              children: [{
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
                  baseUrl: '/los/api/customers?customer_type=company',
                  'tableSearch': true,
                  'simpleSearchFilter': true,
                  filterSearchProps: {
                    icon: 'fa fa-search',
                    hasIconRight: false,
                    className: 'global-table-search',
                    placeholder: 'SEARCH COMPANIES',
                  },
                  headers: [
                    {
                      label: 'Company Name',
                      sortid: 'name',
                      sortable: true,
                      link: {
                        baseUrl: '/los/companies/:id',
                        params: [
                          {
                            key: ':id',
                            val: '_id',
                          },
                        ],
                      },
                      linkProps: {
                      },
                    },
                    {
                      label: 'Industry',
                      headerColumnProps: {
                        style: {
                          width: '8%'
                        },
                      },
                      sortid: 'industry',
                      sortable: true,
                    }, {
                      label: 'Sub-Industry',
                      headerColumnProps: {
                        style: {
                          width: '10%'
                        },
                      },
                      sortid: 'subindustry',
                      sortable: true,
                    }, {
                      label: 'Primary Contact',
                      sortid: 'primary_contact_name',
                      sortable: false,
                      link: {
                        baseUrl: '/los/people/:id',
                        params: [
                          {
                            key: ':id',
                            val: 'primary_contact._id',
                          },
                        ],
                      },
                      linkProps: {
                      },
                    }, {
                      label: 'Primary Contact Phone',
                      sortid: 'primary_contact_phone',
                      sortable: false,
                    }, {
                      label: 'Primary Contact Email',
                      sortid: 'primary_contact_email',
                      sortable: false,
                    }, {
                      label: 'Date Created',
                      sortid: 'createdat',
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
                          onclickBaseUrl: '/los/companies/:id',
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
                          onclickBaseUrl: '/los/api/customers/companies/:id',
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
                            title: 'Delete Company',
                            textContent: [ {
                              component: 'p',
                              children: 'Do you want to permanently delete this Company?',
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
                  rows: [ 'companiesdata', 'rows', ],
                  numItems: [ 'companiesdata', 'numItems', ],
                  numPages: [ 'companiesdata', 'numPages', ],
                },
              } ],
            }, ],
          },
        ],
      },
      resources: {
        companiesdata: '/los/api/customers?customer_type=company',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      callbacks: ['func:window.updateGlobalSearchBar',],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Lending CRM',
        navLabel: 'Lending CRM',
      },
    },
  },
};
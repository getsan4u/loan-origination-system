'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../../utilities');
const cardprops = utilities.views.shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const buttonAsyncHeaderTitle = utilities.views.shared.component.layoutComponents.buttonAsyncHeaderTitle;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const losTabs = utilities.views.los.components.losTabs;
const companyTabs = utilities.views.los.components.companyTabs;
const companyNotes = utilities.views.los.components.companyNotes;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/los/companies/:id/people': {
      layout: {
        component: 'div',
        privileges: [ 101, 102, 103, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          losTabs('Customers'),
          buttonAsyncHeaderTitle({
            type: 'company',
            title: true,
          }, {
            component: 'ResponsiveButton',
            props: {
              onclickProps: {
                title: 'Edit Name',
                pathname: '/los/companies/:id/rename',
                params: [{
                  key: ':id',
                  val: '_id',
                }, ],
              },
              onClick: 'func:this.props.createModal',
              spanProps: {
                className: '__ra_rb button_page_title'
              },
            },
            asyncprops: {
              onclickPropObject: ['companydata', 'company'],
              children: ['companydata', 'data', 'display_title'],
            },
          }),
          companyTabs('people'),
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
                text: 'ADD PERSON',
              },
              children: [{
                component: 'Semantic.DropdownMenu',
                children: [{
                  component: 'Semantic.Item',
                  children: [{
                    component: 'ResponsiveButton',
                    children: 'NEW PERSON',
                    asyncprops: {
                      buttondata: ['companydata', 'company',],
                    },
                    props: {
                      onclickThisProp: ['buttondata',],
                      onClick: 'func:this.props.createModal',
                      onclickProps: {
                        pathname: '/los/companies/:id/new/new_person',
                        title: 'Add Person to Company (New Person)',
                        params: [{ key: ':id', val: '_id' }],
                      },
                    },
                  }, ],
                }, {
                  component: 'Semantic.Item',
                  children: [{
                    component: 'ResponsiveButton',
                    children: 'EXISTING PERSON',
                    asyncprops: {
                      buttondata: ['companydata', 'company',],
                    },
                    props: {
                      onclickThisProp: ['buttondata',],
                      onclickProps: {
                        title: 'Add Person to Company (Existing Person)',
                        pathname: '/los/companies/:id/new/existing_person',
                        params: [{ key: ':id', val: '_id' }],
                      },
                      onClick: 'func:this.props.createModal',
                    },
                  }, ],
                },],
              },],
            }],
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
                cardTitle: 'People',
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
                  'tableSearch': true,
                  'simpleSearchFilter': true,
                  filterSearchProps: {
                    icon: 'fa fa-search',
                    hasIconRight: false,
                    className: 'global-table-search',
                    placeholder: 'SEARCH PEOPLE',
                  },
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
                      label: 'Company',
                      sortid: 'company',
                      sortable: false,
                      link: {
                        baseUrl: '/los/companies/:id',
                        params: [
                          {
                            key: ':id',
                            val: 'company_id',
                          },
                        ],
                      },
                      linkProps: {
                        style: {
                        },
                      },
                    }, {
                      label: 'Job Title',
                      headerColumnProps: {
                        style: {
                          width: '10%'
                        },
                      },
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
                      label: 'Created',
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
                asyncprops: {
                  rows: [ 'companydata', 'rows', ],
                  numItems: [ 'companydata', 'numItems', ],
                  numPages: [ 'companydata', 'numPages', ],
                  baseUrl: ['companydata', 'baseUrl',],
                },
              } ],
            },
              // companyNotes,
            ],
          },
        ],
      },
      resources: {
        notedata: '/los/api/customers/:id/notes?entity_type=company',
        companydata: '/los/api/customers/companies/:id/people?paginate=true',
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
      callbacks: ['func:window.updateGlobalSearchBar',],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Lending CRM',
        navLabel: 'Lending CRM',
      },
    },
  },
};
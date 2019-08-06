'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../utilities');
const cardprops = utilities.views.shared.props.cardprops;
const styles = utilities.views.constants.styles;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const losTabs = utilities.views.los.components.losTabs;
let randomKey = Math.random;

module.exports = {
  containers: {
    '/los/others/customer_templates': {
      layout: {
        component: 'div',
        privileges: [ 101, 102, 103 ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          losTabs('Other'),
          plainHeaderTitle({
            title: 'Customer Templates',
          }),
          styles.fullPageDivider,
          {
            component: 'Container',
            props: {
            },
            children: [ {
              component: 'Columns',
              children: [ {
                component: 'Column',
                children: [{
                  component: 'ResponsiveCard',
                  props: cardprops({
                    cardTitle: 'Companies (Key Information Items)',
                    cardStyle: {
                    },
                  }),
                  children: [ {
                    component: 'ResponsiveTable',
                    asyncprops: {
                      rows: [ 'templatedata', 'companytemplate', 'template_info' ],
                    },
                    props: {
                      flattenRowData: true,
                      hasPagination: false,
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
                        label: 'Type',
                        sortid: 'value_type',
                        sortable: false,
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
                              title: 'Edit Item in Template',
                              pathname: '/los/customer_templates/:id/edit_template_item/:idx',
                              params: [ { key: ':id', val: '_id', }, { key: ':idx', val: 'idx' }, ],
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
                            onclickBaseUrl: '/los/api/customer_templates/:id/template/:idx?type=delete_template_item',
                            onclickLinkParams: [ { key: ':id', val: '_id', }, { key: ':idx', val: 'idx' }, ],
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
                              title: 'Delete Template Item',
                              textContent: [ {
                                component: 'p',
                                children: 'Do you want to permanently delete this template item?',
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
                    },
                  }, {
                    component: 'ResponsiveButton',
                    children: 'ADD ITEM TO COMPANY TEMPLATE',
                    asyncprops: {
                      onclickPropObject: [ 'templatedata', 'companytemplate' ],
                    },
                    props: {
                      onClick: 'func:this.props.createModal',
                      onclickProps: {
                        title: 'Add Item To Company Template',
                        pathname: '/los/customer_templates/:id/add_template_item',
                        params: [ { key: ':id', val: '_id', }, ],
                      },
                      buttonProps: {
                        color: 'isSuccess',
                      },
                    },
                  }, ],
                }, ],
              }, {
                component: 'Column',
                children: [ {
                  component: 'ResponsiveCard',
                  props: cardprops({
                    cardTitle: 'People (Key Information Items)',
                    cardStyle: {
                    },
                  }),
                  children: [ {
                    component: 'ResponsiveTable',
                    asyncprops: {
                      rows: [ 'templatedata', 'persontemplate', 'template_info' ],
                    },
                    props: {
                      flattenRowData: true,
                      hasPagination: false,
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
                        label: 'Type',
                        sortid: 'value_type',
                        sortable: false,
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
                              title: 'Edit Item in Template',
                              pathname: '/los/customer_templates/:id/edit_template_item/:idx',
                              params: [ { key: ':id', val: '_id', }, { key: ':idx', val: 'idx' }, ],
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
                            onclickBaseUrl: '/los/api/customer_templates/:id/template/:idx?type=delete_template_item',
                            onclickLinkParams: [ { key: ':id', val: '_id', }, { key: ':idx', val: 'idx' }, ],
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
                              title: 'Delete Template Item',
                              textContent: [ {
                                component: 'p',
                                children: 'Do you want to permanently delete this template item?',
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
                    },
                  }, {
                    component: 'ResponsiveButton',
                    children: 'ADD ITEM TO PEOPLE TEMPLATE',
                    asyncprops: {
                      onclickPropObject: [ 'templatedata', 'persontemplate' ],
                    },
                    props: {
                      onClick: 'func:this.props.createModal',
                      onclickProps: {
                        title: 'Add Item To People Template',
                        pathname: '/los/customer_templates/:id/add_template_item',
                        params: [ { key: ':id', val: '_id', }, ],
                      },
                      buttonProps: {
                        color: 'isSuccess',
                      },
                    },
                  }, ],
                }, ],
              }, {
                component: 'Column',
                children: [ {
                  component: 'ResponsiveCard',
                  props: cardprops({
                    cardTitle: 'Intermediary (Key Information Items)',
                    cardStyle: {
                    },
                  }),
                  children: [ {
                    component: 'ResponsiveTable',
                    asyncprops: {
                      rows: [ 'templatedata', 'intermediarytemplate', 'template_info' ],
                    },
                    props: {
                      flattenRowData: true,
                      hasPagination: false,
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
                        label: 'Type',
                        sortid: 'value_type',
                        sortable: false,
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
                              title: 'Edit Item in Template',
                              pathname: '/los/customer_templates/:id/edit_template_item/:idx',
                              params: [ { key: ':id', val: '_id', }, { key: ':idx', val: 'idx' }, ],
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
                            onclickBaseUrl: '/los/api/customer_templates/:id/template/:idx?type=delete_template_item',
                            onclickLinkParams: [ { key: ':id', val: '_id', }, { key: ':idx', val: 'idx' }, ],
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
                              title: 'Delete Template Item',
                              textContent: [ {
                                component: 'p',
                                children: 'Do you want to permanently delete this template item?',
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
                    },
                  }, {
                    component: 'ResponsiveButton',
                    children: 'ADD ITEM TO INTERMEDIARY TEMPLATE',
                    asyncprops: {
                      onclickPropObject: [ 'templatedata', 'intermediarytemplate' ],
                    },
                    props: {
                      onClick: 'func:this.props.createModal',
                      onclickProps: {
                        title: 'Add Item To People Template',
                        pathname: '/los/customer_templates/:id/add_template_item',
                        params: [ { key: ':id', val: '_id', }, ],
                      },
                      buttonProps: {
                        color: 'isSuccess',
                      },
                    },
                  }, ],
                }, ],
              } ],
            },
            ],
          },
        ],
      },
      resources: {
        templatedata: '/los/api/customer_templates',
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
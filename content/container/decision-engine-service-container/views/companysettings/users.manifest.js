'use strict';

const formElements = require('../../utilities/views/shared/props/formElements').formElements;
const cardprops = require('../../utilities/views/shared/props/cardprops');
const styles = require('../../utilities/views/constants/styles');
const references = require('../../utilities/views/constants/references');
const periodic = require('periodicjs');
const reactappLocals = periodic.locals.extensions.get('periodicjs.ext.reactapp');
const reactapp = reactappLocals.reactapp();
const plainHeaderTitle = require('../../utilities/views/shared/component/layoutComponents').plainHeaderTitle;
const plainGlobalButtonBar = require('../../utilities/views/shared/component/globalButtonBar').plainGlobalButtonBar;
let randomKey = Math.random;
const utilities = require('../../utilities');
const companySettingsTabs = utilities.views.settings.components.companySettingsTabs;

module.exports = {
  containers: {
    '/company-settings/users': {
      layout: {
        component: 'div',
        privileges: [ 101, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          companySettingsTabs('users'),
          plainHeaderTitle({
            title: 'Users',
          }),
          styles.fullPageDivider,
          plainGlobalButtonBar({
            left: [ {
              component: 'ResponsiveButton',
              props: {
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  pathname: '/modal/add_new_user',
                  title: 'Add User',
                },
                buttonProps: {
                  color: 'isSuccess',
                },
              },
              children: 'ADD NEW USER',
            },
            ],
            right: [ {
              guideButton: true,
              location: references.guideLinks.companySettings[ 'userManagement' ],
            },
            ],
          }),
          {
            component: 'Container',
            props: {
            },
            children: [
              {
                component: 'ResponsiveCard',
                props: cardprops({
                  cardTitle: 'Authorized Users',
                }),
                children: [
                  {
                    component: 'ResponsiveTable',
                    bindprops: true,
                    props: {
                      flattenRowData: true,
                      limit: 50,
                      hasPagination: true,
                      simplePagination: true,
                      headerLinkProps: {
                        style: {
                          textDecoration: 'none',
                          color: styles.colors.darkGreyText,
                        },
                      },
                      headers: [ {
                        label: 'First Name',
                        sortid: 'first_name',
                        sortable: false,
                      }, {
                        label: 'Last Name',
                        sortid: 'last_name',
                        sortable: false,
                      }, {
                        label: 'Email Address',
                        sortid: 'email',
                        sortable: false,
                      }, {
                        label: 'Permissions Type',
                        sortid: 'type',
                        sortable: false,
                      },
                      {
                        label: 'Phone Authentication',
                        sortid: 'status.mfa',
                        sortable: false,
                      },
                      {
                        label: 'Email Verified',
                        sortid: 'status.email_verified',
                        sortable: false,
                      },
                      {
                        label: 'Account Status',
                        sortid: 'status.active',
                        sortable: false,
                      },
                      {
                        'headerColumnProps': {
                          style: {
                            width: '80px',
                          },
                        },
                        columnProps: {
                          style: {
                            whiteSpace: 'nowrap',
                          },
                        },
                        label: ' ',
                        buttons: [
                          {
                            passProps: {
                              buttonProps: {
                                icon: 'fa fa-pencil',
                                className: '__icon_button',
                              },
                              onClick: 'func:this.props.createModal',
                              onclickProps: {
                                title: 'Edit User',
                                pathname: '/modal/edit_user/:id',
                                params: [ { 'key': ':id', 'val': '_id', }, ],
                              },
                              'successProps': {
                                'success': true,
                              },
                            },
                          },
                          // {
                          //   passProps: {
                          //     onclickBaseUrl: '/user/check_deleted_user/:id',
                          //     onclickLinkParams: [ { 'key': ':id', 'val': '_id', }, ],
                          //     fetchProps: {
                          //       method: 'POST',
                          //     },
                          //     successProps: {
                          //       successCallback: 'func:this.props.createModal',
                          //     },

                          //     buttonProps: {
                          //       icon: 'fa fa-trash',
                          //       color: 'isDanger',
                          //       className: '__icon_button',
                          //     },
                          //     onClick: 'func:this.props.fetchAction',
                          //   },
                          // },
                        ],
                      },
                      ],
                    },
                    asyncprops: {
                      'rows': [
                        'usersdata', 'org', 'association', 'users',
                      ],
                      'numPages': [
                        'usersdata', 'org', 'accountstotalpages',
                      ],
                      'numItems': [
                        'usersdata', 'org', 'accountstotal',
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      resources: {
        accountdata: '/organization/get_general_info',
        usersdata: '/organization/get_org',
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
        title: 'DigiFi | Company Settings',
        navLabel: 'Company Settings',
      },
    },
  },
};
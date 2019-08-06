'use strict';

const periodic = require('periodicjs');
const utilities = require('../../utilities');
const shared = utilities.views.shared;
const formElements = utilities.views.decision.shared.components.formElements;
const cardprops = shared.props.cardprops;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
let randomKey = Math.random;
const integrationTabs = utilities.views.integration.components.integrationTabs;
const apiTabs = utilities.views.integration.components.apiTabs;
const companySettingsTabs = utilities.views.settings.components.companySettingsTabs;
module.exports = {
  containers: {
    '/company-settings/api_credentials': {
      layout: {
        component: 'div',
        privileges: [101, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          companySettingsTabs('api_credentials'),
          plainHeaderTitle({
            title: 'API Information',
          }),
          styles.fullPageDivider,
          plainGlobalButtonBar({
            left: [
              {
                component: 'ResponsiveButton',
                props: {
                  buttonProps: {
                    color: 'isSuccess',
                  },
                  onClick: 'func:this.props.createModal',
                  onclickProps: {
                    pathname: '/modal/download_request_format',
                    title: 'Download API Request Template',
                  },
                },
                children: 'DOWNLOAD API REQUEST TEMPLATE',
              },
            ],
            right: [{
              component: 'ResponsiveButton',
              children: 'GENERATE NEW SECRET 1',
              props: {
                buttonProps: {
                  color: 'isPrimary',
                },
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  pathname: '/modal/verify_password_1',
                  title: 'Confirm Generate New Secret 1',
                },
              },
            },
            {
              component: 'ResponsiveButton',
              children: 'GENERATE NEW SECRET 2',
              props: {
                buttonProps: {
                  color: 'isPrimary',
                },
                onClick: 'func:this.props.createModal',
                onclickProps: {
                  pathname: '/modal/verify_password_2',
                  title: 'Confirm Generate New Secret 2',
                },
              },
            },
            {
              guideButton: true,
              location: references.guideLinks.companySettings['apiSetup'],
            },
            ],
          }),
          {
            component: 'Container',
            children: [
              {
                component: 'ResponsiveForm',
                props: {
                  formgroups: [{
                    gridProps: {
                      key: randomKey(),
                    },
                    card: {
                      twoColumns: true,
                      props: cardprops({
                        cardTitle: 'API Credentials',
                      }),
                    },
                    formElements: [formElements({
                      twoColumns: true,
                      doubleCard: false,
                      left: [{
                        label: 'Client ID (client_id)',
                        name: 'client_id',
                        passProps: {
                          state: 'isDisabled',
                        },
                      }, {
                        label: 'Client Public Key (client_public_key)',
                        name: 'public_key',
                        passProps: {
                          state: 'isDisabled',
                        },
                      },
                      ],
                      right: [
                        {
                          label: 'Client Secret 1 (client_secret)',
                          name: 'client_secret',
                          passProps: {
                            state: 'isDisabled',
                          },
                        },
                        {
                          label: 'Client Secret 2 (client_secret)',
                          name: 'client_secret_2',
                          passProps: {
                            state: 'isDisabled',
                          },
                        },
                      ],
                    }),
                    ],
                  },
                  ],
                },
                asyncprops: {
                  formdata: ['orgdata', 'org', 'association', 'client', ],
                  requestTabs: ['apidata', 'requestTabs', ],
                  responseTabs: ['apidata', 'responseTabs', ],
                },
              }, {
                component: 'ResponsiveForm',
                props: {
                  formgroups: [{
                    gridProps: {
                      key: randomKey(),
                      style: {
                        display: 'inline-block',
                        width: '50%',
                        verticalAlign: 'top',
                        textAlign: 'right',
                      },
                    },
                    card: {
                      props: cardprops({
                        cardTitle: 'DocuSign Credentials',
                      }),
                    },
                    formElements: [{
                      label: 'Integration Key',
                      name: 'clientId',
                      passProps: {
                        state: 'isDisabled',
                      },
                    }, {
                      label: 'API Username (GUID)',
                      name: 'userId',
                      passProps: {
                        state: 'isDisabled',
                      },
                    }, {
                      label: 'RSA Private Key',
                      name: 'privateKey',
                      type: 'textarea',
                      passProps: {    
                        readOnly: true,
                      },
                    }, {
                      type: 'layout',
                      // value: {
                      //   component: 'ResponsiveButton',
                      //   props: {
                      //     buttonProps: {
                      //       color: 'isSuccess',
                      //     },
                      //     onClick: 'func:this.props.createModal',
                      //     onclickProps: {
                      //       pathname: '/modal/connect_docusign',
                      //       title: 'Connect DocuSign',
                      //     },
                      //   },
                      //   children: 'Connect',
                      // }
                      value: {
                        component: 'div',
                        props: {
                          // style: {
                          //   display: 'flex',
                          //   justifyContent: 'space-between',
                          //   marginBottom: '20px',
                          // },
                        },
                        children: [{
                          component: 'Semantic.Dropdown',
                          props: {
                            onSubmit: null,
                            className: '__re-bulma_button __re-bulma_is-success',
                            text: 'CONNECT',
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
                                children: 'Add/Edit Credentials',
                                // bindprops: true,
                                props: {
                                  buttonProps: {
                                    color: 'isSuccess',
                                  },
                                  onClick: 'func:this.props.createModal',
                                  onclickProps: {
                                    pathname: '/modal/connect_docusign',
                                    title: 'Connect DocuSign',
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
                                children: 'DOWNLOAD INSTRUCTIONS',
                                bindprops: true,
                                props: {
                                  onclickBaseUrl: '/integrations/download_docusign_instructions',
                                  aProps: {
                                    token: true,
                                    className: '__re-bulma_button __re-bulma_is-primary',
                                    style: {
                                      marginRight: '15px',
                                    },
                                  },
                                },
                              }, ],
                            }, 
                            ],
                          }, ],
                        }, ],
                      },
                    }, ],
                  },
                  ],
                },
                asyncprops: {
                  formdata: ['docusigndata', 'docusign', 'default_configuration', ],
                },
              },
            ],
          },
        ],
      },
      resources: {
        orgdata: '/organization/get_org',
        docusigndata: '/integrations/get_docusign_credentials',
        apidata: '/api/api_tabs',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect', ],
            onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      callbacks: [],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | API Request',
        navLabel: 'Company Settings',
      },
    },
  },
};
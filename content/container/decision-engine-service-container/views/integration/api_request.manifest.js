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
const account_management_tabs = utilities.views.settings.components.account_management_tabs;
module.exports = {
  containers: {
    '/company-settings/api': {
      layout: {
        component: 'div',
        privileges: [101, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          account_management_tabs('api'),
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
              },
            ],
          },
        ],
      },
      resources: {
        orgdata: '/organization/get_org',
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
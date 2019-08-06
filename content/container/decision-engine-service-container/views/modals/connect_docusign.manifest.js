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
    '/modal/connect_docusign': {
      layout: {
        component: 'div',
        privileges: [101, ],
        props: {
        },
        children: [
          {
            component: 'Container',
            children: [
              {
                component: 'ResponsiveForm',
                props: {
                  flattenFormData: true,
                  footergroups: false,
                  'onSubmit': {
                    url: '/integrations/update_docusign_credentials',
                    options: {
                      method: 'PUT',
                    },
                    params: [{ 'key':':id', 'val':'_id', },],
                    successCallback: ['func:this.props.hideModal', 'func:this.props.createNotification',],
                    successProps: ['last', {
                      text: 'Security Certificate Uploaded Successfully!',
                      timeout: 10000,
                      type: 'success',
                    },
                    ],  
                    responseCallback: 'func:this.props.refresh',
                  },
                  formgroups: [{
                    gridProps: {
                      key: randomKey(),
                      style: {
                      },
                    },
                    formElements: [{
                      label: 'Integration Key',
                      name: 'clientId',
                      passProps: {
                        // state: 'isDisabled',
                      },
                    },
                    ],
                  }, {
                    gridProps: {
                      key: randomKey(),
                      style: {
                      },
                    },
                    formElements: [{
                      label: 'API Username (GUID)',
                      name: 'userId',
                      passProps: {
                        // state: 'isDisabled',
                      },
                    }, ],
                  }, {
                    gridProps: {
                      key: randomKey(),
                      style: {
                      },
                    },
                    formElements: [{
                      label: 'RSA Private Key',
                      name: 'privateKey',
                      type: 'textarea',
                      passProps: {    
                        // readOnly: true,
                      },
                    },],
                  }, {
                    gridProps: {
                      key: randomKey(),
                      className: 'modal-footer-btns',
                    },
                    formElements: [ {
                      type: 'submit',
                      value: 'SAVE CHANGES',
                      passProps: {
                        color: 'isPrimary',
                      },
                    },],
                  },],
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
        docusigndata: '/integrations/get_docusign_credentials',
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
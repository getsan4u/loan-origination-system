'use strict';

const formElements = require('../../utilities/views/shared/props/formElements').formElements;
const cardprops = require('../../utilities/views/shared/props/cardprops');
const styles = require('../../utilities/views/constants/styles');
const periodic = require('periodicjs');
const reactappLocals = periodic.locals.extensions.get('periodicjs.ext.reactapp');
const reactapp = reactappLocals.reactapp();
const formHeaderTitle = require('../../utilities/views/shared/component/layoutComponents').formHeaderTitle;
let randomKey = Math.random;
const utilities = require('../../utilities');
const account_management_tabs = utilities.views.settings.components.account_management_tabs;
const account_tabs = utilities.views.settings.components.account_tabs;
const loginManifest = require('../auth/login.manifest');

module.exports = {
  containers: {
    '/auth/multiple_sessions': {
      layout: loginManifest({
        formLayout: {
          component: 'div',
          props: {
            style: {
              textAlign: 'center',
              marginTop: '5rem'
            }
          },
          children: [
            {
              component: 'span',
              props: {
                style: {
                  marginRight: '8px',
                },
              },
              children: 'For security reasons, you have been logged out due to signing in on another device.',
            },
            {
              component: 'div',
              props: {
                style: {
                  marginTop: 30,
                },
              },
              children: [ {
                component: 'ResponsiveButton',
                'props': {
                  buttonProps: {
                    size: 'isMedium',
                    color: 'isPrimary',
                    style: {
                      width: '100%',
                    }
                  },
                  onClick: 'func:this.props.reduxRouter.push',
                  onclickBaseUrl: '/auth/sign-in',
                },
                'children': 'Sign In',
              }, ],
            },
          ],
        },
        subtitle: 'You Have Been Logged Out',
      }),
      resources: {
        successdata: {
          url: '/auth/success',
          options: {
            onSuccess: ['func:window.hideHeader', ],
          },
        },
      },
      callbacks: [],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Logged Out',
        navLabel: 'Logged Out',
      },
    },
  },
};
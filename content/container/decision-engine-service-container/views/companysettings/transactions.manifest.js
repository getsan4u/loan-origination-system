'use strict';

const formElements = require('../../utilities/views/shared/props/formElements').formElements;
const cardprops = require('../../utilities/views/shared/props/cardprops');
const styles = require('../../utilities/views/constants/styles');
const references = require('../../utilities/views/constants/references');
const periodic = require('periodicjs');
const utilities = require('../../utilities');
const reactappLocals = periodic.locals.extensions.get('periodicjs.ext.reactapp');
const reactapp = reactappLocals.reactapp();
const plainHeaderTitle = require('../../utilities/views/shared/component/layoutComponents').plainHeaderTitle;
const plainGlobalButtonBar = require('../../utilities/views/shared/component/globalButtonBar').plainGlobalButtonBar;
let randomKey = Math.random;
const formGlobalButtonBar = utilities.views.shared.component.globalButtonBar.formGlobalButtonBar;
const companySettingsTabs = utilities.views.settings.components.companySettingsTabs;

module.exports = {
  containers: {
    '/company-settings/transactions': {
      layout: {
        component: 'div',
        privileges: [101, ],
        props: {
          style: styles.pageContainer,
        },
        children: [
          companySettingsTabs('transactions'),
          plainHeaderTitle({
            title: 'Automated Transactions',
          }),
          styles.fullPageDivider,
          plainGlobalButtonBar({
            left: [{
              component: 'ResponsiveButton',
              props: {
                onclickBaseUrl: '/payment/downloadTransactions',
                aProps: {
                  token: true,
                  className: '__re-bulma_button __re-bulma_is-success',
                },
              },
              children: 'DOWNLOAD TRANSACTIONS',
            },
            ],
            right: [{
              guideButton: true,
              location: references.guideLinks.companySettings[ 'billingManagement' ],
            },],
          }),
          {
            component: 'Container',
            props: {
            },
            children: [
              {
                component: 'ResponsiveCard',
                props: cardprops({
                  cardTitle: 'Transactions',
                }),
                children:[{
                  component: 'ResponsiveTable',
                  props: {
                    dataMap: [ {
                      'key': 'rows',
                      value: 'rows',
                    }, {
                      'key': 'numItems',
                      value: 'numItems',
                    }, {
                      'key': 'numPages',
                      value: 'numPages',
                    },
                    ],
                    flattenRowData: true,
                    limit: 50,
                    hasPagination: true,
                    simplePagination: true,
                    // calculatePagination: true,
                    'useInputRows': true,
                    baseUrl: '/payment/getTransactions?format=json&paginate=true',
                    headerLinkProps: {
                      style: {
                        textDecoration: 'none',
                      // color: styles.colors.darkGreyText,
                      },
                    },
                    headers: [{
                      label: 'Date',
                      sortid: 'date',
                      sortable: false,
                    }, {
                      label: 'Item',
                      sortid: 'item',
                      sortable: false,
                    }, {
                      label: 'Strategies Processed',
                      sortid: 'strategy_count',
                      sortable: false,
                    }, ],
                  },
                  asyncprops: {
                    rows: ['transactiondata', 'rows', ],
                    numItems: ['transactiondata', 'numItems', ],
                    numPages: ['transactiondata', 'numPages', ],
                  },
                }, ],
              },
            ],
          },
        ],
      },
      resources: {
        transactiondata: '/payment/getTransactions?paginate=true',
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
        title: 'DigiFi | Company Settings',
        navLabel: 'Company Settings',
      },
    },
  },
};
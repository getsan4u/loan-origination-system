'use strict';
const periodic = require('periodicjs');
const CONSTANTS = require('../../constants');
const styles = CONSTANTS.styles;
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const capitalize = require('capitalize');
const appGlobalTabs = require('../../shared/component/appGlobalTabs').appGlobalTabs;
const dashboardTable = require('./dashboardTable');
const getResourceList = require('../../../../views/shared/components/overview_data_components').getResourceList;
const cardprops = require('../../../../utilities/views/decision/shared/components/cardProps');

module.exports = {
  'component': 'div',
  'props': {
    style: {
      backgroundColor: styles.application.background,
      height: '100%',
    },
  },
  'children': [
    appGlobalTabs([{
      location: '',
      label: 'Dashboard',
      baseURL: '',
    },], ''),
    {
      'component': 'Container',
      'props': {
        'style': {
          margin: '40px auto 50px',
        },
      },
      'children': [{
        'component': 'Title',
        'props': {
          'size': 'is3',
          style: {
            fontWeight: 400,
          },
        },
        'children': [{
          'component': 'RawStateOutput',
          'props': {
            'select': 'userdata',
            'type': 'inline',
            display: true,
          },
          'thisprops': {
            'userdata': ['user', 'userdata', 'first_name',],
          },
        }, {
          component: 'span',
          children: `, welcome to the ${THEMESETTINGS.company_name || 'Digifi'} Platform!`,
        }, 
        ],
      },
      {
        'component': 'Columns',
        'props': {
          'responsive': 'isMobile',
          style: {
            flexWrap: 'wrap',
            padding: '0 5px',
            marginBottom: '40px',
            marginTop: '40px',
          },
        },
        asyncprops: {
          _children: ['homedata', 'homepage',],
        },
      },
      {
        component: 'ResponsiveCard',
        props: cardprops({
          cardTitle: 'Helpful Resources',
        }),
        children: [getResourceList([{
          title: 'User Guide',
          externalIcon: true,
          doubleList: true,
          links: [{
            location: 'https://docs.digifi.io/docs/getting-started',
            name: 'Getting Started',
          }, {
            location: 'https://docs.digifi.io/docs/overview-of-company-settings',
            name: 'Company Settings',
          }, {
            location: 'https://docs.digifi.io/docs/overview-ai',
            name: 'Machine Learning',
          }, {
            location: 'https://docs.digifi.io/docs/overview-of-my-account',
            name: 'My Account',
          }, {
            location: 'https://docs.digifi.io/docs/overview-am',
            name: 'Decision Engine',
          }, {
            location: 'https://docs.digifi.io/v2/reference#introduction',
            name: 'API Reference',
          },
          /*{
            location: 'https://docs.digifi.io/docs/overview-of-text-recognition',
            name: 'OCR Text Recognition',
          }, */{
            location: 'https://docs.digifi.io/docs',
            name: 'View All',
            style: {
              fontWeight: 700,
            },
          },],
        }, {
          title: 'DigiFi Support',
          textContent: [{
            name: 'Phone: 646.663.3392',
          }, {
            name: 'Email: support@digifi.io',
          },],
        },
        ]),],
      },
      ],
    },
  ],
};
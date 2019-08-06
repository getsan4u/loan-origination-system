'use strict';
const homepageLayout = require('../../utilities/views/home/components/homepageLayout');

module.exports = {
  'containers': {
    '/home': {
      'layout': homepageLayout,
      'resources': {
        successdata: {
          url: '/auth/success',
          options: {
            onSuccess: ['func:window.showHeader', ],
          },
        },
        homedata: {
          url: '/auth/show_homepage',
          options: {
            onSuccess: [ 'func:window.emailVerifiedNotification', ],
            blocking: true, 
            renderOnError: false,
          },
        },
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: [ 'func:window.redirect', ],
            onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true, 
            renderOnError: false,
          },
        },
        dashboardchangedata: {
          url: '/decision/dashboard/changes'
        },
        dashboardstrategydata: {
          url: '/decision/dashboard/strategies'
        },
      },
      callbacks: [],
      'onFinish': 'render',
      'pageData': {
        'title': 'DigiFi | Dashboard',
        'navLabel': 'Dashboard',
      },
    },
    '/': {
      'layout': homepageLayout,
      'resources': {
        homedata: {
          url: '/auth/show_homepage',
          options: {
            onSuccess: [ 'func:window.emailVerifiedNotification', ],
            blocking: true, 
            renderOnError: false,
          },
        },  
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: [ 'func:window.redirect', ],
            onError: ['func:this.props.logoutUser', 'func:window.redirect', ],
            blocking: true, 
            renderOnError: false,
          },
        },
        dashboardchangedata: {
          url: '/decision/dashboard/changes'
        },
        dashboardstrategydata: {
          url: '/decision/dashboard/strategies'
        },
      },
      callbacks: [],
      'onFinish': 'render',
      'pageData': {
        'title': 'DigiFi | Dashboard',
        'navLabel': 'Dashboard',
      },
    },
  },
};
'use strict';
const styles = require('../../utilities/views/constants/styles');
const randomKey = Math.random;
const periodic = require('periodicjs');

module.exports = {
  'containers': {
    '/modal/contact': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0
          }
        },
        children: [{
          component: 'p',
          children: 'DigiFi’s support team is available and happy to assist. Please email us at support@digifi.io or call us at 646-663-3392. Our hours of operation are 9am - 6pm EST (Monday - Friday).'
        }, {
          component: 'p',
          children: 'We look forward to hearing from you!'  
        }, {
          component: 'div',
          props: {
            className: 'modal-footer-btns',
          },
          children: [{
            component: 'ResponsiveButton',
            props: {
              buttonProps: {
                color: 'isPrimary',
              },
              onClick: 'func:this.props.hideModal',
              onclickProps: 'last',
            },
            children: 'Close Window',
          }, ],
        }, ]
      },
      'resources': {
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
      'onFinish': 'render',
    }, 
    '/modal/search': {
      layout: {
        component: 'Hero',
        props: {
          className: 'search-doc-value',
        },
        children: [{
          component: 'Input',
          props: {
            icon: 'fa fa-search',
            hasIconRight: true,
            hasIcon: true,
            placeholder: 'Search...',
          }
        }, {
          component: 'div',
          props: {
            className: 'modal-footer-btns',
              style: {
                textAlign: 'center',
              },
            },
          children: [{
            component: 'ResponsiveButton',
            props: {
              onClick: 'func:window.searchDocs',
              buttonProps: {
                color: 'isPrimary',
              }
            },
            children: [{
              component: 'span',
              children: 'SEARCH DOCUMENTATION',
            }, {
                component: 'Icon',
                props: {
                  icon: 'fa fa-external-link'
                }
              }]
          }]
        }]
      },
      'resources': {
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
      'onFinish': 'render',
    },
  },
};
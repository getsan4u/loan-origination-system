'use strict';

const utilities = require('../../utilities');
const styles = utilities.views.constants.styles;

module.exports = {
  containers: {
    '/ml/models/:id/input_data': {
      layout: {
        privileges: [101, 102, 103],
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        asyncprops: {
          _children: ['mlmodeldata', '_children'],
        },
      },
      resources: {
        mlmodeldata: '/ml/api/models/:id/input_data?format=json&page=input_data',
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
      'callbacks': ['func:window.setHeaders',],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Machine Learning',
        navLabel: 'Machine Learning',
      },
    },
  },
};
                    
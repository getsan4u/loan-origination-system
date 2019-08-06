'use strict';

const utilities = require('../../utilities');
const styles = utilities.views.constants.styles;

module.exports = {
  containers: {
    '/ml/models/:id/score_analysis/:idx': {
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
        mlmodeldata: '/ml/api/models/:id/analysis_charts/:idx?format=json&page=score_analysis',
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
      callbacks: [
        'func:window.setHeaders',
      ],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Machine Learning',
        navLabel: 'Machine Learning',
      },
    },
  },
};
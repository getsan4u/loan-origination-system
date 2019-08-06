'use strict';

const utilities = require('../../utilities');
const styles = utilities.views.constants.styles;

module.exports = {
  containers: {
    '/ml/models/:id/model_selection': {
      layout: {
        privileges: [101, 102, 103 ],
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        asyncprops: {
          _children: ['mlmodeldata', 'mlmodel', '_children'],
        },
      },
      resources: {
        mlmodeldata: '/ml/api/models/:id/model_selection?format=json',
        checkdata: {
          url: '/auth/run_checks',
          options: {
            onSuccess: ['func:window.redirect',],
            onError: ['func:this.props.logoutUser', 'func:window.redirect',],
            blocking: true,
            renderOnError: false,
          },
        },
      },
      'callbacks': ['func:window.setHeaders', ],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Machine Learning',
        navLabel: 'Machine Learning',
      },
    },
  },
};
                    
'use strict';
const styles = require('../../utilities/views/constants/styles');

module.exports = {
  'containers': {
    '/unsubscribe/:email': {
      'layout': {
        'component': 'div',
        'props': {
          style: {
            backgroundColor: styles.application.background,
            height: '100%',
          },
        },
        children: 'You are unsubscribed!'
      },
      resources: {
        unsubscribedata: {
          url: '/auth/unsubscribe/:email',
          options: {
            onSuccess: [ 'func:this.props.createNotification', ],
            onError: ['func:this.props.createNotification'],
            blocking: true,
            renderOnError: false,
          },
        }
      },
      callbacks: [],
      'onFinish': 'render',
      'pageData': {
        'title': 'DigiFi | Unsubscribe',
        'navLabel': 'Unsubscribe',
      },
    },
  },
};
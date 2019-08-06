'use strict';

const styles = require('../../utilities/views/constants/styles');
const randomKey = Math.random;

module.exports = {
  'containers': {
    '/modal/edit_user/:id': {
      layout: {
        'component': 'ResponsiveForm',
        privileges: [101, ],
        'hasWindowFunc': true,
        'asyncprops': {
          'formdata': [ 'editdata', 'user', ],
          formgroups: ['editdata', 'formgroups']
        },
        'props': {
          'onSubmit': {
            'options': {
              'method': 'PUT',
            },
            'url': '/user/update_user/:id',
            'params': [
              {
                'key': ':id',
                'val': '_id',
              },
            ],
            'successCallback': [
              'func:this.props.hideModal',
              'func:this.props.createNotification',
            ],
            'responseCallback': 'func:this.props.refresh',
            'errorCallback': 'func:this.props.createNotification',
            'successProps': [
              'last',
              {
                'text': 'Changes saved successfully!',
                'timeout': 4000,
                'type': 'success',
              },
            ],
          },
          'validations': [],
        },
      },
      'resources': {
        editdata: '/user/get_user_info/:id',
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
      'onFinish': 'render',
    },
  },
};
'use strict';

const utilities = require('../../utilities');
const styles = utilities.views.constants.styles;
const downloadAPIResponse = require('../../utilities/views/modals/download_api_response.js');

module.exports = {
  'containers': {
    '/modal/download_request_format': {
      layout: {
        privileges: [101, ],
        component: 'Container',
        props: {
          style: {},
        },
        asyncprops: {
          _children: [ 'apidata', 'data', 'requestmodal', ],
        },
      },
      'resources': {
        apidata: '/api/download_api_modal',
        hiddendata: '/api/hiddendata',
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
      callbacks: ['func:window.addOnClickDownloadRequestLink', ],
      'onFinish': 'render',
    },
    '/modal/download_response_format': {
      layout: downloadAPIResponse,
      'resources': {
        hiddendata: '/api/hiddendata',
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
      callbacks: ['func:window.addOnClickDownloadResponseLink', ],
      'onFinish': 'render',
    },
  },
};
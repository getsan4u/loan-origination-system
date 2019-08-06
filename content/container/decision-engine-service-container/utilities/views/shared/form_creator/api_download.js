'use strict';

/** Form Creator for My Account modals */

const { styles, } = require('../../constants');

/**
 * This function returns text for formCreator.
 * @params {String} str String to display as text in the form.
 * @returns {Object} Returns text for formCreator.
 */
function text(str) {
  return {
    text: {
      'type': 'layout',
      value: {
        component: 'div',
        children: str,
      },
    },
  };
}

/**
 * This function returns the file format object for formCreator.
 * @returns {Object} Returns the file format object for formCreator.
 */
function format() {
  return {
    format: {
      type: 'dropdown',
      passProps: {
        fluid: true,
        selection: true,
      },
      name: 'format',
      label: 'File Format',
      layoutProps: {
        horizontalform: false,
      },
      value: 'json',
      options: [
        {
          'label':'JSON',
          'value':'json',
        },
        {
          'label':'XML',
          'value':'xml',
        },
      ],
    },
  };
}

/**
 * This function returns the download response format button for formCreator.
 * @returns {Object} Returns the download response format button for formCreator.
 */
function downloadResponseButton() {
  return {
    'gridProps': {
      className: 'modal-footer-btns',
      style: {
        'justifyContent': 'center',
      },
      isMultiline: false,
      responsive: 'isMobile',
    },
    download: {
      'type': 'layout',
      value: {
        component: 'ResponsiveButton',
        children: 'Download',
        thisprops: {},
        props: {
          onclickBaseUrl: '/api/download_response/json/:client_id',
          aProps: {
            className: '__re-bulma_button __re-bulma_is-primary',
          },
        },
      },
      'layoutProps': {
        className: 'downloadResponseLink',
        style: {
          textAlign: 'center',
        },
      },
    },
  };
}

module.exports = {
  text,
  format,
  downloadResponseButton,
};
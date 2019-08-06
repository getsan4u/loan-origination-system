'use strict';
const { styles, labels, } = require('../../utilities/views/constants');
const loginManifest = require('../auth/login.manifest'); 

module.exports = {
  layout: loginManifest(),
  'resources': {},
  'onFinish': 'render',
  'pageData':{
    'title':'DigiFi | Login',
    'navLabel':'Login',
  },
};
'use strict';
const periodic = require('periodicjs');
const Promisie = require('promisie');

periodic.init({
  debug: true,
})
  .then(periodicInitStatus => {
    let reactappUtilities = periodic.locals.extensions.get('@digifi-los/reactapp');
    periodic.locals.extensions.set('periodicjs.ext.reactapp', reactappUtilities);
    let reactappSettings = periodic.settings.extensions[ '@digifi-los/reactapp' ];
    periodic.settings.extensions[ 'periodicjs.ext.reactapp' ] = reactappSettings;
    const THEMESETTINGS = periodic.settings.container['decision-engine-service-container'];
  })
  .catch(e => {
    console.error(e);
  });
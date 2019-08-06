'use strict';

const periodic = require('periodicjs');
const utilities = require('../../../utilities');
const shared = utilities.views.shared;
const styles = utilities.views.constants.styles;
const references = utilities.views.constants.references;
const plainGlobalButtonBar = utilities.views.shared.component.globalButtonBar.plainGlobalButtonBar;
const mlTransformationsAsyncHeaderTitle = utilities.views.shared.component.layoutComponents.mlTransformationsAsyncHeaderTitle;
const optimizationTabs = utilities.views.optimization.components.optimizationTabs;
const datasourceTabs = utilities.views.optimization.components.datasourceTabs;

module.exports = {
  containers: {
    '/optimization/data_sources/:id/transformations': {
      layout: {
        privileges: [101, 102,],
        component: 'div',
        props: {
          style: styles.pageContainer,
        },
        children: [ 
          optimizationTabs('training/historical_data'),
          mlTransformationsAsyncHeaderTitle({ type: 'datasource', title: true, }),
          datasourceTabs({ tabname: 'transformations', }),
          // styles.fullPageDivider,
          plainGlobalButtonBar({
            right: [
              {
                guideButton: true,
                location: references.guideLinks.optimization['/data_sources/:id'],
              },
            ],
          }),
          {
            component: 'Container',
            props: {
              style: {
                marginTop: 20,
              },
            },
            asyncprops: {
              _children: ['datasourcedata', 'data', 'children',],
            },
          },
        ],
      },
      resources: {
        datasourcedata: '/optimization/api/datasources/:id?pagination=datasources&type=getDataSourceTransformations',
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
      'callbacks': ['func:window.setHeaders', ],
      onFinish: 'render',
      pageData: {
        title: 'DigiFi | Machine Learning',
        navLabel: 'Machine Learning',
      },
    },
  },
};
'use strict';
const CONSTANTS = require('../../utilities/views/constants');
const styles = CONSTANTS.styles;
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ];
const currentYear = (new Date()).getFullYear()
module.exports = {  
  layout: {
    component: 'Container',
    props: {
      style: {
        backgroundColor: styles.application.blackText,
      },
    },
    children: [{
      component: 'NavGroup',
      props:{
        style:{
          width: '100%',
          padding: '10px 0 20px',
        },
        align:'center',
      },
      children: [{
        component: 'NavItem',
        children:[{
          component: 'span',
          props: {
            style: {
              color: THEMESETTINGS.footer.font_color,
              display: 'block',
              margin: '0 auto',
            },
          },
          children: THEMESETTINGS.footer.fulltext ? THEMESETTINGS.footer.fulltext : `© ${currentYear} ${THEMESETTINGS.footer.company_name || 'DigiFi, Inc.'} All Rights Reserved.`,
        },
        ],
      },
      ],
    },
    ],
  },
  'resources': {},
  'onFinish':'render',
};
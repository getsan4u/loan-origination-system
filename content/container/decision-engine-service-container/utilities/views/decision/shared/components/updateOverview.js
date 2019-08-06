'use strict';
const styles = require('../../../constants').styles;
const formElements = require('./formElements');
const cardprops = require('./cardProps');
const randomKey = Math.random;

function updateOverview(options) {
  return {
    gridProps: {
      key: randomKey(),
    },
    card: {
      twoColumns: true,
      props: cardprops({
        cardTitle: 'Update Overview',
      }),
    },
    formElements: [formElements({
      twoColumns: true,
      left: [
        {
          label: `${options.title} Name (Before Change)`,
          name: 'before.display_title',
          passProps: {
            state: 'isDisabled',
          },
        }, {
          label: `${options.title} Name (After Change)`,
          name: 'after.display_title',
          passProps: {
            state: 'isDisabled',
          },
        }, {
          label: 'Version (Before Change)',
          name: 'before.version',
          passProps: {
            state: 'isDisabled',
          },
        }, {
          label: 'Version (After Change)',
          name: 'after.version',
          passProps: {
            state: 'isDisabled',
          },
        }, 
      ],
      right: [{
        label: 'Updated',
        name: 'formattedUpdatedAt',
        passProps: {
          state: 'isDisabled',
        },
      }, {
        label: 'Comments',
        name: 'comments',
        passProps: {
          state: 'isDisabled',
        },
      }, ],
    }), ],
  }
}

module.exports = updateOverview;
'use strict';
const styles = require('../../../constants').styles;
const randomKey = Math.random;
const cardprops = require('./cardProps');
const formElements = require('./formElements');

function updateHistoryDoubleCard(options) {
  return {
    gridProps: {
      key: randomKey(),
    },
    card: {
      doubleCard: true,
      leftDoubleCardColumn: {
        style: {
          display: 'flex',
        },
      },
      rightDoubleCardColumn: {
        style: {
          display: 'flex',
        },
      },
      leftCardProps: cardprops({
        cardTitle: `${options.title} (Before Change)`,
        cardStyle: {
          marginBottom: 0,
        },
      }),
      rightCardProps: cardprops({
        cardTitle: `${options.title}  (After Change)`,
        cardStyle: {
          marginBottom: 0,
        },
      }),
    },
    formElements: [formElements({
      twoColumns: true,
      doubleCard: true,
      left: options.leftConfigs.map(config => {
        return {
          label: config.label,
          name: config.name,
          type: config.type || 'text',
          passProps: Object.assign({}, {
            className: '__re-bulma_control',
            state: 'isDisabled',
          }, config.passProps)
        }
      }),
      right: options.rightConfigs.map(config => {
        return {
          label: config.label,
          name: config.name,
          type: config.type || 'text',
          passProps: Object.assign({}, {
            className: '__re-bulma_control',
            state: 'isDisabled',
          }, config.passProps)
        }
      }),
    }), ],
  }
}

module.exports = updateHistoryDoubleCard;
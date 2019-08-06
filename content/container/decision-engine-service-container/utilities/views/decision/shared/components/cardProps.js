'use strict';
const styles = require('../../../constants').styles;

function generateComponent(options){
  return Object.assign({}, {
    cardTitle: options.cardTitle,
  }, styles.cardProps, {
    headerStyle: Object.assign( {}, styles.cardProps.headerStyle, options.headerStyle),
    headerTitleStyle: Object.assign( {}, styles.cardProps.headerTitleStyle, options.headerTitleStyle),
    cardProps: Object.assign({}, styles.cardProps.cardProps, options.cardProps),
    cardStyle: Object.assign({}, styles.cardProps.cardStyle, options.cardStyle),
    cardContentProps: Object.assign( {}, styles.cardProps.cardContentProps, options.cardContentProps),
  });
}

module.exports = generateComponent;
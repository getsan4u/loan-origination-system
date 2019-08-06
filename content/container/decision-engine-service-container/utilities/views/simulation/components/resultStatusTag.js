'use strict';
const styles = require('../../constants/styles');

function __generateStatusTag(status) {
  let statusColor;
  switch (status) {
    case 'Pass':
      statusColor = styles.colors.green;
      break;
    case 'Complete':
      statusColor = styles.colors.highlight;
      break;
    case 'Okay':
      statusColor = styles.colors.yellow;
      break;
    case 'Fail':
      statusColor = styles.colors.danger;
      break;
    case 'Error':
      statusColor = styles.colors.orange;
      break;
    case 'Not Run':  
      statusColor = styles.colors.gray;
  }
  return {
    component: 'Tag',
    props: {
      style: {
        backgroundColor: statusColor,
        maxWidth: '100px',
        width: '100%',
        fontWeight: 'bold',
        borderRadius: '5px',
        color: 'white',
      }
    },
    children: status,
  };
}

module.exports = __generateStatusTag;

'use strict';
const styles = require('../../utilities/views/constants/styles');

module.exports = {
  'containers': {
    '/modal/individual-result-average': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'span',
          children: 'The average represents the averages in your training data.',
        },  {
          component: 'ul',
          children: [{
            component: 'li',
            children: 'For numeric fields, it represents the mean in the training data',
          }, {
            component: 'li',
            children: 'For categorical fields, it represents the mode in the training data',
          }, ],
        }, ],
      },
      'resources': {},
      'onFinish': 'render',
    },
    '/modal/decision-impact': {
      layout: {
        component: 'Hero',
        props: {
          style: {
            margin: 0,
          },
        },
        children: [{
          component: 'p',
          children: `Digifi's decision explanation is a proprietary approach to explaining decisions produced by highly complex machine learning models. It is based on sophisticated, real-time inference analysis that compares the decision results using your input data and modifications based on the original training data.`,
        }, {
          component: 'p',
          children: 'The decision impacts indicate which fields have the largest positive and negative impacts on the results.',
        }, ],
      },
      'resources': {},
      'onFinish': 'render',
    },
  },
};
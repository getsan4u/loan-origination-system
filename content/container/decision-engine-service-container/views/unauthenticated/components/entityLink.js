'use strict';
const path = require('path');

module.exports = function entityLink(options){
  const { reactapp,entitytype,title,linkSuffix,passport } = options;
  return {
    "component": "Title",
    "props": {
      "style": {
        "textAlign": "center"
      }
    },
    "children": [ {
      component: "span",
      children: title
    },
    ]
  };
}
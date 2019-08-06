'use strict';

function __cleanTextAnnotations(textAnnotations) {
  return textAnnotations.reduce((cleaned, annotation, i) => {
    if (annotation.boundingPoly && i !== 0) {
      let x = annotation.boundingPoly.vertices[ 0 ].x;
      let y = annotation.boundingPoly.vertices[ 0 ].y;
      let w = annotation.boundingPoly.vertices[ 1 ].x - annotation.boundingPoly.vertices[ 0 ].x;
      let h = annotation.boundingPoly.vertices[ 2 ].y - annotation.boundingPoly.vertices[ 0 ].y;
      cleaned.push({
        x,
        y,
        w,
        h,
        data: {
          blockNum: i,
          description: annotation.description, x, y, w, h,
        },
      });
      return cleaned;
    } else return cleaned;
  }, []);
}

function runFileExtraction() {
  
}

module.exports = {
  __cleanTextAnnotations,
};
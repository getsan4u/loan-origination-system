'use strict';

var React = require('react');

class MLAxisTick extends React.Component {
  render() {
    const { x, y, stroke, payload, numTicks, disableRotation } = this.props;
    let rotation = (numTicks <= 4 && !disableRotation) ? '0' : (numTicks <= 10) ? '-20' : '-30';
    // let textAnchor = 'middle';
    let textAnchor = (numTicks <= 4 && !disableRotation) ? 'middle' : 'end';
  
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor={textAnchor} fill="#666" transform={`rotate(${rotation})`}>
          {payload.value}
        </text>
      </g>
    );
  }
}

module.exports = MLAxisTick;
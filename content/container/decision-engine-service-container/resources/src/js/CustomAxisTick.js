'use strict';

var React = require('react');

class CustomAxisTick extends React.Component {
  render() {
    const { x, y, stroke, payload, numTicks } = this.props;
    let rotation = (numTicks <= 4) ? '0' : (numTicks <= 10) ? '-20' : '-30';
    let textAnchor = (numTicks <= 4) ? 'middle' : 'end';
    let textData = payload.value.split(' - ');
    let name = textData[ 0 ].split(' (')[ 0 ];

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor={textAnchor} fill="#666" transform={`rotate(${rotation})`}>
          <tspan x={0} y={0} dy={16}>
            {name}
          </tspan>
          <tspan x={0} y={0} dy={32}>
            {textData[ 1 ]}
          </tspan>
        </text>
      </g>
    );
  }
}

module.exports = CustomAxisTick;
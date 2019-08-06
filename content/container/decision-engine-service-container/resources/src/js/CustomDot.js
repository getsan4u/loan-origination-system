'use strict'
var React = require('react');

const DOT_COLORS = [
  '#7D0022',
  '#FB0300',
  '#F88902',
  '#FFC402',
  '#95C51E',
  '#4A9718',
  '#3E8E16',
]

 function setDotColor(value) {
    if (value >= 750) return DOT_COLORS[6];
    if (value >= 700) return DOT_COLORS[5];
    if (value >= 640) return DOT_COLORS[4];
    if (value >= 580) return DOT_COLORS[2];
    if (value < 580) return DOT_COLORS[1];
  }

const CustomDot = (props) => {
    const { cx, cy, stroke, payload, value } = props;
    const fillColor = setDotColor(value);
    return <circle cx={cx} cy={cy} strokeWidth={4} r={9} stroke={fillColor} fill="white" />;
}

module.exports = CustomDot
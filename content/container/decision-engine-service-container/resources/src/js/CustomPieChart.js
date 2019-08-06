'use strict';
var React = require('react');

const PIE_GRADIENT_COLORS = [
  '#7D0022',
  '#FB0300',
  '#F88902',
  '#FFC402',
  '#95C51E',
  '#4A9718',
  '#3E8E16',
]

function getLeadCircleColor(start, end) {
  let progressRatio = (start - 300) / (end - 300);
  if (progressRatio < 0.17) {
    return PIE_GRADIENT_COLORS[1];
  } else if (progressRatio < 0.34) {
    return PIE_GRADIENT_COLORS[2];
  } else if (progressRatio < 0.51) {
    return PIE_GRADIENT_COLORS[3];
  } else if (progressRatio < 0.68) {
    return PIE_GRADIENT_COLORS[4];
  } else if (progressRatio < 0.84) {
    return PIE_GRADIENT_COLORS[5];
  } else {
    return PIE_GRADIENT_COLORS[6];
  }
}

const CustomPieChart = (data) => {
    const pieChart = (<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="0 0 300 300" style={{ enableBackground:"new 0 0 300 300" }} xmlSpace="preserve">
      <defs>
      <linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="-920.334" y1="26.1161" x2="-921.334" y2="25.1161" gradientTransform="matrix(103.923 0 0 60 95764.4688 -1280)">
        <stop  offset="0" style={{ stopColor: PIE_GRADIENT_COLORS[0] }}/>
        <stop  offset="1" style={{ stopColor: PIE_GRADIENT_COLORS[1] }}/>
      </linearGradient>
      <linearGradient id="SVGID_2_" gradientUnits="userSpaceOnUse" x1="-873.7784" y1="13.4168" x2="-873.7784" y2="12.4168" gradientTransform="matrix(16.077 0 0 120 14051.6016 -1400)">
        <stop  offset="4.407051e-04" style={{stopColor: PIE_GRADIENT_COLORS[1]}}/>
        <stop  offset="1" style={{stopColor: PIE_GRADIENT_COLORS[2]}}/>
      </linearGradient>
      <linearGradient id="SVGID_3_" gradientUnits="userSpaceOnUse" x1="-921.3339" y1="25.5504" x2="-920.3339" y2="24.5504" gradientTransform="matrix(103.923 0 0 60 95764.4688 -1460)">
        <stop  offset="4.407051e-04" style={{stopColor: PIE_GRADIENT_COLORS[2]}}/>
        <stop  offset="1" style={{stopColor: PIE_GRADIENT_COLORS[3]}}/>
      </linearGradient>
      <linearGradient id="SVGID_4_" gradientUnits="userSpaceOnUse" x1="-920.7683" y1="24.5505" x2="-919.7683" y2="25.5505" gradientTransform="matrix(103.923 0 0 60 95868.3906 -1460)">
        <stop  offset="0" style={{stopColor: PIE_GRADIENT_COLORS[3]}}/>
        <stop  offset="1" style={{stopColor: PIE_GRADIENT_COLORS[4]}}/>
      </linearGradient>
      <linearGradient id="SVGID_5_" gradientUnits="userSpaceOnUse" x1="-869.5278" y1="12.4168" x2="-869.5278" y2="13.4168" gradientTransform="matrix(16.0769 0 0 120 14275.4463 -1400)">
        <stop  offset="0" style={{stopColor: PIE_GRADIENT_COLORS[4]}}/>
        <stop  offset="1" style={{stopColor: PIE_GRADIENT_COLORS[5]}}/>
      </linearGradient>
      <linearGradient id="SVGID_6_" gradientUnits="userSpaceOnUse" x1="-919.7684" y1="25.116" x2="-920.7684" y2="26.116" gradientTransform="matrix(103.923 0 0 60 95868.3906 -1280)">
        <stop  offset="0" style={{stopColor: PIE_GRADIENT_COLORS[5]}}/>
        <stop  offset="1" style={{stopColor: PIE_GRADIENT_COLORS[6]}}/>
      </linearGradient>
      </defs>
        <g id="Layer_1_1_">
        <circle fill="#f2f2f2" stroke="#ffffff" strokeWidth="20" r="110" cx="150" cy ="150" />
        <path fill="none" strokeWidth="12" stroke="url(#SVGID_1_)" d="M150,270c-42.9,0-82.5-22.9-103.9-60" />
        <path fill="none" strokeWidth="12" stroke="url(#SVGID_2_)" d="M46.1,210c-21.4-37.1-21.4-82.9,0-120" />
        <path fill="none" strokeWidth="12" stroke="url(#SVGID_3_)" d="M46.1,90c21.4-37.1,61-60,103.9-60" />
        <path fill="none" strokeWidth="12" stroke="url(#SVGID_4_)" d="M150,30c42.9,0,82.5,22.9,103.9,60" />
        <path fill="none" strokeWidth="12" stroke="url(#SVGID_5_)" d="M253.9,90c21.4,37.1,21.4,82.9,0,120" />
        <path fill="none" strokeWidth="12" stroke="url(#SVGID_6_)" d="M253.9,210c-21.4,37.1-61.1,60-103.9,60" />
      </g>
      <g>
        <path strokeDasharray='768 768'
        stroke = "#eaeaea"
        strokeWidth="13"
        fill="none"
        id="progress-path"
        d="M150,270c66.3,0,120-53.7,120-120S216.3,30,150,30l0,0C83.7,30,30,83.7,30,150S83.7,270,150,270" />
      </g>
      <g>
        <circle id="progress-marker" style={{transform: 'rotate(0deg)'}} fill="#f7f7f7" 
        stroke={getLeadCircleColor(data.currentValue, data.totalValue)} 
        strokeWidth="5" cx="150" cy="270" r="11">
        </circle>
      </g>
    </svg>);
    return pieChart;
}

module.exports = CustomPieChart;
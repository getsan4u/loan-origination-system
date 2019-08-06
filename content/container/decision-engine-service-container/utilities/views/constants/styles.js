'use strict';
const periodic = require('periodicjs');
const THEMESETTINGS = periodic.settings.container[ 'decision-engine-service-container' ] || {};

let colors = {
  background: '#f5f7fb',
  darkGreyText: '#333',
  defaultDarkText: 'rgb(64,64,64)', 
  regGreyText: '#969696',
  gray: '#969696',
  greyInputBackground: '#f5f7fa',
  greyInputBorder: '#d3d6db',
  blackText: '#404041',
  primary: '#007aff',
  secondary: '#2b39ba',
  highlight: '#68d7e3',
  danger: '#ed6c63',
  warn: '#ffa13b',
  yellow: '#fbce68',
  success: '#b8ffbf',
  info: '#ffd45b',
  green: '#00b050',
  black: '#000',
  orange: '#F57C00',
};

let fullPageDivider = {
  component: 'div',
  props: {
    style: {
      margin: '1rem 0 1.5rem',
    },
  },
  children: [{
    component: 'hr',
    props: {
      style: {
        border: 'none',
        borderBottom: '1px solid #ccc',
      },
    },
  }, ],
};

module.exports = {
  application: colors,
  colors,
  fullPageDivider,
  pageContainer: {
    minHeight: '100%',
    paddingBottom: '60px',
  },
  pages: {
    login: {
      backgroundColor: colors.background,
      padding: '0 0 40px',
    },
  },
  fontSizes: {
    contentSmall: {
      fontSize: '0.75rem',
    },
    contentMedium: {
      fontSize: '0.875rem',
      lineHeight: '1.4',
    },
    contentLarge: {
      fontSize: '1.0625rem',
      marginBottom: '1.5rem',
    },
    contentLargeTwo: {
      fontSize: '1.25rem',
    },
  },
  buttons: {
    approve: {
      backgroundColor: THEMESETTINGS.company_color_primary,
      color: 'white',
      borderRadius: '12px',
      border: 'none',
      fontSize: '16px',
      padding: '0 40px',
      minWidth: '150px',
    },
    clear: {
      'backgroundColor': 'none',
      // 'color': 'black',
      'borderRadius': '12px',
      border: 'none',
      fontSize: '16px',
      padding: '0 40px',
    },
    primary: {
      backgroundColor: THEMESETTINGS.company_color_primary,
      color:'white',
      borderRadius: '5px',
      border: 'none',
      minWidth: '150px',
    },
    primaryReview: {
      backgroundColor: THEMESETTINGS.company_color_primary,
      color:'white',
      // borderRadius: '12px',
      fontSize: '11px',
      border: 'none',
      height: 'auto',
      minWidth: '150px',
    },
    primaryALink: {
      backgroundColor: THEMESETTINGS.company_color_primary,
      color: 'white',
      textDecoration:'none',
      borderRadius: '5px',
      padding: '8px 12px',
      border: 'none',
      minWidth: '150px',
    },
    verification: {
      borderRadius: '5px',
      minWidth: '150',
    },
    approveAction: {
      backgroundColor: colors.green,
      borderRadius: '5px',
      color:'white',
      border: 'none',
      // minWidth: '150'
    },
    referAction: {
      backgroundColor: colors.warn,
      borderRadius: '5px',
      color:'white',
      border: 'none',
      // minWidth: '150'
    },
    suspiciousAction: {
      backgroundColor: colors.black,
      borderRadius: '5px',
      color:'white',
      border: 'none',
      // minWidth: '150'
    },
    rejectAction: {
      backgroundColor: colors.danger,
      borderRadius: '5px',
      color:'white',
      border: 'none',
      // minWidth: '150'
    }, 
    iconButton: {
      height: '30px',
      padding: '0',
      margin: '0px 3px',
      width: '30px',
      border: 'none',
      boxShadow: '0 2px 3px rgba(17, 17, 17, 0.1), 0 0 0 1px rgba(17, 17, 17, 0.1)',
    },
  },
  moduleIcons: {
    requirements: '/images/elements/priority-low.svg',
    dataintegration: '/images/elements/share.svg',
    calculations: '/images/elements/calculator.svg',
    assignments: '/images/elements/plus-alt.svg',
    output: '/images/elements/box-add.svg',
    scorecard: '/images/elements/bar-chart.svg', 
    artificialintelligence: '/images/elements/lightning.svg',
    email: '/images/elements/envelope.svg',
    textmessage: '/images/elements/comment.svg',
    pieChart: '/images/elements/pie-chart.svg',
    lineChart: '/images/elements/line-chart.svg',
    adjust: '/images/elements/adjust.svg',
    timer: '/images/elements/timer.svg',
    cloudUpload: '/images/elements/cloud-upload.svg',
    machineLearning: '/images/elements/robot.svg',
    decision: '/images/elements/dashboard.svg',
  },
  momentFormat: {
    dates:'MM/DD/YYYY | hh:mm:ssA',
    birthdays:'MM/DD/YYYY',
  },
  inputStyle: {
    overflow: 'hidden',
    backgroundColor: colors.greyInputBackground,
    border: `1px solid ${colors.greyInputBorder}`,
    borderRadius: 3,
    display: 'inline-flex',
    height: 30,
    lineHeight: '30px',
    // padding: '0px 5px',
    margin: 0,
    width:'100%',
    boxShadow: 'inset 0 1px 2px rgba(17,17,17,.1)',
    flex:5,
    position: 'relative'
  },
  images: {
    login: {
      // size: 'is128X128',
      src: THEMESETTINGS.company_logo || '/company_logo.png',
      style: {
        margin: 'auto',
        marginBottom: '40px',
        width:'180px',
      },
    },
  },
  shadows: {
    dcp_card: {
      boxShadow: 'rgba(17, 17, 17, 0.14) 1px 1px 4px 2px',
    },
  },
  modalBlockPageUILayout: {
    layout: {
      component: 'div',
      children: [{
        component: 'Image',
        props: {
          src: THEMESETTINGS.company_logo || '/company_logo.png',
          style: {
            width: '170px',
            margin: '0 0 10px 0',
          },
        },
      }, {
        component: 'Button',
        props: {
          className: '__is_loading',
          buttonStyle: 'isOutlined',
          color: 'isWhite',
          state: 'isLoading',
          size: 'isLarge',
          style: {
            border: 'none',
          },
          children: 'Loading...',
        },
      },],
    },
    wrapperstyle: {
      zIndex: 100001,
    },
  }, 
  defaultconfirmModalStyle: {
    yesButtonText: 'DELETE',
    yesButtonProps: {
      style: {
        margin: '5px',
      },
      buttonProps: {
        color: 'isDanger',
      },
    },
    noButtonText: 'CANCEL',
    noButtonProps: {
      style: {
        margin: '5px',
      },
      buttonProps: {
        color: 'isPrimary',
      },
    },
    contentWrapperProps: {
    },
    buttonWrapperProps: {
      className: 'modal-footer-btns',
    },
  },
  newVersionConfirmModalStyle: {
    title: 'Create New Version',
    textContent: [{
      component: 'p',
      props: {
        style: {
          textAlign: 'left',
        },
      },
      children: 'Please confirm that you would like to create a new version.',
    }, ],
    yesButtonText: 'CREATE NEW VERSION',
    noButtonText: 'CANCEL',
    yesButtonProps: {
      style: {
        margin: '5px',
      },
      buttonProps: {
        color: 'isSuccess',
      },
    },
    noButtonProps: {
      style: {
        margin: '5px',
      },
      buttonProps: {
        // color: 'isDanger',
        color: 'isPrimary',
      },
    },
    contentWrapperProps: {
    },
    buttonWrapperProps: {
      className: 'modal-footer-btns',
    },
  },
  cardFormProps: {
    cardProps: {
      className: 'dcp_card',
    },
    headerStyle: {
      boxShadow: 'none',
      borderBottom:'1px solid lightgrey',
    },
    headerTitleStyle: {
      fontSize: 20,
      fontWeight: 700,
      position: 'relative',
    },
    cardStyle: {
      boxShadow: 'rgba(17, 17, 17, 0.14) 1px 1px 4px 2px',
      marginBottom: 20,
    },
  },
  cardProps: {
    // rightIcon: true,
    staticCard: true,
    headerStyle: {
      boxShadow: 'none',
      borderBottom:'1px solid lightgrey',
      cursor: 'initial',
      // fontSize:16,
    },
    headerTitleStyle: {
      fontSize: 20,
      fontWeight: 700,
      position: 'relative',
    },
    cardStyle: {
      boxShadow: 'rgba(17, 17, 17, 0.14) 1px 1px 4px 2px',
      marginBottom: 20,
    },
    cardProps: {
      className:'dcp_card',
    },
    // icon:'fa fa-minus',
    // iconDown: 'fa fa-minus',
    // iconUp: 'fa fa-plus',
  },
  collapsedCardProps: {
    rightIcon: true,
    headerStyle: {
      boxShadow: '0 1px 1px 0px #dbdbdb',
      cursor: 'pointer',
      // fontSize:16,
    },
    headerTitleStyle: {
      fontSize: 20,
      fontWeight: 700,
      position: 'relative',
      
    },
    cardStyle: {
      borderRadius: 0,
    },
    cardProps: {
      className: 'hide-card-gradient',
    },
    icon:'fa fa-minus',
    iconDown: 'fa fa-minus',
    iconUp: 'fa fa-plus',
  },
};
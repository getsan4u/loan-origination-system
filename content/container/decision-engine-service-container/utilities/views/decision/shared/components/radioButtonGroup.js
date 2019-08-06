'use strict';
const randomKey = Math.random;

function getRadioButtonGroup(radioData) {
  let multilineClass = (radioData.length > 3) ? ' multiline-radio-grp' : '';
  let radioGroup = radioData.map((data, idx) => {
    let radioId = data.name + '_' + data.value + '_' + idx;
    let icon = (data.icon)
      ? [ {
        component: 'span',
        props: {
          className: 'radio-icon',
          style: {
            backgroundImage: 'url(' + data.icon + ')',
          },
        },
      }]
      : (data.customIcon)
        ? data.customIcon
        : []
    return {
      type: 'radio',
      name: data.name,
      value: data.value,
      validateOnChange: true,
      passProps: {
        id: radioId
      },
      customLabel: {
        component: 'span',
        children: [
          ...icon,
          {
            component: 'span',
            props: {
              style: {
                margin: '0.8rem 0 0.4rem',
                textTransform: 'uppercase',
              }
            },
            children: data.title
          }, {
            component: 'span',
            props: {
              style: {
                fontStyle: 'italic',
                fontWeight: 'normal',
                lineHeight: 'normal',
                fontSize: data.subTextSize || 'inherit',
              }
            },
            children: data.subtext,
          }]
      },
      labelProps: {
        'htmlFor': radioId
      }
    }
  });

  return {
    gridProps: {
      key: randomKey(),
      className: 'radio-btn-group' + multilineClass,
    },
    formElements: radioGroup
  };
}

module.exports = getRadioButtonGroup;
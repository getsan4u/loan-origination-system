'use strict';
const styles = require('../../../utilities/views/constants/styles');
const cardprops = require('../../../utilities/views/decision/shared/components/cardProps');

function getResourceList(listData) {
  let list = listData.map((data, idx) => {
    return {
      component: 'Column',
      props: {
        size: (data.doubleList) ? '' : 'is4',
        style: {
          paddingLeft: (idx === 0) ? 0 : '20px',
        },  
      },
      children: [{
        component: 'p',
        props: {
          style: {
            fontSize: styles.fontSizes.contentLarge.fontSize,
            fontWeight: 700,
            paddingBottom: '10px',
            borderBottom: '1px solid #ccc',
            paddingLeft: '20px',
          },
        },
        children: [{
          component: 'span',
          children: data.title,
        },].concat((data.externalIcon) ? [{
          component: 'Icon',
          props: {
            icon: 'fa fa-external-link',
            style: {
              marginLeft: '5px',
              fontSize: '0.875rem',
              position: 'absolute',
            },
          },
        },] : []),
      },].concat( (data.links) 
        ? 
        {
          component: 'ul',
          props: {
            style: {
              listStyle: 'none',
              paddingLeft: '20px',
            },
          },
          children: data.links.map(link => {
            return {
              component: 'li',
              props: {
                style: {
                  marginBottom: '1em',
                  width: (data.doubleList) ? '50%' : '100%',
                  display: (data.doubleList) ? 'inline-block' : 'block',
                  verticalAlign: 'top',
                },
              },
              children: [{
                component: 'a',
                props: {
                  target: '_blank',
                  href: link.location,
                  style: Object.assign({
                    display: 'inline-block',
                    color: styles.colors.defaultDarkText,
                  }, link.style),
                },
                children: link.name,
              },],
            };
          }),
        } : (data.textContent) ? data.textContent.map(text => {
          return {
            component: 'p',
            props: {
              style: {
                marginLeft: '20px',
              },
            },
            children: text.name,
          };
        }) : []),
    };
  });
    
    
  return {
    component: 'Columns',
    children: list,
    props: {
      style: {
        padding: '10px',
      },
    },
  };
}

function getInfoBoxes(data, type) {
  let boxes = data.map((box, boxIdx) => {
    return {
      component: 'Column',
      props: {
        size: 'is4',
        style: {
          display: 'flex',
          minHeight: '260px',
        },
      },
      children: [{
        component: 'ResponsiveCard',
        props: cardprops({
          cardTitle: box.title,
          cardContentProps: {
            style: {
              display: 'flex',
              flex: '1 1 auto',
            },
          },
          cardStyle: {
            marginBottom: 0,
            display: 'flex',
            flexDirection: 'column',
          },
        }),
        children: [{
          component: 'Columns',
          props: {
            isMultiline: true,
            style: {
              margin: 0,
            },
          },
          children: [{
            component: 'Column',
            props: {
              style: {
                flex: 'none',
                width: '90px',
                paddingTop: 0,
              },
            },
            children: box.icon,
          }, {
            component: 'Column',
            props: {},
            children: box.textContent,
          }, {
            component: 'Column',
            props: {
              size: 'isFull',
              style: {
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                marginTop: '20px',
              },
            },
            children: box.button,
          },],
        },],
      },],
      //     .concat( (type === "flow" && boxIdx < data.length - 1) 
      //     ? [{
      //         component: 'Icon',
      //         props: {
      //             icon: 'fa fa-long-arrow-right',
      //             style: {
      //                width: '2px',
      //                right: '-1px',
      //                fontSize: '20px',
      //                position: 'relative',
      //                margin: 'auto',
      //                opacity: '0.4',

      //             }
      //         }
      //     }]
      //     : []
      // )
    };
  });
  return {
    component: 'Columns',
    children: boxes,
    props: {
      style: {
        marginBottom: '20px',
      },
    },
  };
}

module.exports = {
  getResourceList,
  getInfoBoxes,
};
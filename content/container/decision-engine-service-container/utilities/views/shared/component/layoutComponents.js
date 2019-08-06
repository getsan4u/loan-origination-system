'use strict';
const styles = require('../../constants/styles');
const randomKey = Math.random;

function formHeaderTitle(headerData) {
  return {
    gridProps: {
      key: randomKey(),
      style: {
        marginTop: 10,
        marginBottom: 10,
      }
    },
    formElements: [
      {
        type: 'layout',
        value: {
          component: 'div',
          children: [
            {
              component: 'Title',
              props: {
                size: 'is3',
                style: {
                  fontWeight: 600,
                }
              },
              children: headerData.title,
            },
          ],
        },
        layoutProps: {
          style: {
            display: 'flex',
            alignItems: 'center',
          }
        }
      }, ]
  };
}

function plainHeaderTitle(headerData) {
  let titleComponent = (headerData.title)
    ? [ {
      component: 'Column',
      props: {
        size: 'isFull',
      },
      children: [ {
        component: 'Title',
        props: {
          size: 'is3',
          style: {
            fontWeight: 600,
          }
        },
        children: headerData.title,
      } ].concat((headerData.subtitle)
        ? [ {
          component: 'Subtitle',
          props: {
            size: 'is6',
            style: {
            }
          },
          children: headerData.subtitle,
        } ] : [])
    } ] : [ {
      component: 'Column',
    } ];

  return {
    component: 'Container',
    children: [ {
      component: 'Columns',
      props: {
        isMultiline: true,
        style: {
          marginTop: '10px',
          marginBottom: '10px',
        }
      },
      children: titleComponent,
    } ]
  }
}

function detailHeaderTitle(headerData) {
  let titleComponent = (headerData.title)
    ? [ {
      component: 'Column',
      children: [ {
        component: 'Title',
        props: {
          size: 'is3',
          style: {
            fontWeight: 600,
          }
        },
        children: headerData.title
      }, {
        component: 'Subtitle',
        props: {
          size: 'is6',
        },
        children: [ {
          component: 'span',
          children: 'Version '
        }, {
          component: 'span',
          asyncprops: {
            children: [ `${headerData.type}data`, 'data', 'version' ],
          },
        }
        ]
      } ]
    } ] : [ {
      component: 'Column',
    } ];

  return {
    component: 'Container',
    children: [ {
      component: 'Columns',
      props: {
        style: {
          marginTop: '10px',
          marginBottom: '10px',
        }
      },
      children: titleComponent
    } ]
  };
}

function detailAsyncHeaderTitle(headerData) {
  let titleComponent = (headerData.title)
    ? [ {
      component: 'Column',
      children: [ {
        component: 'Title',
        props: {
          size: 'is3',
          style: {
            fontWeight: 600,
          }
        },
        children: [ {
          component: 'span',
          asyncprops: {
            children: [ `${headerData.type}data`, 'data', 'display_title' ],
          },
        }, ]
      }, {
        component: 'Subtitle',
        props: {
          size: 'is6',
        },
        children: [ {
          component: 'span',
          children: 'Version '
        }, {
          component: 'span',
          asyncprops: {
            children: [ `${headerData.type}data`, 'data', 'version' ],
          },
        }
        ]
      } ]
    } ] : [ {
      component: 'Column',
    } ];

  return {
    component: 'Container',
    children: [ {
      component: 'Columns',
      props: {
        style: {
          marginTop: '10px',
          marginBottom: (headerData.title) ? '10px' : 0,
        }
      },
      children: titleComponent
    } ]
  };
}

function simpleAsyncHeaderTitle(headerData) {
  let titleComponent = [ {
    component: 'Column',
    children: [ {
      component: 'Title',
      props: {
        size: 'is3',
        style: {
          fontWeight: 600,
        }
      },
      children: [ {
        component: 'span',
        asyncprops: {
          children: [ `${headerData.type}data`, 'data', 'display_title' ],
        },
      }, ]
    }, ]
  } ];

  return {
    component: 'Container',
    children: [ {
      component: 'Columns',
      props: {
        style: {
          marginTop: '10px',
          marginBottom: (headerData.title) ? '10px' : 0,
        }
      },
      children: titleComponent
    } ]
  };
}

function mlTransformationsAsyncHeaderTitle(headerData) {
  let titleComponent = [ {
    component: 'Column',
    children: [ {
      component: 'Title',
      props: {
        size: 'is3',
        style: {
          fontWeight: 600,
        }
      },
      children: [ {
        component: 'span',
        asyncprops: {
          children: [ `${headerData.type}data`, 'datasource', 'display_name' ],
        },
      }, ]
    }, ]
  } ]
  return {
    component: 'Container',
    children: [ {
      component: 'Columns',
      props: {
        style: {
          marginTop: '10px',
          marginBottom: (headerData.title) ? '10px' : 0,
        }
      },
      children: titleComponent
    } ]
  };
}

function detailAsyncTitleAndSubtitle(headerData) {
  let titleComponent = (headerData.title)
    ? [ {
      component: 'Column',
      children: [ {
        component: 'Title',
        props: {
          size: 'is3',
          style: {
            fontWeight: 600,
          }
        },
        children: [ {
          component: 'span',
          asyncprops: {
            children: [ `${headerData.type}data`, 'data', 'display_title' ],
          },
        }, ]
      }, {
        component: 'Subtitle',
        props: {
          size: 'is6',
        },
        children: [ {
          component: 'span',
          asyncprops: {
            children: [ `${headerData.type}data`, 'data', 'display_subtitle' ],
          },
        } ]
      } ]
    } ] : [ {
      component: 'Column',
    } ];

  return {
    component: 'Container',
    children: [ {
      component: 'Columns',
      props: {
        style: {
          marginTop: '10px',
          marginBottom: (headerData.title) ? '10px' : 0,
        }
      },
      children: titleComponent
    } ]
  };
}

function buttonAsyncHeaderTitle(headerData, buttonComponent) {
  let titleComponent = [ {
    component: 'Column',
    children: [ {
      component: 'Title',
      props: {
        size: 'is3',
        style: {
          fontWeight: 600,
        }
      },
      children: [ buttonComponent, ]
    }, ]
  } ]
  return {
    component: 'Container',
    children: [ {
      component: 'Columns',
      props: {
        style: {
          marginTop: '10px',
          marginBottom: (headerData.title) ? '10px' : 0,
        }
      },
      children: titleComponent
    } ]
  };
}

module.exports = {
  detailAsyncHeaderTitle,
  detailAsyncTitleAndSubtitle,
  detailHeaderTitle,
  formHeaderTitle,
  plainHeaderTitle,
  simpleAsyncHeaderTitle,
  mlTransformationsAsyncHeaderTitle,
  buttonAsyncHeaderTitle,
};
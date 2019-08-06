'use strict';

const utilities = require('../utilities');
const styles = utilities.views.constants.styles;
const plainHeaderTitle = utilities.views.shared.component.layoutComponents.plainHeaderTitle;
const decisionTabs = utilities.views.decision.shared.components.decisionTabs;
const strategyProcessingTabs = utilities.views.decision.shared.components.strategyProcessingTabs;
const simpleAsyncHeaderTitle = utilities.views.shared.component.layoutComponents.simpleAsyncHeaderTitle;

const ocrTabs = utilities.views.ocr.components.ocrTabs;
const ocrProcessingTabs = utilities.views.ocr.components.ocrProcessingTabs;

const mlTabs = utilities.views.ml.components.mlTabs;
const mlProcessingTabs = utilities.views.ml.components.mlProcessingTabs;
const detailAsyncTitleAndSubtitle = utilities.views.shared.component.layoutComponents.detailAsyncTitleAndSubtitle;

function getUserRole(user) {
  let userRoles = user.userroles;
  if (userRoles && userRoles.length) {
    return userRoles[ 0 ].name;
  }
  return 'user';
}

function decisionIndividualRun(userRole) {
  if (userRole === 'user') {
    return [
      decisionTabs('processing/individual/run', 'user'),
      plainHeaderTitle({
        title: [{
          component: 'span',
          children: 'Strategy Processing',
        }, ],
        subtitle: 'Generate rules-based decisions in individual or batch processes',
      }),
      strategyProcessingTabs('individual', 'user'),
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: ['pagedata', 'pageLayout', ],
        },
      },
    ];
  } else {
    return [
      decisionTabs('processing/individual/run', 'admin'),
      plainHeaderTitle({
        title: [{
          component: 'span',
          children: 'Strategy Processing',
        }, ],
        subtitle: 'Generate rules-based decisions in individual or batch processes',
      }),
      strategyProcessingTabs('individual', 'admin'),
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: ['pagedata', 'pageLayout', ],
        },
      }, ];
  }
}

function ocrIndividualRun(userRole) {
  if (userRole === 'user') {
    return [
      ocrTabs('processing/individual', 'user'),
      plainHeaderTitle({
        title: [{
          component: 'span',
          children: 'Text Recognition Processing',
        }, ],
        subtitle: 'Extract text from documents in individual or batch processes',
      }),
      ocrProcessingTabs('individual', 'user'),
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: ['pagedata', 'pageLayout', ],
        },
      },
    ];
  } else {
    return [
      ocrTabs('processing/individual', 'admin'),
      plainHeaderTitle({
        title: [{
          component: 'span',
          children: 'Text Recognition Processing',
        }, ],
        subtitle: 'Extract text from documents in individual or batch processes',
      }),
      ocrProcessingTabs('individual', 'admin'),
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: ['pagedata', 'pageLayout', ],
        },
      }, ];
  }
}

function mlIndividualRun(userRole) {
  if (userRole === 'user') {
    return [
      mlTabs('processing/individual', 'user'),
      plainHeaderTitle({
        title: [{
          component: 'span',
          children: 'Decision Processing',
        }, ],
        subtitle: 'Use your machine learning model to make accurate decisions',
      }),
      mlProcessingTabs('individual', 'user'),
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: ['pagedata', 'pageLayout', ],
        },
      }, ];
  } else {
    return [
      mlTabs('processing/individual', 'admin'),
      plainHeaderTitle({
        title: [{
          component: 'span',
          children: 'Decision Processing',
        },],
        subtitle: 'Use your machine learning model to make accurate decisions',
      }),
      mlProcessingTabs('individual', 'admin'),
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: ['pagedata', 'pageLayout',],
        },
      },];
  } 
}

function decisionBatchRun(userRole) {
  if (userRole === 'user') {
    return [
      decisionTabs('processing/individual/run', 'user'),
      plainHeaderTitle({
        title: [{
          component: 'span',
          children: 'Strategy Processing',
        }, ],
        subtitle: 'Generate rules-based decisions in individual or batch processes',
      }),
      strategyProcessingTabs('batch', 'user'),
      {
        component: 'Container',
        props: {
          style: {},
        },
        asyncprops: {
          _children: ['setupdata', 'simulationPage', ],
        },
      },
    ];
  } else {
    return [
      decisionTabs('processing/individual/run', 'admin'),
      plainHeaderTitle({
        title: [{
          component: 'span',
          children: 'Strategy Processing',
        }, ],
        subtitle: 'Generate rules-based decisions in individual or batch processes',
      }),
      strategyProcessingTabs('batch', 'admin'),
      {
        component: 'Container',
        props: {
          style: {},
        },
        asyncprops: {
          _children: ['setupdata', 'simulationPage', ],
        },
      },
    ];
  }
}

function ocrBatchRun(userRole) {
  if (userRole === 'user') {
    return [
      ocrTabs('processing/individual', 'user'),
      plainHeaderTitle({
        title: [{
          component: 'span',
          children: 'Text Recognition Processing',
        }, ],
        subtitle: 'Extract text from documents in individual or batch processes',
      }),
      ocrProcessingTabs('batch', 'user'),
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: ['pagedata', 'pageLayout', ],
        },
      }, ];
  } else {
    return [
      ocrTabs('processing/individual', 'admin'),
      plainHeaderTitle({
        title: [{
          component: 'span',
          children: 'Text Recognition Processing',
        }, ],
        subtitle: 'Extract text from documents in individual or batch processes',
      }),
      ocrProcessingTabs('batch', 'admin'),
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: ['pagedata', 'pageLayout', ],
        },
      }, ];
  }
}

function mlBatchRun(userRole) {
  if (userRole === 'user') {
    return [
      mlTabs('processing/individual', 'user'),
      plainHeaderTitle({
        title: [{
          component: 'span',
          children: 'Decision Processing',
        },],
        subtitle: 'Use your machine learning model to make accurate decisions',
      }),
      mlProcessingTabs('batch', 'user'),
      {
        component: 'Container',
        props: {
          style: {},
        },
        asyncprops: {
          _children: ['setupdata', 'mlbatchPage',],
        },
      },
    ];
  } else {
    return [
      mlTabs('processing/individual', 'admin'),
      plainHeaderTitle({
        title: [{
          component: 'span',
          children: 'Decision Processing',
        },],
        subtitle: 'Use your machine learning model to make accurate decisions',
      }),
      mlProcessingTabs('batch', 'admin'),
      {
        component: 'Container',
        props: {
          style: {},
        },
        asyncprops: {
          _children: ['setupdata', 'mlbatchPage',],
        },
      },
    ];
  } 
}

function decisionResultsIndividualDetail(userRole) {
  if (userRole === 'user') {
    return [
      decisionTabs('processing/individual/run', 'user'),
      simpleAsyncHeaderTitle({
        type: 'simulation',
        title: true,
      }),
      styles.fullPageDivider,
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: ['simulationdata', 'pageLayout', ],
        },
      },
    ];
  } else {
    return [
      decisionTabs('processing/individual/run', 'admin'),
      simpleAsyncHeaderTitle({
        type: 'simulation',
        title: true,
      }),
      styles.fullPageDivider,
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: ['simulationdata', 'pageLayout', ],
        },
      },
    ];
  }
}

function ocrResultsIndividualDetail(userRole) {
  if (userRole === 'user') {
    return [
      ocrTabs('processing/individual', 'user'),
      simpleAsyncHeaderTitle({
        type: 'page',
        title: true,
      }),
      ocrProcessingTabs('individual', 'user'),
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: ['pagedata', 'pageLayout', ],
        },
      },
    ];
  } else {
    return [
      ocrTabs('processing/individual', 'admin'),
      simpleAsyncHeaderTitle({
        type: 'page',
        title: true,
      }),
      ocrProcessingTabs('individual', 'admin'),
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: ['pagedata', 'pageLayout', ],
        },
      },
    ];
  }
}

function mlResultsIndividualDetail(userRole, page) {
  if (userRole === 'user') {
    if (page === 'results') {
      return [
        mlTabs('processing/individual', 'user'),
        detailAsyncTitleAndSubtitle({
          type: 'ml',
          title: true,
        }),
        styles.fullPageDivider,
        {
          component: 'Container',
          props: {
            className: 'ml',
          },
          asyncprops: {
            _children: ['mldata', 'pageLayout',],
          },
        },];
    } else {
      return [
        mlTabs('processing/individual', 'user'),
        plainHeaderTitle({
          title: [{
            component: 'span',
            children: 'Decision Processing',
          },],
          subtitle: 'Use your machine learning model to make accurate decisions',
        }),
        mlProcessingTabs('individual', 'user'),
        {
          component: 'Container',
          props: {
            className: 'simulation',
          },
          asyncprops: {
            _children: ['pagedata', 'pageLayout',],
          },
        },];
    }
  } else {
    if (page === 'results') {
      return [
        mlTabs('processing/individual', 'admin'),
        detailAsyncTitleAndSubtitle({
          type: 'ml',
          title: true,
        }),
        styles.fullPageDivider,
        {
          component: 'Container',
          props: {
            className: 'ml',
          },
          asyncprops: {
            _children: ['mldata', 'pageLayout',],
          },
        },];
    } else {
      return [
        mlTabs('processing/individual', 'admin'),
        plainHeaderTitle({
          title: [{
            component: 'span',
            children: 'Decision Processing',
          },],
          subtitle: 'Use your machine learning model to make accurate decisions',
        }),
        mlProcessingTabs('individual', 'admin'),
        {
          component: 'Container',
          props: {
            className: 'simulation',
          },
          asyncprops: {
            _children: ['pagedata', 'pageLayout',],
          },
        },];
    }
  }
}

function decisionResultsBatchDetail(userRole) {
  if (userRole === 'user') {
    return [
      decisionTabs('processing/individual/run', 'user'),
      simpleAsyncHeaderTitle({
        type: 'page',
        title: true,
      }),
      styles.fullPageDivider,
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: ['pagedata', 'pageLayout', ],
        },
      }, ];
  } else {
    return [
      decisionTabs('processing/individual/run', 'admin'),
      simpleAsyncHeaderTitle({
        type: 'page',
        title: true,
      }),
      styles.fullPageDivider,
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: ['pagedata', 'pageLayout', ],
        },
      }, ];
  }
}

function ocrResultsBatchDetail(userRole) {
  if (userRole === 'user') {
    return [
      ocrTabs('processing/individual', 'user'),
      simpleAsyncHeaderTitle({
        type: 'page',
        title: true,
      }),
      ocrProcessingTabs('batch', 'user'),
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: ['pagedata', 'pageLayout', ],
        },
      },
    ];
  } else {
    return [
      ocrTabs('processing/individual', 'admin'),
      simpleAsyncHeaderTitle({
        type: 'page',
        title: true,
      }),
      ocrProcessingTabs('batch', 'admin'),
      {
        component: 'Container',
        props: {
          className: 'simulation',
        },
        asyncprops: {
          _children: ['pagedata', 'pageLayout', ],
        },
      },
    ];
  }
}

function mlResultsBatchDetail(userRole, page) {
  if (userRole === 'user') {
    if (page === 'results') {
      return [
        mlTabs('processing/individual', 'user'),
        detailAsyncTitleAndSubtitle({
          type: 'ml',
          title: true,
        }),
        styles.fullPageDivider,
        {
          component: 'Container',
          props: {
            className: 'ml',
          },
          asyncprops: {
            _children: [ 'mldata', 'pageLayout', ],
          },
        },
      ]
    } else {
      return [
        mlTabs('processing/individual', 'user'),
        plainHeaderTitle({
          title: [{
            component: 'span',
            children: 'Decision Processing',
          },],
          subtitle: 'Use your machine learning model to make accurate decisions',
        }),
        mlProcessingTabs('batch', 'user'),
        {
          component: 'Container',
          props: {
            style: {},
          },
          asyncprops: {
            _children: ['setupdata', 'mlbatchPage',],
          },
        },
      ];
    }
  } else {
    if (page === 'results') {
      return [
        mlTabs('processing/individual', 'admin'),
        detailAsyncTitleAndSubtitle({
          type: 'ml',
          title: true,
        }),
        styles.fullPageDivider,
        {
          component: 'Container',
          props: {
            className: 'ml',
          },
          asyncprops: {
            _children: [ 'mldata', 'pageLayout', ],
          },
        }, 
      ]
    } else {
      return [
        mlTabs('processing/individual', 'admin'),
        plainHeaderTitle({
          title: [{
            component: 'span',
            children: 'Decision Processing',
          },],
          subtitle: 'Use your machine learning model to make accurate decisions',
        }),
        mlProcessingTabs('batch', 'admin'),
        {
          component: 'Container',
          props: {
            style: {},
          },
          asyncprops: {
            _children: ['setupdata', 'mlbatchPage',],
          },
        },
      ];
    }
  }
}


async function processingIndividualRun(req) {
  let userRole = getUserRole(req.user);
  let type = req.query.type;
  if (type === 'decision') {
    req.controllerData.layout = decisionIndividualRun(userRole);
  } else if (type === 'ocr') {
    req.controllerData.layout = ocrIndividualRun(userRole);
  } else if (type === 'ml') {
    req.controllerData.layout = mlIndividualRun(userRole);
  }
  return req;
}

async function processingBatchRun(req) {
  let userRole = getUserRole(req.user);
  let type = req.query.type;
  if (type === 'decision') {
    req.controllerData.layout = decisionBatchRun(userRole);
  } else if (type === 'ocr') {
    req.controllerData.layout = ocrBatchRun(userRole);
  } else if (type === 'ml') {
    req.controllerData.layout = mlBatchRun(userRole);
  }

  return req;
}

async function processingIndividualDetail(req) {
  let userRole = getUserRole(req.user);
  let type = req.query.type;
  let page = req.query.page || null;
  if (type === 'decision') {
    req.controllerData.layout = decisionResultsIndividualDetail(userRole);
  } else if (type === 'ocr') {
    req.controllerData.layout = ocrResultsIndividualDetail(userRole);
  } else if (type === 'ml') {
    req.controllerData.layout = mlResultsIndividualDetail(userRole, page);
  }
  return req;
}

async function processingBatchDetail(req) {
  let userRole = getUserRole(req.user);
  let type = req.query.type;
  let page = req.query.page || null;
  if (type === 'decision') {
    req.controllerData.layout = decisionResultsBatchDetail(userRole);
  } else if (type === 'ocr') {
    req.controllerData.layout = ocrResultsBatchDetail(userRole);
  } else if (type === 'ml') {
    req.controllerData.layout = mlResultsBatchDetail(userRole, page);
  }
  return req;
}


module.exports = {
  processingIndividualRun,
  processingBatchRun,
  processingIndividualDetail,
  processingBatchDetail,
};
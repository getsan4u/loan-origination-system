'use strict';

const moment = require('moment');
const styles = require('../../../../constants').styles;
const capitalize = require('capitalize');
const randomKey = Math.random;
const cardprops = require('../cardProps');
const formElements = require('../formElements');
const CONSTANTS = require('../../../constants');
const commentsModal = require('../../../modals/comment');
const DATA_TYPES_DROPDOWN = CONSTANTS.DATA_TYPES_DROPDOWN;
const VARIABLE_TYPES_DROPDOWN = CONSTANTS.VARIABLE_TYPES_DROPDOWN;

const variable = [ {
  gridProps: {
    key: randomKey(),
  },
  formElements: [ {
    type: 'submit',
    value: 'SAVE',
    passProps: {
      color: 'isPrimary',
    },
    layoutProps: {
      className: 'global-button-save',
    }
  }, ]
}, {
  gridProps: {
    key: randomKey(),
  },
  card: {
    twoColumns: true,
    props: cardprops({
      cardTitle: 'Variable Overview',
    }),
  },
  formElements: [ formElements({
    twoColumns: true,
    left: [
      {
        label: 'Variable Name',
        name: 'title',
        passProps: {
          state: 'isDisabled',
        },
      }, {
        label: 'Version Number',
        name: 'version',
        passProps: {
          state: 'isDisabled',
        },
      }, {
        name: 'data_type',
        label: 'Data Type',
        type: 'dropdown',
        value: '',
        passProps: {
          selection: true,
          fluid: true,
        },
        layoutProps: {
        },
        options: DATA_TYPES_DROPDOWN,
      }, {
        name: 'type',
        label: 'Variable Type',
        type: 'dropdown',
        value: '',
        passProps: {
          selection: true,
          fluid: true
        },
        layoutProps: {
        },
        options: VARIABLE_TYPES_DROPDOWN,
      }, {
        name: 'status',
        label: 'Status',
        passProps: {
          state: 'isDisabled',
        }
      }
    ],
    right: [ {
      label: 'Create Date',
      momentFormat: styles.momentFormat.birthdays,
      name: 'createdat',
      passProps: {
        state: 'isDisabled',
      },
    }, {
      label: 'Created By',
      name: 'user.creator',
      passProps: {
        state: 'isDisabled',
      },
    }, {
      label: 'Last Updated Date',
      momentFormat: styles.momentFormat.birthdays,
      name: 'updatedat',
      passProps: {
        state: 'isDisabled',
      },
    }, {
      label: 'Last Updated By',
      name: 'user.updater',
      passProps: {
        state: 'isDisabled',
      },
    }, {
      label: 'Description',
      name: 'description',
      type: 'textarea',
      sortable: false,
      headerColumnProps: {
        style: {
          whiteSpace: 'normal',
        },
      },
    }, ],
  }), ],
}, ]

const rule = [ {
  gridProps: {
    key: randomKey(),
  },
  formElements: [ {
    type: 'submit',
    value: 'SAVE',
    passProps: {
      color: 'isPrimary',
    },
    layoutProps: {
      className: 'global-button-save',
    }
  }, ]
}, {
  gridProps: {
    key: randomKey(),
  },
  card: {
    twoColumns: true,
    props: cardprops({
      cardTitle: 'Rule Overview',
    }),
  },
  formElements: [ formElements({
    twoColumns: true,
    left: [
      {
        label: 'Rule Name',
        name: 'title',
        passProps: {
          state: 'isDisabled',
        },
      }, {
        label: 'Rule Type',
        name: 'displaytype',
        passProps: {
          state: 'isDisabled',
        },
      }, {
        label: 'Version Number',
        name: 'version',
        passProps: {
          state: 'isDisabled',
        },
      }, {
        label: 'Description',
        name: 'description',
        type: 'textarea',
        sortable: false,
        headerColumnProps: {
          style: {
            whiteSpace: 'normal',
          },
        },
      }, {
        name: 'status',
        label: 'Status',
        passProps: {
          state: 'isDisabled',
        }
      }
    ],
    right: [ {
      label: 'Create Date',
      momentFormat: styles.momentFormat.birthdays,
      name: 'createdat',
      passProps: {
        state: 'isDisabled',
      },
    }, {
      label: 'Created By',
      name: 'user.creator',
      passProps: {
        state: 'isDisabled',
      },
    }, {
      label: 'Last Updated Date',
      momentFormat: styles.momentFormat.birthdays,
      name: 'updatedat',
      passProps: {
        state: 'isDisabled',
      },
    }, {
      label: 'Last Updated By',
      name: 'user.updater',
      passProps: {
        state: 'isDisabled',
      },
    }, ],
  }), ],
}, ]

const strategy = [ {
  gridProps: {
    key: randomKey(),
  },
  formElements: [ {
    type: 'submit',
    value: 'SAVE',
    passProps: {
      color: 'isPrimary',
    },
    layoutProps: {
      className: 'global-button-save',
    }
  }, ]
}, {
  gridProps: {
    key: randomKey(),
  },
  card: {
    twoColumns: true,
    props: cardprops({
      cardTitle: 'Overview',
    }),
  },
  formElements: [ formElements({
    twoColumns: true,
    left: [
      {
        label: 'Strategy Name',
        name: 'display_title',
        passProps: {
          state: 'isDisabled',
        },
      }, {
        label: 'Version',
        name: 'version',
        passProps: {
          state: 'isDisabled',
        },
      }, {
        name: 'status',
        label: 'Status',
        passProps: {
          state: 'isDisabled',
        }
      },
    ],
    right: [ {
      label: 'Created',
      name: 'created',
      passProps: {
        state: 'isDisabled',
      },
    }, {
      label: 'Updated',
      name: 'updated',
      passProps: {
        state: 'isDisabled',
      },
    }, {
      label: 'Description',
      name: 'description',
      type: 'textarea',
      sortable: false,
      headerColumnProps: {
        style: {
          whiteSpace: 'normal',
        },
      },
    }, ],
  }), ],
}, ]

const OVERVIEW_CONFIGS = {
  variable,
  rule,
  strategy: [],
}

module.exports = OVERVIEW_CONFIGS;
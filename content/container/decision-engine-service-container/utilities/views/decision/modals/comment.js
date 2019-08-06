'use strict';

const commentsModal = {
    type: 'comment',
    name: 'comments',
    title: 'Confirmation',
    textContent: [{
      component: 'label',
      children: 'Comment: ',
          props: {
            className: '__re-bulma_label',
            style: {
              textAlign: 'left',
            },
          },
    }, ],
    buttonWrapperProps: {
      className: 'modal-footer-btns',
    },
    contentWrapperProps: {
    },
    yesButtonText: 'SAVE',
    yesButtonProps: {
      buttonProps: {
        color: 'isSuccess',
      },
    },
    noButtonText: 'NO, I NEED TO UPDATE',
    noButtonProps: {
      buttonProps: {
        color: 'isDanger',
      },
    },
  };

module.exports = commentsModal;
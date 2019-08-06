'use strict';

var ReactDOM = require('react-dom');
var React = require('react');

exports.init = function () {
  window.__ra_custom_elements = {
    'CustomAxisTick': require('./CustomAxisTick'),
    'MLAxisTick': require('./MLAxisTick'),
    'CustomNavBar': require('./CustomNavBar'),
    'CustomPieChart': require('./CustomPieChart'),
    'CustomDot': require('./CustomDot'),
  };

  function updateGlobalSearchBar() {
    let search = document.querySelectorAll('.global-table-search');
    let wrapper = document.querySelector('.global-search-bar');
    let globalButtonBar = document.querySelector('.global-button-bar');
    if (globalButtonBar && globalButtonBar.firstChild && !globalButtonBar.firstChild.childElementCount) globalButtonBar.removeChild(globalButtonBar.firstChild);
    if (wrapper && search.length > 0) {
      search.forEach(function (el) {
        wrapper.appendChild(el);
        let elInput = el.querySelector('input');
        if (elInput) {
          elInput.oninput = function () {
            elInput.setAttribute('value', input.value)
          };
        }
      })
    }
  }
  window.updateGlobalSearchBar = updateGlobalSearchBar;

  function initStrategyIcons() {
    jQuery('.grid.livicon').addLiviconEvo({
      name: 'grid.svg',
      size: '80px',
      autoPlay: true,
      style: 'filled',
      fillColor: '#68d7e3',
      strokeColor: '#404041',
    });
    setTimeout(() => {
      jQuery('.diagram.livicon').delay(2000).addLiviconEvo({
        name: 'diagram.svg',
        style: 'filled',
        size: '80px',
        autoPlay: true,
        fillColor: '#68d7e3',
        strokeColor: '#404041',
      });
    }, 1500);

    setTimeout(() => {
      jQuery('.bulb.livicon').addLiviconEvo({
        name: 'bulb.svg',
        style: 'filled',
        size: '80px',
        autoPlay: true,
        fillColor: '#68d7e3',
        strokeColor: '#404041',
      });
    }, 3000);
  }
  window.initStrategyIcons = initStrategyIcons;

  function initIntegrationIcons() {
    jQuery('.share.livicon').addLiviconEvo({
      name: 'share.svg',
      size: '80px',
      autoPlay: true,
      drawOnViewport: true,
      style: 'filled',
      fillColor: '#68d7e3',
      strokeColor: '#404041',
    });
    setTimeout(() => {
      jQuery('.notebook.livicon').delay(2000).addLiviconEvo({
        name: 'notebook.svg',
        style: 'filled',
        size: '80px',
        autoPlay: true,
        drawOnViewport: true,
        fillColor: '#68d7e3',
        strokeColor: '#404041',
      });
    }, 1500);

    setTimeout(() => {
      jQuery('.servers.livicon').addLiviconEvo({
        name: 'servers.svg',
        style: 'filled',
        size: '80px',
        autoPlay: true,
        drawOnViewport: true,
        fillColor: '#68d7e3',
        strokeColor: '#404041',
      });
    }, 3000);
  }
  window.initIntegrationIcons = initIntegrationIcons;

  function initOptimizationIcons() {
    jQuery('.cloud-upload.livicon').addLiviconEvo({
      name: 'cloud-upload.svg',
      style: 'filled',
      size: '75px',
      drawOnViewport: true,
      autoPlay: true,
      strokeColor: '#404041',
      fillColor: '#68d7e3',
    });
    setTimeout(() => {
      jQuery('.timer.livicon').addLiviconEvo({
        name: 'timer.svg',
        style: 'linesAlt',
        size: '120px',
        strokeColor: '#404041',
        strokeColorAlt: '#68d7e3',
        size: '75px',
        autoPlay: true,
        drawOnViewport: true,
      });
    }, 1800);
    setTimeout(() => {
      jQuery('.bar-chart.livicon').addLiviconEvo({
        name: 'bar-chart.svg',
        style: 'filled',
        size: '75px',
        autoPlay: true,
        fillColor: '#68d7e3',
        strokeColor: '#404041',
      });
    }, 3600);
  }
  window.initOptimizationIcons = initOptimizationIcons;

  function initSimulationIcons() {
    jQuery('.settings.livicon').addLiviconEvo({
      name: 'settings.svg',
      style: 'filled',
      size: '75px',
      drawOnViewport: true,
      autoPlay: true,
      fillColor: '#68d7e3',
      strokeColor: '#404041',
    });
    setTimeout(() => {
      jQuery('.lab.livicon').addLiviconEvo({
        name: 'lab.svg',
        style: 'filled',
        size: '75px',
        autoPlay: true,
        drawOnViewport: true,
        fillColor: '#68d7e3',
        strokeColor: '#404041',
      });
    }, 1800);
    setTimeout(() => {
      jQuery('.bar-chart.livicon').addLiviconEvo({
        name: 'bar-chart.svg',
        style: 'filled',
        size: '75px',
        autoPlay: true,
        fillColor: '#68d7e3',
        strokeColor: '#404041',
      });
    }, 3600);
  }
  window.initSimulationIcons = initSimulationIcons;

  function dynamicModalHeight() {
    let modal = document.querySelector('.__re-bulma_modal-card-body');
    var config = { attributes: true, subtree: true, childList: true, };
    var callback = function (mutationsList) {
      for (var mutation of mutationsList) {
        let datePickerOpened = mutation.type === 'childList' &&
          mutation.addedNodes[ 0 ] && mutation.addedNodes[ 0 ].classList && mutation.addedNodes[ 0 ].classList.contains('SingleDatePicker_picker');

        let datePickerClosed = mutation.type === 'childList' && mutation.removedNodes[ 0 ] && mutation.removedNodes[ 0 ].classList && mutation.removedNodes[ 0 ].classList.contains('SingleDatePicker_picker');

        let dropDownChanged = mutation.type === 'attributes' && mutation.attributeName === 'aria-expanded' &&
          mutation.target.classList.contains('selection') && mutation.target.classList.contains('dropdown');

        let dropDownOpened = dropDownChanged && mutation.target.attributes[ 'aria-expanded' ].value === 'true';

        if (datePickerOpened || datePickerClosed || dropDownChanged) {
          setTimeout(() => {
            let maxHeight = window.innerHeight - 40;
            let modalHeight = modal.clientHeight;
            let modalScrollHeight = modal.scrollHeight;

            if (maxHeight !== modalScrollHeight) {
              if (modalScrollHeight < maxHeight) {
                modal.style.height = (modalScrollHeight === modalHeight) ? 'auto' : modalScrollHeight + 'px';
              } else {
                modal.style.height = maxHeight + 'px';
              }
            }

            modalHeight = modal.clientHeight;
            modalScrollHeight = modal.scrollHeight;
            let modalBounds = modal.getBoundingClientRect();

            if (datePickerOpened) {
              let targetBounds = (mutation.addedNodes[ 0 ])
                ? mutation.addedNodes[ 0 ].getBoundingClientRect()
                : document.querySelector('.SingleDatePicker_picker').getBoundingClientRect();

              if (targetBounds.bottom > modalBounds.bottom) {
                modal.scrollBy({
                  top: targetBounds.bottom - modalBounds.bottom,
                  behavior: 'smooth',
                });
              }
            } else if (dropDownOpened) {
              let targetBounds = mutation.target.getBoundingClientRect();
              if (targetBounds.bottom > modalBounds.bottom) {
                modal.scrollBy({
                  top: targetBounds.bottom - modalBounds.bottom,
                  behavior: 'smooth',
                });
              }
            }

          }, 10)
        }
      }
    };
    var observer = new MutationObserver(callback);
    observer.observe(modal, config);
  }
  window.dynamicModalHeight = dynamicModalHeight;

  function refreshRecaptcha() {
    grecaptcha.reset();
  }
  window.refreshRecaptcha = refreshRecaptcha;

  function recaptchaCallback(site_key) {
    return function (response) {
      window.refForm.props.hiddenFields[ window.refForm.props.hiddenFields.length - 1 ].form_static_val = response;
      let recaptcha_error_msg = document.getElementById('recaptcha_error_msg');
      if (recaptcha_error_msg) {
        recaptcha_error_msg.parentNode.removeChild(recaptcha_error_msg);
        if (Object.keys(window.refForm.state.formDataErrors).length === 0) {
          document.querySelector('.__cis_submit_btn button').classList.remove('__re-bulma_is-disabled');
        }
        if (window.refForm.props.validations[ window.refForm.props.validations.length - 1 ].name === 'recaptcha_response') {
          window.refForm.props.validations.pop();
        }
        let formDataErrors = Object.assign({}, window.refForm.state.formDataErrors);
        delete formDataErrors[ 'recaptcha_response' ];
        window.refForm.setState({ formDataErrors, });
      }
    };
  }

  function renderRecaptcha() {
    try {
      let recaptcha_element = document.getElementById('recaptcha_element');
      let recaptcha_parent = recaptcha_element.parentNode;
      var site_key = recaptcha_element.getAttribute('data-sitekey');
      let submitButton = document.querySelector('.submit-wrapper button');
      let submit_wrapper = document.querySelector('.submit-wrapper');

      submit_wrapper.classList.add('__rendered_recaptcha');
      // submit_wrapper.style['margin-top'] = '120px';
      // document.querySelector('.__rendered_recaptcha div').style.display = 'flex';
      // document.querySelector('.__rendered_recaptcha div').style['align-items'] = 'center';


      let recaptcha_wrapper = document.createElement('div');
      recaptcha_wrapper.className = 'recaptcha_wrapper';
      recaptcha_parent.replaceChild(recaptcha_wrapper, recaptcha_element);
      submit_wrapper.insertAdjacentElement('beforebegin', recaptcha_wrapper);
      recaptcha_wrapper.appendChild(recaptcha_element);
      submitButton.addEventListener('click', function () {
        if (!window.refForm.props.hiddenFields[ window.refForm.props.hiddenFields.length - 1 ].form_static_val && !document.getElementById('recaptcha_error_msg')) {
          let recaptchaContainer = document.querySelector('#recaptcha_element');
          submitButton.className = (submitButton.className.indexOf('__re-bulma_is-disabled')) ? submitButton.className
            : submitButton.className + '__re-bulma_is-disabled';
          let errorMsg = document.createElement('p');
          errorMsg.id = 'recaptcha_error_msg';
          errorMsg.textContent = 'Please complete reCAPTCHA before continuing.';
          recaptchaContainer.appendChild(errorMsg);
          window.refForm.props.validations.push({
            'name': 'recaptcha_response',
            'constraints': {
              'recaptcha_response': {
                presence: {
                  message: '^Please complete reCAPTCHA before continuing.',
                },
              },
            },
          });
          let formDataErrors = Object.assign({}, window.refForm.state.formDataErrors, { recaptcha_response: 'Please complete reCAPTCHA before continuing.', });
          window.refForm.setState({ formDataErrors, });
        }
      });
    } catch (e) {
      console.log(e);
    }
    try {
      grecaptcha.render('recaptcha_element', {
        sitekey: recaptcha.site_key,
        callback: recaptchaCallback(recaptcha.site_key),
      });
    } catch (e) {
      console.log(e);
    }
  }
  window.renderRecaptcha = renderRecaptcha;


  function _getRotationAngle(start, end) {
    let endAngle = (start - 300) / (end - 300) * 360;
    return `rotate(${endAngle}deg)`;
  }

  function _getCircleDashArray(start, end, dashArray) {
    let value = Math.ceil((1 - (start - 300) / (end - 300)) * dashArray);
    return `${value} ${dashArray}`;
  }

  function animateScorePie(score) {
    let progressPath = document.querySelector('#progress-path');
    let progressMarker = document.querySelector('#progress-marker');
    const newDashArray = _getCircleDashArray(score, 850, 768);
    const newRotationAngle = _getRotationAngle(score, 850);
    if (progressPath) progressPath.setAttribute('stroke-dasharray', newDashArray);
    if (progressMarker) progressMarker.style.transform = newRotationAngle;
  }

  function renderScorePieChart() {
    let container = document.querySelector('#credit-score-container');
    if (container) {
      let score = parseInt(container.getAttribute('data'));
      let a = window.__ra_custom_elements.CustomPieChart({
        currentValue: score,
        totalValue: 850
      });
      ReactDOM.render(a, container)
      setTimeout(() => {
        animateScorePie(score);
      }, 10)
    }
  }
  window.renderScorePieChart = renderScorePieChart;
};

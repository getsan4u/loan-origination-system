'use strict';

var React = require('react');

class CustomNavBar extends React.Component {
  render() {
    let navData = this.props.navData;
    return (
      <div className="ui vertical accordion ui strategy-sidebar menu">
        {navData.titles.map((title, idx) => {
          return <div key={idx} className="fitted item" >
            <div className="active title" onClick={function(){
              event.target.classList.toggle('active');
              event.target.nextElementSibling.classList.toggle('active');
            }}>
              <i ariaHidden="true" className="dropdown icon"></i>
              {title}
            </div>
            <div className="content active">
              {navData.buttons[idx].map((button, btnIdx) => {
                return <div key={idx - btnIdx} className={(button.active) ? 'nav-link active-nav-link' : 'nav-link'}>
                  <a href={button.location}>
                    {button.children}
                  </a>
                </div>;
              })}
            </div>
          </div>;
        })}
      </div>
    );
  }
}

module.exports = CustomNavBar;
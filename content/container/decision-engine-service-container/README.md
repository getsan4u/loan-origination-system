# decision-engine-service-container [![Coverage Status](https://coveralls.io/repos/github/githubUserOrgName/decision-engine-service-container/badge.svg?branch=master)](https://coveralls.io/github/githubUserOrgName/decision-engine-service-container?branch=master) [![Build Status](https://travis-ci.org/githubUserOrgName/decision-engine-service-container.svg?branch=master)](https://travis-ci.org/githubUserOrgName/decision-engine-service-container)

  A simple extension.

  [API Documentation](https://github.com/githubUserOrgName/decision-engine-service-container/blob/master/doc/api.md)

  ## Usage

  ### CLI TASK

  You can preform a task via CLI
  ```
  $ cd path/to/application/root
  ### Using the CLI
  $ periodicjs ext decision-engine-service-container hello  
  ### Calling Manually
  $ node index.js --cli --command --ext --name=decision-engine-service-container --task=hello 
  ```

  ## Configuration

  You can configure decision-engine-service-container

  ### Default Configuration
  ```javascript
  {
    settings: {
      defaults: true,
    },
    databases: {
    },
  };
  ```


  ## Installation

  ### Installing the Extension

  Install like any other extension, run `npm run install decision-engine-service-container` from your periodic application root directory and then normally you would run `periodicjs addExtension decision-engine-service-container`, but this extension does this in the post install npm script.
  ```
  $ cd path/to/application/root
  $ npm run install decision-engine-service-container
  $ periodicjs addExtension decision-engine-service-container //this extension does this in the post install script
  ```
  ### Uninstalling the Extension

  Run `npm run uninstall decision-engine-service-container` from your periodic application root directory and then normally you would run `periodicjs removeExtension decision-engine-service-container` but this extension handles this in the npm post uninstall script.
  ```
  $ cd path/to/application/root
  $ npm run uninstall decision-engine-service-container
  $ periodicjs removeExtension decision-engine-service-container // this is handled in the npm postinstall script
  ```


  ## Testing
  *Make sure you have grunt installed*
  ```
  $ npm install -g grunt-cli
  ```

  Then run grunt test or npm test
  ```
  $ grunt test && grunt coveralls #or locally $ npm test
  ```
  For generating documentation
  ```
  $ grunt doc
  $ jsdoc2md commands/**/*.js config/**/*.js controllers/**/*.js  transforms/**/*.js utilities/**/*.js index.js > doc/api.md
  ```
  ## Notes
  * Check out https://github.com/typesettin/periodicjs for the full Periodic Documentation
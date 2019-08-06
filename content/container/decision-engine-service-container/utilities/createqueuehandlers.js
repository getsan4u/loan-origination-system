'use strict';
const Promisie = require('promisie');
const async = require('async');

var _get_count = function (cb) {
  let count = function (callback) {
    try {
      this.model.find({}, { 'identification.trace_number': 1 })
        .sort({ 'identification.trace_number': -1 })
        .limit(1)
        .exec((err, data) => {
          if (err) { callback(err); } else {
            this.model.count({}, (err, num) => {
              if (err) { callback(err); } else {
                if (!data || !data.length) {
                  callback(null, this.startIndex);
                } else {
                  callback(null, ((typeof data[ 0 ].trace_number === 'number') ? data[ 0 ].trace_number + 1 : this.startIndex + num));
                }
              }
            });
          }
        });
    } catch (e) {
      callback(e);
    }
  };
  if (typeof cb === 'function') { count(cb); } else { return Promisie.promisify(count, this)(); }
};

var genthrow = function (generator, e) {
  setTimeout(function () {
    generator.throw(e);
  }, 0);
};

var gennext = function (generator) {
  setTimeout(function () {
    generator.next();
  }, 0);
};

var _route = function (req, res, cb) {
  let middleware = Object.assign([], this.middleware);
  let responder;
  let middlewareGenerator = function* () {
    try {
      while (middleware.length) {
        let fn = middleware.shift();
        yield fn(req, res, err => {
          (err) ? genthrow(responder, err) : gennext(responder);
        });
      }
    } catch (e) {
      cb(e);
    }
  };
  responder = middlewareGenerator();
  responder.next();
};

var _task = function (data, cb) {
  try {
    let { req, res } = data;
    _get_count.call(this)
      .then(count => {
        try {
          req.body = (req.body && typeof req.body === 'object') ? req.body : {};
          if (req.body && typeof req.body === 'object' && req.body.data && Array.isArray(req.body.data)) {
            req.body.data = req.body.data.map(datum => {
              datum.guid = (typeof datum.guid !== 'string' || (typeof datum.guid === 'string' && !datum.guid.length)) ? this.createGUID(datum, count) : datum.guid;
              datum.trace_number = count;
              count++;
              return datum;
            });
          } else {
            req.body.guid = (typeof req.body.guid !== 'string' || (typeof req.body.guid === 'string' && !req.body.guid.length)) ? this.createGUID(req.body, count) : req.body.guid;
            req.body.trace_number = count;
          }
        } catch (e) {
          return Promise.reject(e);
        }
        _route.apply(this, [ req, res, cb ]);
      })
      .catch(cb);
  } catch (e) {
    cb(e);
  }
};

var _applyGUID = function (data, count) {
  return `${this.namespace}-${count}`;
};

/**
 * @class CreateQueue
 * @classdesc Sets up queue of middlewares for document creation
 */
var CreateQueue = class CreateQueue {
  constructor(options) {
    this.middleware = options.middleware;
    this.startIndex = options.startIndex || 1;
    this.namespace = options.namespace;
    this.onError = (typeof options.onError === 'function') ? options.onError : undefined;
    this.model = options.model;
    this.createGUID = (typeof options.createGUID === 'function') ? options.createGUID : _applyGUID.bind(this);
    this.queue = async.queue(_task.bind(this), 1);
    return this;
  }
  push(req, res) {
    this.queue.push({ req, res }, err => {
      if (this.onError && err) { this.onError(req, res, err); }
    });
  }
  set_middleware() {
    return this.push.bind(this);
  }
};

module.exports = CreateQueue;
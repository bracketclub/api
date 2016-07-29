'use strict';

const path = require('path');
const bucker = require('bucker');
const config = require('getconfig');
const _ = require('lodash');

const createLogger = (type) => bucker.createLogger({
  console: {color: true},
  app: _.extend(config.watchers.logOptions, {
    filename: path.resolve(__dirname, '..', '..', 'logs', `${type}.log`)
  })
});

module.exports = createLogger;

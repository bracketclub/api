'use strict';

const bucker = require('bucker');
const path = require('path');
const config = require('getconfig');
const _ = require('lodash');

const createLogger = (type) => bucker.createLogger({
  console: {color: true},
  app: _.extend(config.watchers.logOptions, {
    filename: path.resolve(__dirname, '..', '..', 'logs', `${type}.log`)
  })
});

module.exports = createLogger;

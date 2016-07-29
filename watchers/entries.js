'use strict';

const EntryWatcher = require('@lukekarrys/entry-watcher');
const _ = require('lodash');
const config = require('getconfig');

const onSave = require('./lib/saveEntry');
const createLogger = require('./lib/logger');
const sportYear = require('./lib/sportYear');

const sport = sportYear.sport;
const year = sportYear.year;

const logger = createLogger(`entries:${sportYear.id}`);

const watcher = new EntryWatcher(_.extend({
  logger,
  onSave: onSave({logger, sport, year}),
  type: 'tweet',
  auth: config.twitter,
  sport,
  year
}, config.tweetyourbracket));

watcher.start();

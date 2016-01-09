'use strict';

const EntryWatcher = require('@lukekarrys/entry-watcher');
const _ = require('lodash');
const async = require('async');
const config = require('getconfig');

const pgConnect = require('./lib/pgConnect');
const createLogger = require('./lib/logger');
const rpcClient = require('./lib/rpcClient');

const logger = createLogger('entries');

const onSave = (data) => pgConnect(logger, (client, done) => {
  const queryCb = (type, cb) => (err, res) => {
    if (err) {
      logger.error(`${type} error: ${err}`);
      return cb(err);
    }

    logger.debug(`${type} success: ${JSON.stringify(_.pick(res, 'command', 'rowCount'))}`);
    cb(null);
  };

  async.series([
    (cb) => client.query(
      `INSERT INTO users
      (user_id, username, name, profile_pic)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
      ${['username', 'name', 'profile_pic'].map((k) => `${k} = EXCLUDED.${k}`).join(', ')};`,
      [data.user_id, data.username, data.name, data.profile_pic],
      queryCb('user', cb)
    ),
    (cb) => client.query(
      `INSERT INTO entries
      (data_id, bracket, user_id, created)
      VALUES ($1, $2, $3, $4)`,
      [data.data_id, data.bracket, data.user_id, data.created],
      queryCb('entry', cb)
    )
  ], () => {
    done();
    rpcClient.call('entries', data, _.noop);
  });
});

new EntryWatcher(_.extend({
  logger,
  onSave,
  type: 'tweet',
  auth: config.twitter,
  _forceOpen: true
}, config.tweetyourbracket)).start();

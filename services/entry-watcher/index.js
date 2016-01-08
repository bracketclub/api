'use strict';

const EntryWatcher = require('@lukekarrys/entry-watcher');
const path = require('path');
const _ = require('lodash');
const pg = require('pg');
const async = require('async');

const packageInfo = require('../../package');
const Channels = require('../../lib/channels');
const sseHandler = require('../../lib/sseHandler');

exports.register = (plugin, config, next) => {
  if (!config.start) {
    return next();
  }

  const channels = new Channels();
  const log = (type, text) => plugin.log(['entry-watcher', type], text);

  plugin.route({method: 'GET', path: '/entries/events', handler: sseHandler(channels)});

  pg.connect(config.postgres.connectionString, (connectErr, client, done) => {
    if (connectErr) return next(connectErr);

    const onSave = (data) => {
      log('debug', `data: ${JSON.stringify(data)}`);

      const queryCb = (type, cb) => (err, res) => {
        if (err) {
          log('error', `${type} error: ${err}`);
          return cb(err);
        }

        log('debug', `${type} success: ${JSON.stringify(_.pick(res, 'command', 'rowCount'))}`);
        cb(null);
      };

      const upsertUser = (cb) => client.query(
        `INSERT INTO users
        (user_id, username, name, profile_pic)
        VALUES ($1, $2, $3, $4) ON CONFLICT (user_id)
        DO UPDATE SET
        ${['username', 'name', 'profile_pic'].map((k) => `${k} = EXCLUDED.${k}`).join(', ')};`,
        [data.user_id, data.username, data.name, data.profile_pic],
        queryCb('user', cb)
      );

      const insertEntry = (cb) => client.query(
        `INSERT INTO entries
        (data_id, bracket, user_id, created)
        VALUES ($1, $2, $3, $4)`,
        [data.data_id, data.bracket, data.user_id, data.created],
        queryCb('entry', cb)
      );

      async.series([upsertUser, insertEntry], () => {
        done();
        channels.write({event: 'entries', data});
      });
    };

    new EntryWatcher(_.extend({
      onSave,
      logfile: path.resolve(__dirname, '..', 'logs', 'entries.log'),
      type: 'tweet',
      auth: config.twitter,
      _forceOpen: config.force
    }, config.tweetyourbracket)).start();

    next();
  });
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-entry-watcher`,
  version: packageInfo.version
};

'use strict';

const EntryWatcher = require('entry-watcher');
const path = require('path');
const _ = require('lodash');
const pg = require('pg');
const async = require('async');

const Channels = require('../lib/channels');
const sseHandler = require('../lib/sseHandler');

exports.register = (plugin, config, next) => {
  if (!config.start) {
    return next();
  }

  const channels = new Channels();

  plugin.route({
    method: 'GET',
    path: '/entries/events',
    handler: sseHandler(channels)
  });

  pg.connect(config.postgres.connectionString, (connectErr, client, done) => {
    if (connectErr) return next(connectErr);

    const onSave = (data) => {
      const upsertUser = (cb) => client.query(
        'INSERT INTO users (user_id, username, name, profile_pic) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET username = EXCLUDED.username, name = EXCLUDED.name, profile_pic = EXCLUDED.profile_pic;',
        [data.user_id, data.username, data.name, data.profile_pic],
        cb
      );

      const insertEntry = (cb) => client.query(
        'INSERT INTO entries (data_id, bracket, user_id, created) VALUES ($1, $2, $3, $4)',
        [data.data_id, data.bracket, data.user_id, data.created],
        cb
      );

      async.series([upsertUser, insertEntry], (err, results) => {
        done();

        if (err) {
          return plugin.log(['error', 'entry-watcher'], `Error inserting user entry: ${err}`);
        }

        plugin.log(['debug', 'entry-watcher'], `Error inserting user entry: ${err}`);
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
  name: 'entry-watcher',
  version: '1.0.0'
};

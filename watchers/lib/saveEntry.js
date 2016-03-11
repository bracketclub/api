'use strict';

const _ = require('lodash');
const async = require('async');

const pgConnect = require('./pgConnect');
const rpcClient = require('./rpcClient');

const onSave = (options) => {
  const logger = options.logger;
  const sport = options.sport;
  const year = options.year;

  return (data) => pgConnect(logger, (client, done) => {
    const queryCb = (type, cb) => (err, res) => {
      if (err) {
        logger.error(`${type} error: ${err}`);
        cb(err);
        return;
      }

      logger.debug(`${type} success: ${JSON.stringify(_.pick(res, 'command', 'rowCount'))}`);
      cb(null);
    };

    async.series([
      (cb) => client.query(
        `INSERT INTO users
        (id, username, name, profile_pic)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
        ${['username', 'name', 'profile_pic'].map((k) => `${k} = EXCLUDED.${k}`).join(', ')};`,
        [data.user_id, data.username, data.name, data.profile_pic],
        queryCb('user', cb)
      ),
      (cb) => client.query(
        `INSERT INTO entries
        (id, bracket, "user", created, sport)
        VALUES ($1, $2, $3, $4, $5);`,
        [data.data_id, data.bracket, data.user_id, data.created, sport],
        queryCb('entry', cb)
      )
    ], () => {
      done();
      rpcClient('entries', `${sport}-${year}`, {id: data.user_id});
    });
  });
};

module.exports = onSave;

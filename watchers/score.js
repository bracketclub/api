'use strict';

const ScoreWatcher = require('@lukekarrys/score-watcher');
const _ = require('lodash');
const config = require('getconfig');
const bracketData = require('bracket-data');

const pgConnect = require('./lib/pgConnect');
const createLogger = require('./lib/logger');
const rpcClient = require('./lib/rpcClient');

const logger = createLogger('scores');

const emptyBracket = bracketData({
  sport: config.tweetyourbracket.sport,
  year: config.tweetyourbracket.year
}).constants.EMPTY;

const onSave = (master, cb) => pgConnect(logger, (client, done) => {
  client.query(
    `INSERT INTO masters
    (bracket, created)
    VALUES ($1, $2);`,
    [master, new Date().toJSON()],
    (err) => {
      done();

      if (err) {
        logger.error(`Error inserting new bracket: ${err}`);
      }
      else {
        logger.error(`Success inserting new bracket: ${master}`);
        rpcClient.call('masters', master, _.noop);
      }
    }
  );
});

pgConnect(logger, (client, done) => {
  const startWatcher = (master) =>
    new ScoreWatcher(_.extend({
      master,
      logger,
      onSave,
      scores: {interval: 1}
    }, config.tweetyourbracket)).start();

  client.query(
    `INSERT INTO masters
    (bracket, created)
    VALUES ($1, $2);`,
    [emptyBracket, new Date().toJSON()],
    (insertErr) => {
      done();

      // The empty bracket already exists in the DB for this year, so we should
      // start the watcher with the latest bracket
      if (insertErr && insertErr.message.startsWith('duplicate key value violates unique constraint')) {
        return client.query(
          `SELECT bracket FROM masters
          WHERE extract(YEAR from created) = $1
          ORDER BY created desc
          LIMIT 1;`,
          [config.tweetyourbracket.year],
          (err, res) => {
            if (err) return logger.error(`Error selecting latest master: ${err}`);
            startWatcher(res.rows[0]);
          }
        );
      }

      // Some other unknown error occurred
      if (insertErr) return logger.error(`Error inserting empty master: ${insertErr}`);

      // If we successfully inserted the base empty bracket, then start the score
      // watcher with that bracket
      startWatcher(emptyBracket);
    }
  );
});

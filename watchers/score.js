'use strict';

const ScoreWatcher = require('@lukekarrys/score-watcher');
const _ = require('lodash');
const config = require('getconfig');
const bracketData = require('bracket-data');

const pgConnect = require('./lib/pgConnect');
const createLogger = require('./lib/logger');
const rpcClient = require('./lib/rpcClient');

const SPORT = process.env.TYB_SPORT;
const YEAR = process.env.TYB_YEAR;

if (!SPORT || !YEAR) {
  throw new Error(`TYB_SPORT and TYB_YEAR env variables are required`);
}

const logger = createLogger(`scores:${SPORT}-${YEAR}`);

const emptyBracket = bracketData({
  sport: SPORT,
  year: YEAR
}).constants.EMPTY;

const onSave = (master, cb) => pgConnect(logger, (client, done) => {
  client.query(
    `INSERT INTO masters
    (bracket, created, sport)
    VALUES ($1, $2, $3);`,
    [master, new Date().toJSON(), SPORT],
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
      scores: {interval: 1},
      sport: SPORT,
      year: YEAR
    }, config.tweetyourbracket)).start();

  client.query(
    `INSERT INTO masters
    (bracket, created, sport)
    VALUES ($1, $2, $3);`,
    [emptyBracket, new Date().toJSON(), SPORT],
    (insertErr) => {
      done();

      // The empty bracket already exists in the DB for this year, so we should
      // start the watcher with the latest bracket
      if (insertErr && insertErr.message.startsWith('duplicate key value violates unique constraint')) {
        return client.query(
          `SELECT bracket FROM masters
          WHERE sport = $1 AND extract(YEAR from created) = $2
          ORDER BY created desc
          LIMIT 1;`,
          [SPORT, YEAR],
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

'use strict';

const ScoreWatcher = require('@lukekarrys/score-watcher');
const _ = require('lodash');
const config = require('getconfig');
const bracketData = require('bracket-data');

const saveMaster = require('./lib/saveMaster');
const pgConnect = require('./lib/pgConnect');
const createLogger = require('./lib/logger');
const sportYear = require('./lib/sportYear');
const sport = sportYear.sport;
const year = sportYear.year;

const tybConfig = config.tweetyourbracket;
const scoreConfig = config.scores[sport];
const logger = createLogger(`scores:${sportYear.id}`);

const emptyBracket = bracketData({sport, year}).constants.EMPTY;

pgConnect(logger, (client, done) => {
  const startWatcher = (master) => {
    const watcher = new ScoreWatcher(_.extend({
      master,
      logger,
      onSave: saveMaster({logger, sport, year}),
      scores: scoreConfig,
      sport,
      year
    }, tybConfig));

    watcher.start();
  };

  client.query(
    `INSERT INTO masters
    (bracket, created, sport)
    VALUES ($1, $2, $3);`,
    [emptyBracket, new Date().toJSON(), sport],
    (insertErr) => {
      // The empty bracket already exists in the DB for this year, so we should
      // start the watcher with the latest bracket
      if (insertErr && insertErr.message.startsWith('duplicate key value violates unique constraint')) {
        client.query(
          `SELECT bracket FROM masters
          WHERE sport = $1 AND extract(YEAR from created) = $2
          ORDER BY created desc
          LIMIT 1;`,
          [sport, year],
          (err, res) => {
            done();
            if (err) {
              logger.error(`Error selecting latest master: ${err}`);
              return;
            }
            startWatcher(res.rows[0].bracket);
          }
        );
        return;
      }

      // Done with pg
      done();

      // Some other unknown error occurred
      if (insertErr) {
        logger.error(`Error inserting empty master: ${insertErr}`);
        return;
      }

      // If we successfully inserted the base empty bracket, then start the score
      // watcher with that bracket
      startWatcher(emptyBracket);
    }
  );
});

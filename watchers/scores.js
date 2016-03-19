'use strict';

const ScoreWatcher = require('@lukekarrys/score-watcher');
const _ = require('lodash');
const config = require('getconfig');
const bracketData = require('bracket-data');

const latestBracket = require('./lib/latestBracket');
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
  const startWatcher = (err, master) => {
    if (err) {
      logger.error(`Error starting score watcher: ${err}`);
      return;
    }

    new ScoreWatcher(_.extend({
      master,
      logger,
      onSave: saveMaster({logger, sport, year}),
      scores: scoreConfig,
      sport,
      year
    }, tybConfig)).start();
  };

  client.query(
    `INSERT INTO masters
    (bracket, created, sport)
    VALUES ($1, $2, $3);`,
    [emptyBracket, new Date().toJSON(), sport],
    (insertErr) => {
      // Done with pg
      done();

      // The empty bracket already exists in the DB for this year, so we should
      // start the watcher with the latest bracket
      if (insertErr && insertErr.message.startsWith('duplicate key value violates unique constraint')) {
        return latestBracket({logger, sport, year}, startWatcher);
      }

      // Some other unknown error occurred
      if (insertErr) {
        return logger.error(`Error inserting empty master: ${insertErr}`);
      }

      // If we successfully inserted the base empty bracket, then start the score
      // watcher with that bracket
      return startWatcher(null, emptyBracket);
    }
  );
});

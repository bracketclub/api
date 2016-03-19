'use strict';

const parse = require('scores/lib/parse');
const async = require('async');
const config = require('getconfig');
const Updater = require('bracket-updater');

const onSaveMaster = require('./saveMaster');
const createLogger = require('./logger');
const latestBracket = require('./latestBracket');

const sportYear = require('./sportYear');
const sport = sportYear.sport;
const year = sportYear.year;

const scoreConfig = config.scores[sport];
const logger = createLogger(`scores:${sportYear.id}`);
const saveMaster = onSaveMaster({logger, sport, year});
const updater = new Updater({sport, year});

const transformTeam = (team) => ({
  seed: team.rank,
  name: team.names
});

const normalizeTeamName = (name) => name.toLowerCase().replace(/[^\w\s-]/g, '');
const matchTeam = (teams, team) => teams.map(normalizeTeamName).indexOf(normalizeTeamName(team)) > -1;

const findGame = (events) => (team) => {
  const event = events.find((e) => matchTeam(e.home.names, team) || matchTeam(e.away.names, team));

  if (!event || !event.status.completed) return null;

  return {
    region: event.region,
    winner: transformTeam(event.home.winner ? event.home : event.away),
    loser: transformTeam(event.home.winner ? event.away : event.home)
  };
};

const updateGames = (current, date, order, cb) => parse(scoreConfig.url.replace('{date}', date), scoreConfig.parse, (err, events) => {
  if (err) {
    return cb(err);
  }

  const games = order.map(findGame(events));
  const missing = games.indexOf(null);

  if (missing > -1) {
    const orderMessage = normalizeTeamName(order[missing]);
    const eventsMessage = events.map((e) => {
      const h = e.home.names.map(normalizeTeamName).join('|');
      const a = e.away.names.map(normalizeTeamName).join('|');
      return `${e.status.completed}\n${h}\n${a}`;
    }).join('\n\n');
    return cb(new Error(`Could not find completed game for: ${orderMessage}\n\nPossible values:\n\n${eventsMessage}`));
  }

  let master = current;

  return async.map(games, (game, gameCb) => {
    master = updater.update({
      fromRegion: game.region,
      winner: game.winner,
      loser: game.loser,
      currentMaster: master
    });

    saveMaster(master, gameCb);
  }, cb);
});

const updateFromLatest = (date, gamesInOrder, cb) => latestBracket({logger, sport, year}, (err, bracket) => {
  if (err) return cb(err);
  return updateGames(bracket, date, gamesInOrder, cb);
});

module.exports = updateFromLatest;

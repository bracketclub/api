'use strict';

const _ = require('lodash');
const data = require('bracket-data');
const Updater = require('bracket-updater');

const createLogger = require('../lib/logger');
const sportYear = require('../lib/sportYear');
const createSaveMaster = require('../lib/saveMaster');

const sport = sportYear.sport;
const year = sportYear.year;

const logger = createLogger(`scores:${sportYear.id}`);
const saveMaster = createSaveMaster({logger, sport, year});

const INITIAL = 5000;
const INTERVAL = 5000;

const {
  BEST_OF_RANGE: bestOf,
  EMPTY: empty,
  UNPICKED_MATCH: unpickedChar
} = data({sport, year}).constants;

const updater = new Updater({sport, year});
// const roundLength = _.range(1, 7).reduce((a, i) => (a.push(a[i - 1] * 2), a), [1])

let previous = empty;
let interval = null;

setTimeout(() => (interval = setInterval(() => {
  const next = updater.next({currentMaster: previous}, {winner: true, order: false});

  previous = updater.update({
    currentMaster: previous,
    fromRegion: next[0].fromRegion,
    winner: {seed: next[0].seed, name: next[0].name},
    loser: {seed: next[1].seed, name: next[1].name},
    playedCompetitions: bestOf && _.sample(bestOf)
  });

  saveMaster(previous, _.noop);

  if (previous.indexOf(unpickedChar) === -1) {
    clearInterval(interval);
  }
}, INTERVAL)), INITIAL);

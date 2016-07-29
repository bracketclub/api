'use strict';

const _ = require('lodash');
const data = require('bracket-data');
const Updater = require('bracket-updater');
const Validator = require('bracket-validator');

const createLogger = require('../lib/logger');
const sportYear = require('../lib/sportYear');
const createSaveMaster = require('../lib/saveMaster');

const sport = sportYear.sport;
const year = sportYear.year;

const logger = createLogger(`scores:${sportYear.id}`);
const saveMaster = createSaveMaster({logger, sport, year});

const INITIAL = 5000;
const INTERVAL = 5000;
const empty = data({sport, year}).constants.EMPTY;
const finalId = data({sport, year}).constants.FINAL_ID;
const updater = new Updater({sport, year});
const validator = new Validator({sport, year});

let previous = empty;

setTimeout(() => setInterval(() => {
  const rounds = _.flatten(_.transform(validator.validate(previous), (res, val, key) => {
    res.push(val.rounds);
  }, []));

  let game = null;
  let fromRegion = null;

  for (let i = 0, m = rounds.length; i < m; i++) {
    const round = rounds[i];
    const unpicked = round.indexOf(null);
    if (unpicked > -1) {
      const previousRound = rounds[i - 1];
      game = _.shuffle([previousRound[unpicked * 2], previousRound[(unpicked * 2) + 1]]);
      fromRegion = previousRound[unpicked * 2].fromRegion;

      if (i >= 21) { // eslint-disable-line no-magic-numbers
        fromRegion = finalId;
      }

      break;
    }
  }

  if (game) {
    const master = updater.update({
      fromRegion,
      winner: game[0],
      loser: game[1],
      currentMaster: previous
    });
    previous = master;
    game = null;
    saveMaster(master, () => void 0);
  }
}, INTERVAL), INITIAL);

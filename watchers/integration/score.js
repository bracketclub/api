'use strict';

const _ = require('lodash');
const data = require('bracket-data');
const Updater = require('bracket-updater');
const Validator = require('bracket-validator');
const argv = require('yargs').string('year').argv;

const saveMaster = require('../score');

const options = {
  year: argv.year || process.env.TYB_YEAR,
  sport: argv.sport || process.env.TYB_SPORT
};

const INITIAL = 5000;
const INTERVAL = 5000;
const empty = data(options).constants.EMPTY;
const finalId = data(options).constants.FINAL_ID;
const updater = new Updater(options);
const validator = new Validator(options);

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

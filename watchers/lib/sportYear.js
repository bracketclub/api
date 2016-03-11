'use strict';

const argv = require('yargs').string('year').argv;

const SPORT = argv.sport || process.env.TYB_SPORT;
const YEAR = argv.year || process.env.TYB_YEAR;

if (!SPORT || !YEAR) {
  throw new Error('TYB_SPORT and TYB_YEAR env variables are required');
}

module.exports = {
  SPORT,
  YEAR,
  sport: SPORT,
  year: YEAR,
  id: `${SPORT}-${YEAR}`
};

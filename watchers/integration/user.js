'use strict';

const Generator = require('bracket-generator');
const argv = require('yargs').string('year').argv;

const saveEntry = require('../entry');

const INITIAL = 5000;
const INTERVAL = 5000;
const bracket = new Generator({
  year: argv.year || process.env.TYB_YEAR,
  sport: argv.sport || process.env.TYB_SPORT
});

const numbers = () => Math.random().toString().slice(2);

// User with multiple entries
setTimeout(() => setInterval(() => saveEntry({
  data_id: numbers(),
  user_id: '5',
  username: 'multi_entry',
  name: 'multi_entry',
  profile_pic: '',
  bracket: bracket.generate('random'),
  created: new Date().toJSON()
}), INTERVAL), INITIAL);

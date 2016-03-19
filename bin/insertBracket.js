#!/usr/bin/env node

/* eslint no-console:0 no-process-exit:0 */

'use strict';

const argv = require('yargs')
  .string('date')
  .array('teams')
  .argv;

const update = require('../watchers/lib/updateBracket');

update(argv.date, argv.teams, (err, brackets) => {
  if (err) throw err;
  console.log('Inserted', brackets);
  console.log('===============\nRestart the score worker!\n===============');
  process.exit(0);
});

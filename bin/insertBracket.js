#!/usr/bin/env node

'use strict';

const argv = require('yargs')
  .string('date')
  .array('teams')
  .argv;

const update = require('../watchers/lib/updateBracket');

update(argv.date, argv.teams, (err, brackets) => {
  if (err) throw err;
  // eslint-disable-next-line no-console
  console.log('Inserted', brackets);
  // eslint-disable-next-line no-process-exit
  process.exit(0);
});

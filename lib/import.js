/* eslint no-console:0, no-unused-vars:0 */

'use strict';

const pg = require('pg');
const async = require('async');
const config = require('getconfig');

const entries = require('./data/ncaa-mens-basketball/entries');
const masters = require('./data/ncaa-mens-basketball/masters');

// upserts users
const userQuery = (entry) =>
  `INSERT INTO users (user_id, username, name, profile_pic)
  VALUES ('${entry.user_id}', '${entry.username}', '${entry.name}', '${entry.profile_pic}')
  ON CONFLICT (user_id) DO UPDATE SET username = EXCLUDED.username, name = EXCLUDED.name, profile_pic = EXCLUDED.profile_pic;`;

// insert each entry
const entryQuery = (entry) =>
  `INSERT INTO entries (data_id, bracket, user_id, created)
  VALUES ('${entry.data_id}', '${entry.bracket}', '${entry.user_id}', '${entry.created}');`;

// insert each bracket
const MINUTES = 60;
const padLeft = (i) => i.toString().length === 1 ? `0${i}` : i;
const iToHHMM = (i) => `${i >= MINUTES ? `01:${padLeft(i % MINUTES)}` : `00:${padLeft(i)}`}`;
const bracketValues = (year, bracket, index) =>
  `('${year}-04-01T${iToHHMM(index)}:00.000Z', '${bracket}')`;

const masterQuery = (master) =>
  `INSERT INTO masters (created, bracket)
  VALUES ${master.brackets.map((b, i) => bracketValues(master.year, b, i)).join(', ')};`;

pg.connect(config.postgres.connection, (err, client, connectDone) => {
  if (err) {
    return console.error('error fetching client from pool', err);
  }

  async.eachSeries(masters, (entry, done) => {
    client.query(
      masterQuery(entry),
      (queryErr, result) => {
        connectDone();

        if (queryErr) {
          console.error('error running query', queryErr);
        }
        else {
          console.log(result);
        }

        done();
      }
    );
  });
});

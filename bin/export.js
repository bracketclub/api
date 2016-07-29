#!/usr/bin/env node

/* eslint no-console:0 no-process-exit:0 */

'use strict';

const path = require('path');
const fs = require('fs');
const async = require('async');
const _ = require('lodash');
const request = require('request');
const config = require('getconfig');
const mkdirp = require('mkdirp');

const pgConnect = require('../watchers/lib/pgConnect');
const createLogger = require('../watchers/lib/logger');

const logger = createLogger('export');

const getEvents = (cb) => pgConnect(logger, (client, done) => client.query(
  `SELECT
    (sport || '-' || extract(YEAR from created)) as id
  FROM
    masters
  GROUP BY
    extract(YEAR from created), sport;`,
  (err, res) => {
    done();

    if (err) {
      return cb(err);
    }

    if (!res || !res.rows.length) {
      return cb(new Error('Not found'));
    }

    return cb(null, _.map(res.rows, 'id'));
  }
));

const getUsers = (cb) => pgConnect(logger, (client, done) => client.query(
  `SELECT
    u.id
  FROM
    users as u`,
  (err, res) => {
    done();

    if (err) {
      return cb(err);
    }

    if (!res || !res.rows.length) {
      return cb(new Error('Not found'));
    }

    return cb(null, _.map(res.rows, 'id'));
  }
));

const getUrls = (cb) => async.parallel({
  users: getUsers,
  events: getEvents
}, (err, res) => {
  if (err) return cb(err);

  const events = res.events;
  const users = res.users;
  const urls = [];

  events.forEach((e) => {
    urls.push(
      `/masters/${e}`,
      `/entries/${e}`
    );
  });

  users.forEach((u) => {
    urls.push(`/users/${u}`);
    events.forEach((e) => {
      urls.push(`/users/${u}/${e}`);
    });
  });

  return cb(null, urls);
});

const saveJSONToFile = (url, cb) => {
  request(`http://${config.hapi.host}:${config.hapi.port}${url}`, (err, resp, body) => {
    if (err) {
      cb(err);
      return;
    }

    const dirname = path.dirname(url);
    const basename = path.basename(url);
    const dir = path.resolve(__dirname, `../.export${dirname}`);
    const file = path.join(dir, `${basename}.json`);

    mkdirp(dir, (mkdirpErr) => {
      if (mkdirpErr) {
        cb(err);
        return;
      }

      fs.writeFile(file, JSON.stringify(JSON.parse(body)), (writeErr) => {
        cb(writeErr, writeErr ? null : 'Done');
      });
    });
  });
};

setTimeout(() => getUrls((err, urls) => {
  if (err) throw err;

  const tasks = urls.map((url) => (cb) => saveJSONToFile(url, cb));

  async.parallel(tasks, (taskErr) => {
    if (taskErr) throw err;

    console.log('Exported');
    process.exit(0);
  });
}), 1500); // eslint-disable-line no-magic-numbers

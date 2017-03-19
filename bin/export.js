'use strict';

const path = require('path');
const fs = require('fs');
const req = require('request');
const mkdirp = require('mkdirp');
const yargs = require('yargs');
const pg = require('pg');
const config = require('getconfig');

const {
  url: URL,
  dir: DIR,
  dry: DRY,
  db: DB,
  concurrency: CON
} = yargs
  .string('url')
  .default('url', config.baseUrl)

  .string('dir')
  .default('dir', '../bracket.club/public/json')

  .string('db')
  .default('db', config.postgres)

  .boolean('dry')

  .default('concurrency', 1)

  .argv;

// eslint-disable-next-line no-console
const logger = console;

const request = (url) => new Promise((resolve, reject) => req(url, (err, resp, body) => {
  if (err) return reject(err);
  return resolve(JSON.parse(body));
}));

const query = (q) => new Promise((resolve, reject) => pg.connect(DB, (connErr, client, done) => {
  if (connErr) return reject(connErr);

  return client.query(q, (err, res) => {
    done();

    if (err) return reject(err);
    if (!res || !res.rows.length) return reject(new Error('Not found'));

    return resolve(res.rows.map((r) => r.id));
  });
}));

const dataToEvents = ({users, events}) => {
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

  return urls;
};

const saveUrl = (url) => request(`${URL}${url}`).then((data) => {
  const dirname = path.dirname(url);
  const basename = path.basename(url);
  const dir = path.resolve(process.cwd(), DIR, dirname.slice(1));
  const file = path.join(dir, `${basename}.json`);

  if (DRY) {
    logger.log(`Writing ${file}`);
    logger.log(JSON.stringify(data));
    return data;
  }

  mkdirp.sync(dir);
  fs.writeFileSync(file, JSON.stringify(data));
  return data;
});

const qUsers = `SELECT
  u.id
FROM
  users as u`;

const qEvents = `SELECT
  (sport || '-' || extract(YEAR from created)) as id
FROM
  masters
GROUP BY
  extract(YEAR from created), sport`;

Promise.all([qUsers, qEvents].map(query), CON)
  .then(([users, events]) => dataToEvents({users, events}))
  .then((urls) => Promise.all(urls.map(saveUrl), CON))
  .then(() => logger.log('Success!'))
  .catch((err) => logger.error('get urls error', err))
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  // eslint-disable-next-line no-process-exit
  .catch(() => process.exit(0));

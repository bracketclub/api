'use strict';

const pg = require('pg');
const config = require('getconfig');

const pgConnect = (logger, cb) => pg.connect(config.postgres.connectionString, (err, client, done) => {
  if (err) {
    logger.error(`DB connect error ${err}`);
    return;
  }
  cb(client, done);
});

module.exports = pgConnect;

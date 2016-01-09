'use strict';

const pg = require('pg');
const config = require('getconfig');

const pgConnect = (logger, cb) => pg.connect(config.postgres.connectionString, (err, client, done) => {
  if (err) {
    return logger.error(`DB connect error ${err}`);
  }
  cb(client, done);
});

module.exports = pgConnect;

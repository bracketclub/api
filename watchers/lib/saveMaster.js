'use strict';

const pgConnect = require('./pgConnect');

const onSave = (options) => {
  const logger = options.logger;
  const sport = options.sport;

  return (master, cb) => pgConnect(logger, (client, done) => {
    const now = new Date();
    const year = now.getFullYear();

    client.query(
      `INSERT INTO masters
      (bracket, created, sport)
      VALUES ($1, $2, $3);`,
      [master, now.toJSON(), sport],
      (err) => {
        client.query(`NOTIFY masters, '${sport}-${year}';`);

        done();

        if (err) {
          logger.error(`masters error: ${err}`);
          return cb(err);
        }

        logger.debug(`masters success: ${master}`);
        return cb(null, master);
      }
    );
  });
};

module.exports = onSave;

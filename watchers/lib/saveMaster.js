'use strict';

const pgConnect = require('./pgConnect');
const rpcClient = require('./rpcClient');

const onSave = (options) => {
  const logger = options.logger;
  const sport = options.sport;
  const year = options.year;

  return (master, cb) => pgConnect(logger, (client, done) => {
    client.query(
      `INSERT INTO masters
      (bracket, created, sport)
      VALUES ($1, $2, $3);`,
      [master, new Date().toJSON(), sport],
      (err) => {
        done();

        if (err) {
          logger.error(`Error inserting new bracket: ${err}`);
        }
        else {
          logger.debug(`Success inserting new bracket: ${master}`);
          rpcClient('masters', `${sport}-${year}`);
        }

        cb();
      }
    );
  });
};

module.exports = onSave;

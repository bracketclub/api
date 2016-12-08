'use strict';

const config = require('getconfig');

module.exports = {
  connectionString: config.postgres || process.env.POSTGRES_URL
};

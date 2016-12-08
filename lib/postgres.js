'use strict';

const config = require('getconfig');

module.exports = {
  connectionString: process.env.POSTGRES_URL || config.postgres
};

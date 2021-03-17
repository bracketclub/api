"use strict";

const { postgres } = require("getconfig");
const { Pool } = require("pg");

const SSL = "?sslmode=no-verify";
const PROD = process.env.NODE_ENV === "production";

const connectionString =
  PROD && !postgres.endsWith(SSL) ? postgres + SSL : postgres;

const pool = new Pool({ connectionString });

// https://node-postgres.com/guides/project-structure
module.exports = {
  connectionString,
  query: (request, text, params, callback) => {
    const url = request.url.pathname;
    const start = Date.now();
    const tags = ["db", "query", ...request.route.settings.tags];

    request.log(tags, {
      url,
      start,
    });

    return pool.query(text, params, (err, res) => {
      const duration = Date.now() - start;
      request.log(tags, {
        url,
        duration: `${duration}ms`,
        rows: res.rowCount,
      });
      callback(err, res);
    });
  },
};

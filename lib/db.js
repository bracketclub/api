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
    const start = Date.now();
    return pool.query(text, params, (err, res) => {
      const duration = Date.now() - start;
      request.log(["db", "query"], {
        url: request.url.pathname,
        duration: `${duration}ms`,
        rows: res.rowCount,
      });
      callback(err, res);
    });
  },
};

"use strict";

const packageInfo = require("../../package");
const db = require("../../lib/db");

const query = `SELECT
  (sport || '-' || extract(YEAR from created)) as id
FROM
  masters
GROUP BY
  extract(YEAR from created), sport
 LIMIT 1`;

exports.register = (server, options, done) => {
  server.route({
    method: "GET",
    path: "/hc",
    config: {
      description: "Healthcheck",
      tags: ["healthcheck"],
      handler: (request, reply) =>
        db.query(request, query, (err) =>
          reply(
            err,
            err ? null : { statusCode: 200, version: packageInfo.version }
          )
        ),
    },
  });

  return done();
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-healthcheck`,
  version: packageInfo.version,
};

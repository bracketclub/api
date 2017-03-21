'use strict';

const packageInfo = require('../../package');

const query = `SELECT
  (sport || '-' || extract(YEAR from created)) as id
FROM
  masters
GROUP BY
  extract(YEAR from created), sport
 LIMIT 1`;

exports.register = (server, options, done) => {
  server.route({
    method: 'GET',
    path: '/hc',
    config: {
      description: 'Healthcheck',
      tags: ['api', 'healthcheck', 'pg'],
      handler: (request, reply) => request.pg.client.query(
        query,
        (err, res) => reply(err, err ? null : {statusCode: 200})
      )
    }
  });

  return done();
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-healthcheck`,
  version: packageInfo.version
};

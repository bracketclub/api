'use strict';

const util = require('util');
const PassThrough = require('stream').PassThrough;
const PGPubsub = require('pg-pubsub');
const config = require('getconfig');

const packageInfo = require('../../package');

const LOG_TAG = 'sse';

exports.register = (server, options, done) => {
  // Listen for PG NOTIFY queries
  const sub = new PGPubsub(config.postgres.connectionString, {
    log: (...args) => server.log([LOG_TAG, 'pgpubsub'], util.format(...args))
  });

  const createSSERoute = (name) => {
    const stream = new PassThrough({objectMode: true});

    sub.addChannel(name, (id) => {
      server.log([LOG_TAG, name], id);
      stream.write({id});
    });

    server.route({
      method: 'GET',
      path: `/${name}/events`,
      config: {
        description: `Get ${name} events stream`,
        tags: [LOG_TAG, name],
        handler: (request, reply) => reply.event(stream, null, {event: name})
      }
    });
  };

  createSSERoute('users');
  createSSERoute('entries');
  createSSERoute('masters');

  return done();
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-sse`,
  version: packageInfo.version
};

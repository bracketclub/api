'use strict';

const util = require('util');
const PassThrough = require('stream').PassThrough;
const PGPubsub = require('pg-pubsub');
const config = require('getconfig');
const ms = require('ms');

const packageInfo = require('../../package');

const LOG_TAG = 'sse';

exports.register = (server, options, done) => {
  // Listen for PG NOTIFY queries
  const sub = new PGPubsub(config.postgres.connectionString, {
    log: (...args) => server.log([LOG_TAG, 'pgpubsub'], util.format(...args))
  });

  const createSSERoute = (name, write) => {
    const stream = new PassThrough({objectMode: true});

    sub.addChannel(name, (id) => {
      server.log([LOG_TAG, name], id);
      stream.write(write(id));
    });

    server.route({
      method: 'GET',
      path: `/${name}/events`,
      config: {
        description: `Get ${name} events stream`,
        tags: [LOG_TAG, name],
        handler: (request, reply) => reply.event(stream)
      }
    });

    // https://github.com/zeit/now-cli/issues/20
    // When deployed to now.sh it seems to close streams after 1 or 2 minutes
    // so this will keep those alive
    setInterval(() => stream.write(':heartbeat'), ms('30s'));
  };

  createSSERoute('users', (id) => ({id, event: 'users'}));
  createSSERoute('entries', (event) => ({event}));
  createSSERoute('masters', (event) => ({event}));

  return done();
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-sse`,
  version: packageInfo.version
};

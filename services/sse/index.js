'use strict';

const util = require('util');
const PassThrough = require('stream').PassThrough;
const PGPubsub = require('pg-pubsub');
const ms = require('ms');
const _ = require('lodash');
const packageInfo = require('../../package');
const postgres = require('../../lib/postgres-config');

const WRITE_WAIT = 250;
const LOG_TAG = 'sse';

exports.register = (server, options, done) => {
  // Listen for PG NOTIFY queries
  const sub = new PGPubsub(postgres, {
    log: (...args) => server.log([LOG_TAG, 'pgpubsub'], util.format(...args))
  });

  const createSSERoute = (route, write, {debounce = true} = {}) => {
    // Create a stream which will be the reply and be written to by pg pubsub
    const stream = new PassThrough({objectMode: true});

    // Log and write to the stream
    let writeToStream = (id, name) => {
      const data = write(id);
      server.log([LOG_TAG, name], data);
      stream.write(data);
    };

    if (debounce) writeToStream = _.debounce(writeToStream, WRITE_WAIT);

    // Add a pubsub channel for the namespace. This will listen for all NOTIFY
    // queries on that table
    sub.addChannel(route, (id) => writeToStream(id, route));

    server.route({
      method: 'GET',
      path: `/${route}/events`,
      config: {
        description: `Get ${route} events stream`,
        tags: [LOG_TAG, route],
        handler: (request, reply) => reply.event(stream)
      }
    });

    // https://github.com/zeit/now-cli/issues/20
    // When deployed to now.sh it seems to close streams after 1 or 2 minutes
    // so this will keep those alive
    setInterval(() => stream.write(':heartbeat'), ms('30s'));
  };

  // Don't debounce stream writes for users since individual users wont
  // ever update that frequently.
  createSSERoute('users', (id) => ({id, event: 'users'}), {debounce: false});
  createSSERoute('entries', (event) => ({event}));
  createSSERoute('masters', (event) => ({event}));

  return done();
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-sse`,
  version: packageInfo.version
};

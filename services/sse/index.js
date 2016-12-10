'use strict';

const util = require('util');
const PassThrough = require('stream').PassThrough;
const PGPubsub = require('pg-pubsub');
const config = require('getconfig');
const ms = require('ms');
const _ = require('lodash');
const packageInfo = require('../../package');

const WRITE_WAIT = 250;
const LOG_TAG = 'sse';

// Returns a debounced function. The whole thing is memoized so that the
// debounced function gets reused properly. The first argument is the function
// and the rest of the arguments get passed to it and used as the memoized resolver
const debounceBy = _.memoize(
  (...args) => _.debounce(_.partial(_.first(args), ..._.tail(args)), WRITE_WAIT),
  (...args) => _.initial(args).join(' ')
);

exports.register = (server, options, done) => {
  // Listen for PG NOTIFY queries
  const sub = new PGPubsub(config.postgres.connectionString, {
    log: (...args) => server.log([LOG_TAG, 'pgpubsub'], util.format(...args))
  });

  const createSSERoute = (route, write) => {
    // Create a stream which will be the reply and be written to by pg pubsub
    const stream = new PassThrough({objectMode: true});

    // Log and write to the stream
    const writeToStream = (id, name) => {
      const data = write(id);
      server.log([LOG_TAG, name], data);
      stream.write(data);
    };

    // Add a pubsub channel for the namespace. This will listen for all NOTIFY
    // queries on that table
    sub.addChannel(route, (id) => {
      // Don't debounce stream writes for users since individual users wont
      // ever update that frequently.
      if (route === 'users') {
        return writeToStream(id);
      }

      // Creates a debounced version of write to stream
      // This whole parent callback could just be debounced except that the same channel
      // will write events for different ids and we only want to debounce each
      // combination of channel name + id
      return debounceBy(writeToStream, id, route)();
    });

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

  createSSERoute('users', (id) => ({id, event: 'users'}));
  createSSERoute('entries', (event) => ({event}));
  createSSERoute('masters', (event) => ({event}));

  return done();
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-sse`,
  version: packageInfo.version
};

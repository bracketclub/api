'use strict';

const PassThrough = require('stream').PassThrough;
const PGPubsub = require('pg-pubsub');

const packageInfo = require('../../package');
const postgresOptions = require('../../lib/postgres');

exports.register = (plugin, options, done) => {
  plugin.bind({config: options.config});

  // Listen for PG NOTIFY queries
  const sub = new PGPubsub(postgresOptions.connectionString);

  const createSSERoute = (name) => {
    const stream = new PassThrough({objectMode: true});
    sub.addChannel(name, (id) => stream.write({id}));
    plugin.route({
      method: 'GET',
      path: `/${name}/events`,
      handler: (request, reply) => reply.event(stream, null, {event: name})
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

'use strict';

const Hapi = require('hapi');
const Hoek = require('hoek');
const config = require('getconfig');
const postgresOptions = require('./lib/postgres');

const server = new Hapi.Server(config.hapi.options);

const plugins = [
  {
    register: require('good'),
    options: {
      reporters: {
        console: [{
          module: 'good-console',
          args: [config.hapi.logEvents]
        }, 'stdout']
      }
    }
  },
  {
    register: require('susie')
  },
  {
    register: require('pgboom'),
    options: {
      getNull404: true
    }
  },
  {
    register: require('hapi-node-postgres'),
    options: postgresOptions
  },
  {
    register: require('./services/routes')
  },
  {
    register: require('./services/sse')
  }
];

server.connection({
  routes: {
    cors: config.hapi.cors
  },
  host: config.hapi.host,
  port: config.hapi.port
});

server.register(plugins, (err) => {
  Hoek.assert(!err, `Failed loading plugins: ${err}`);

  server.start((startErr) => {
    Hoek.assert(!startErr, `Failed starting service: ${startErr}`);
    server.log(['info', 'startup'], `Service is running at ${server.info.uri}`);
  });
});

server.on('stop', () => server.log(['info', 'shutdown'], 'Service has stopped'));

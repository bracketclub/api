'use strict';

require('dotenv').config();

const Hapi = require('hapi');
const Hoek = require('hoek');
const config = require('getconfig');
const postgres = require('./lib/postgres-config');

const server = new Hapi.Server(config.hapi.options);

const plugins = [
  {
    register: require('good'),
    options: {
      reporters: {
        console: [{
          module: 'good-squeeze',
          name: 'Squeeze',
          args: [config.hapi.logEvents]
        }, {
          module: 'good-console'
        }, 'stdout']
      }
    }
  },
  {
    register: require('./plugins/event')
  },
  {
    register: require('pgboom'),
    options: {
      getNull404: true
    }
  },
  {
    register: require('./plugins/postgres'),
    options: {config: postgres}
  },
  {
    register: require('./services/routes')
  },
  {
    register: require('./services/sse')
  },
  {
    register: require('./services/healthcheck')
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

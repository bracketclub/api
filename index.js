'use strict';

const Hapi = require('hapi');
const Hoek = require('hoek');
const config = require('getconfig');
const postgresOptions = require('./lib/postgres');

const argv = process.argv.slice(2);
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
    register: require('./services/api'),
    options: {
      config: config.api
    }
  }
];

server.connection({
  routes: {
    cors: config.hapi.cors,
    timeout: {socket: false}
  },
  host: config.hapi.host,
  port: config.hapi.port
});

if (argv.indexOf('--slow') > -1) {
  const slowDefault = 1000;
  const slow = parseInt(argv.join('').replace(/\D/g, ''), 10) || slowDefault;
  server.ext('onRequest', (req, reply) =>
    setTimeout(() => reply.continue(), Math.random() * slow));
}

server.register(plugins, (err) => {
  Hoek.assert(!err, `Failed loading plugins: ${err}`);

  server.start((startErr) => {
    Hoek.assert(!startErr, `Failed starting service: ${startErr}`);
    server.log(['info', 'startup'], `Service is running at ${server.info.uri}`);
  });
});

server.on('stop', () => server.log(['info', 'shutdown'], 'Service has stopped'));

exports.getServer = () => server;

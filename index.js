'use strict';

const Hapi = require('hapi');
const Hoek = require('hoek');
const config = require('getconfig');
const _ = require('lodash');

const argv = (arg) => process.argv.slice(2).indexOf(arg) > -1;
const startEntries = argv('--tweets');
const force = argv('--force');
const startScores = argv('--scores');

const server = new Hapi.Server(config.hapi.options);

const plugins = [
  {
    register: require('good'),
    options: {
      reporters: [
        {
          reporter: require('good-console'),
          events: config.hapi.logEvents
        }
      ]
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
    options: config.postgres
  },
  {
    register: require('./services/api'),
    options: {config: config.api}
  },
  {
    register: require('./services/entry-watcher'),
    options: _.extend(_.pick(config, 'twitter', 'tweetyourbracket', 'postgres'), {
      start: startEntries,
      force
    })
  },
  {
    register: require('./services/score-watcher'),
    options: _.extend(_.pick(config, 'tweetyourbracket', 'postgres'), {
      start: startScores
    })
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

exports.getServer = () => server;

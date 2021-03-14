'use strict';

require('dotenv').config();

const Hapi = require('hapi');
const Hoek = require('hoek');
const config = require('getconfig');
const postgres = require('./lib/postgres-config');
const packageInfo = require('./package');

const server = new Hapi.Server(config.hapi.options);

const goodReporters = {
  console: [
    {
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [config.hapi.logEvents]
    },
    {
      module: 'good-console'
    },
    'stdout'
  ]
};

if (config.loggly.token) {
  goodReporters.loggly = [
    {
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [config.hapi.logEvents]
    },
    {
      module: 'good-loggly',
      args: [
        {
          token: config.loggly.token,
          subdomain: config.loggly.subdomain,
          tags: config.loggly.tags,
          name: packageInfo.name,
          hostname: config.baseUrl,
          threshold: 20,
          maxDelay: 15000
        }
      ]
    }
  ];
}

const plugins = [
  {
    register: require('good'),
    options: {
      reporters: goodReporters
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
    cors: {
      origin: ['*'],
      additionalHeaders: ['Cache-Control']
    }
  },
  host: config.hapi.host,
  port: config.hapi.port
});

server.ext('onPreResponse', (request, reply) => {
  if (!request.headers.origin) {
    return reply.continue();
  }

  // depending on whether we have a boom or not,
  // headers need to be set differently.
  const response = request.response.isBoom ? request.response.output : request.response;

  response.headers['access-control-allow-origin'] = request.headers.origin;
  response.headers['access-control-allow-credentials'] = 'true';
  if (request.method !== 'options') {
    return reply.continue();
  }

  response.statusCode = 200;
  response.headers['access-control-expose-headers'] = 'content-type, content-length, etag';
  // eslint-disable-next-line no-magic-numbers
  response.headers['access-control-max-age'] = 60 * 10; // 10 minutes

  // dynamically set allowed headers & method
  if (request.headers['access-control-request-headers']) {
    response.headers['access-control-allow-headers'] = request.headers['access-control-request-headers'];
  }
  if (request.headers['access-control-request-method']) {
    response.headers['access-control-allow-methods'] = request.headers['access-control-request-method'];
  }

  return reply.continue();
});

server.register(plugins, (err) => {
  Hoek.assert(!err, `Failed loading plugins: ${err}`);

  server.start((startErr) => {
    Hoek.assert(!startErr, `Failed starting service: ${startErr}`);
    server.log(['info', 'startup'], `Service is running at ${server.info.uri}`);
  });
});

server.on('stop', () =>
  server.log(['info', 'shutdown'], 'Service has stopped')
);

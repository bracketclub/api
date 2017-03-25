'use strict';

const _ = require('lodash');
const Hoek = require('hoek');
let Pg = require('pg');

const packageInfo = require('../../package');

const DEFAULTS = {
  config: {connectionString: null},
  'native': false,
  attach: 'onPreHandler',
  detach: 'tail'
};

exports.register = (server, options, next) => {
  const config = Hoek.applyToDefaults(DEFAULTS, options);

  if (config.native) {
    Pg = require('pg').native;
  }

  server.ext(config.attach, (request, reply) => {
    const connect = _.get(request, 'route.settings.tags', []).includes('pg');

    if (connect) {
      Pg.connect(config.config, (err, client, done) => {
        if (err) {
          reply(err);
          return;
        }

        request.pg = {
          client,
          done,
          kill: false
        };

        reply.continue();
      });
    }
    else {
      reply.continue();
    }
  });

  server.on(config.detach, (request, err) => {
    if (request.pg) {
      const kill = !!Hoek.reach(request, 'pg.kill');
      const error = !!Hoek.reach(request, 'response._error');
      request.pg.done(kill || error);
    }
  });

  next();
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-postgres`,
  version: packageInfo.version
};

'use strict';

const packageInfo = require('../../package');

const users = require('./controllers/users');
const entries = require('./controllers/entries');
const masters = require('./controllers/masters');

exports.register = (plugin, options, done) => {
  plugin.bind({config: options.config});

  // Users
  plugin.route({method: 'GET', path: '/users/{id}', config: users.get});
  plugin.route({method: 'GET', path: '/users/{id}/{sport}-{year}', config: users.byEvent});

  // Entries
  plugin.route({method: 'GET', path: '/entries/{sport}-{year}', config: entries.all});
  plugin.route({method: 'GET', path: '/entries/{id}', config: entries.get});

  // Masters
  plugin.route({method: 'GET', path: '/masters/{sport}-{year}', config: masters.get});

  return done();
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-routes`,
  version: packageInfo.version
};

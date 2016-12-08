'use strict';

const PGPubsub = require('pg-pubsub');

const packageInfo = require('../../package');
const Channels = require('./lib/channels');
const postgresOptions = require('../../lib/postgres');

const users = require('./controllers/users');
const entries = require('./controllers/entries');
const masters = require('./controllers/masters');

exports.register = (plugin, options, done) => {
  plugin.bind({config: options.config});

  const sub = new PGPubsub(postgresOptions.connectionString);
  const entryChannel = new Channels();
  const masterChannel = new Channels();

  // Users
  plugin.route({method: 'GET', path: '/users/{id}', config: users.get});
  plugin.route({method: 'GET', path: '/users/{id}/{sport}-{year}', config: users.byEvent});

  // Entries
  plugin.route({method: 'GET', path: '/entries/{sport}-{year}', config: entries.all});
  plugin.route({method: 'GET', path: '/entries/{id}', config: entries.get});

  // Entries events
  plugin.route({method: 'GET', path: '/entries/events', config: entries.events(entryChannel)});
  sub.addChannel('entries', (event) => entryChannel.write({event: `entries-${event}`}));
  sub.addChannel('users', (id) => entryChannel.write({event: 'users', data: {id}}));

  // Masters
  plugin.route({method: 'GET', path: '/masters/{sport}-{year}', config: masters.get});

  // Masters events
  plugin.route({method: 'GET', path: '/masters/events', config: masters.events(masterChannel)});
  sub.addChannel('masters', (event) => masterChannel.write({event: `masters-${event}`}));

  return done();
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-api`,
  version: packageInfo.version
};

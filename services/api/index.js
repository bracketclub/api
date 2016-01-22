'use strict';

const rpc = require('json-rpc2');
const rpcServer = rpc.Server.$create();

const packageInfo = require('../../package');
const Channels = require('./lib/channels');

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

  const entryChannel = new Channels();
  plugin.route({method: 'GET', path: '/entries/events', config: entries.events(entryChannel)});
  rpcServer.expose('entries', (data, opt, cb) => {
    entryChannel.write({event: 'entries', data});
    cb(null);
  });

  // Masters
  plugin.route({method: 'GET', path: '/masters/{sport}-{year}', config: masters.get});

  const masterChannel = new Channels();
  plugin.route({method: 'GET', path: '/masters/events', config: masters.events(masterChannel)});
  rpcServer.expose('masters', (data, opt, cb) => {
    masterChannel.write({event: 'masters', data});
    cb(null);
  });

  rpcServer.listen(options.watchers.rpc_port, 'localhost');

  return done();
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-api`,
  version: packageInfo.version
};

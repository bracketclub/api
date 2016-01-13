'use strict';

const rpc = require('json-rpc2');
const rpcServer = rpc.Server.$create();

const packageInfo = require('../../package');
const Channels = require('./lib/channels');
const Controllers = require('./controllers');

exports.register = (plugin, options, done) => {
  plugin.bind({config: options.config});

  // Users
  plugin.route({method: 'GET', path: '/users', config: Controllers.users.all});
  plugin.route({method: 'GET', path: '/users/{id}', config: Controllers.users.get});

  // Entries
  plugin.route({method: 'GET', path: '/entries', config: Controllers.entries.all});
  plugin.route({method: 'GET', path: '/entries/{id}', config: Controllers.entries.get});

  const entryChannel = new Channels();
  plugin.route({method: 'GET', path: '/entries/events', config: Controllers.entries.events(entryChannel)});
  rpcServer.expose('entries', (data, opt, cb) => {
    entryChannel.write({event: 'entries', data});
    cb(null);
  });

  // Masters
  plugin.route({method: 'GET', path: '/masters', config: Controllers.masters.all});
  plugin.route({method: 'GET', path: '/masters/{id}', config: Controllers.masters.get});

  const masterChannel = new Channels();
  plugin.route({method: 'GET', path: '/masters/events', config: Controllers.masters.events(masterChannel)});
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

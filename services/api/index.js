'use strict';

const rpc = require('json-rpc2');
const rpcServer = rpc.Server.$create();

const Channels = require('./lib/channels');
const sseHandler = require('./lib/sseHandler');

const Controllers = require('./controllers');
const packageInfo = require('../../package');

exports.register = (plugin, options, done) => {
  plugin.bind({config: options.config});

  const entryChannel = new Channels();
  const masterChannel = new Channels();

  plugin.route({method: 'GET', path: '/users', config: Controllers.users.all});
  plugin.route({method: 'GET', path: '/users/{id}', config: Controllers.users.get});

  plugin.route({method: 'GET', path: '/entries', config: Controllers.entries.all});
  plugin.route({method: 'GET', path: '/entries/events', handler: sseHandler(entryChannel)});
  plugin.route({method: 'GET', path: '/entries/{id}', config: Controllers.entries.get});

  plugin.route({method: 'GET', path: '/masters', config: Controllers.masters.all});
  plugin.route({method: 'GET', path: '/masters/events', handler: sseHandler(masterChannel)});

  rpcServer.expose('entries', (data, opt, cb) => {
    entryChannel.write({event: 'entries', data});
    cb(null);
  });

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

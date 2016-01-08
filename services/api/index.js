'use strict';

const Controllers = require('./controllers');
const packageInfo = require('../../package');

exports.register = (plugin, options, done) => {
  plugin.bind({config: options.config});

  plugin.route({method: 'GET', path: '/users', config: Controllers.users.all});
  plugin.route({method: 'GET', path: '/users/{id}', config: Controllers.users.get});

  plugin.route({method: 'GET', path: '/entries', config: Controllers.entries.all});
  plugin.route({method: 'GET', path: '/entries/{id}', config: Controllers.entries.get});

  plugin.route({method: 'GET', path: '/masters', config: Controllers.masters.all});

  return done();
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-api`,
  version: packageInfo.version
};

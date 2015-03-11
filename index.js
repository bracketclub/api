var Hapi = require('hapi');
var _ = require('lodash');


var config = require('./config');
var startWatchers = process.argv.slice(2).indexOf('--watchers') > -1;
var server = new Hapi.Server();
server.connection({
    address: '0.0.0.0',
    port: process.env.PORT || 3001,
    routes: { cors: true }
});


server.register([
    {
        register: require('good'),
        options: {
            reporters: [{
                reporter: require('good-console'),
                args:[{request: '*', log: '*', response: '*', error: '*'}]
            }, {
                reporter: require('good-file'),
                args: ['./logs/server.log', {log: '*', error: '*'}]
            }]
        }
    }, {
        register: require('./plugins/db')
    }, {
        register: require('./plugins/entry-watcher'),
        options: _.extend(_.pick(config, 'twitter', 'domain', 'tags', 'year', 'sport'), {
            start: startWatchers
        })
    }, {
        register: require('./plugins/score-watcher'),
        options: _.extend(_.pick(config, 'sport', 'year'), {
            start: startWatchers
        })
    }
], function () {
    server.start(function () {
        server.log(['debug'], 'Server running at:' + server.info.uri);
    });
});
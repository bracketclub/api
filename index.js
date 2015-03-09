var Hapi = require('hapi');
var _ = require('lodash');
var path = require('path');


var config = require('./config');
var server = new Hapi.Server();
server.connection({
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
        register: require('./plugins/db'),
        options: {
            path: path.resolve(__dirname, 'db'),
            'import': process.argv.slice(2).indexOf('--import') > -1
        }
    }, {
        register: require('./plugins/entry-watcher'),
        options: _.pick(config, 'twitter', 'domain', 'tags', 'year', 'sport')
    }, {
        register: require('./plugins/score-watcher'),
        options: _.pick(config, 'sport', 'year')
    }
], function () {
    server.start(function () {
        server.log(['debug'], 'Server running at:' + server.info.uri);
    });
});
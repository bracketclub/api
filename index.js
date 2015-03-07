var Hapi = require('hapi');
var _ = require('lodash');
var config = require('./config');


var server = new Hapi.Server();
server.connection({port: process.env.PORT || 3001});


server.register([
    {
        register: require('good'),
        options: {
            reporters: [{
                reporter: require('good-console'),
                args:[{log: '*', response: '*', error: '*'}]
            }, {
                reporter: require('good-file'),
                args: ['./logs/server.log', {log: '*', error: '*'}]
            }]
        }
    }, {
        register: require('./plugins/db'),
        options: {
            'import': process.argv.slice(2).indexOf('--import')
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
        console.log('Server running at:', server.info.uri);
    });
});
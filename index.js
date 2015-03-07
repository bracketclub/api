var ScoreWatcher = require('score-watcher');
var _ = require('lodash');
var EntryWatcher = require('entry-watcher');
var Hapi = require('hapi');
var path = require('path');


var config = require('./config');
var db = require('./dulcimer');
var Entry = db.Entry;
var upsertEntry = db.upsertEntry;
var Master = db.Master;
var appendMaster = db.appendMaster;


var server = new Hapi.Server();
server.connection({port: process.env.PORT || 3001});


server.route({
    method: 'GET',
    path: '/masters',
    handler: function (request, reply) {
        Master.all(function (err, masters) {
            if (err) {
                reply({error: err.toString(), response: []}).code(500);
            }
            else {
                reply({error: null, response: _.invoke(masters, 'toJSON')}).code(200);
            }
        });
    }
});

server.route({
    method: 'GET',
    path: '/masters/{index}',
    handler: function (request, reply) {
        Entry.findByIndex('user_id', request.params.userId, function (err, user) {
            if (err) {
                reply({error: err.toString(), response: {}}).code(500);
            }
            else if (!user) {
                reply({error: 'User not found', response: {}}).code(404);
            }
            else {
                reply({error: null, response: user.toJSON()}).code(200);
            }
        });
    }
});

server.route({
    method: 'GET',
    path: '/users',
    handler: function (request, reply) {
        var year = request.query.year;
        Entry.all(function (err, users) {
            if (err) {
                reply({error: err.toString(), response: []}).code(500);
            }
            else {
                reply({error: null, response: _.invoke(users, 'toJSON')}).code(200);
            }
        });
    }
});

server.route({
    method: 'GET',
    path: '/users/{userId}',
    handler: function (request, reply) {
        var year = request.query.year;
        Entry.findByIndex('user_id', request.params.userId, {
            filter: function (model) {
                return year ? model.year === year : true;
            }
        }, function (err, user) {
            if (err) {
                reply({error: err.toString(), response: {}}).code(500);
            }
            else if (!user) {
                reply({error: 'User not found', response: {}}).code(404);
            }
            else {
                reply({error: null, response: user.toJSON()}).code(200);
            }
        });
    }
});


server.register([
    {
        register: require('./plugins/entry-watcher'),
        options: _.extend({
            logfile: path.resolve(__dirname, 'logs', 'entries.log'),
            type: 'tweet',
            onSave: _.partial(upsertEntry, server)
        }, config)
    },
    {
        register: require('./plugins/score-watcher'),
        options: _.extend({
            logfile: path.resolve(__dirname, 'logs', 'scores.log'),
            master: '',
            onSave: _.partial(appendMaster, server),
            scores: {
                interval: 1
            }
        }, _.pick(config, 'sport', 'year'))
    }
], function (err) {
    if (err) throw err;
    console.log('Server running at:', server.info.uri);
});
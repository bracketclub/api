var ScoreWatcher = require('score-watcher');
var path = require('path');
var _ = require('lodash');
var Stream = require('stream');


exports.register = function (server, config, next) {
    var options = _.extend({
        logfile: path.resolve(__dirname, '..', 'logs', 'scores.log'),
        scores: {
            interval: 1
        }
    }, config);

    var year = config.year;
    var Master = server.plugins.db.Master;
    var channel = new Stream.PassThrough();

    var updateBracket = function (master, found, cb) {
        var data = found.toJSON();
        var last = _.last(data.brackets);
        if (last === master) {
            server.log(['debug'], 'Skipping master since it matches latest: ' + master);
            cb(null, last);
        } else {
            data.brackets.push(master);
            Master.update(found.key, data, function (err, model) {
                if (err) {
                    server.log(['error'], 'Error updating master: ' + err);
                } else {
                    server.log(['debug'], 'Updated master: ' + model.toJSON().brackets.length + ' to ' + master);
                }
                cb(err, master);
            });
        }
    };

    var createMaster = function (master, cb) {
        var model = Master.create({year: year, brackets: master ? [master] : []});
        model.save(function (err) {
            if (err) {
                server.log(['error'], 'Error creating master: ' + err);
            } else {
                server.log(['debug'], 'Created master: ' + model.toString());
            }
            cb(err, master);
        });
    };

    var updateOrCreate = function (master, found, cb) {
        if (found) {
            updateBracket(master, found, cb);
        } else {
            createMaster(master, cb);
        }
    };

    options.onSave = function (master, cb) {
        Master.findByIndex('year', year, function (err, found) {
            if (err) {
                server.log(['error'], 'Error finding master by index: ' + err);
                cb(err);
            } else {
                updateOrCreate(master, found, function (err, master) {
                    if (!err && master) {
                        channel.write("event: masters\n");
                        channel.write("data: " + master +  "\n\n");
                    }
                    cb(err);
                });
            }
        });
    };

    server.route({
        method: "GET",
        path: "/masters/events",
        handler: function (request, reply) {
            reply(channel).code(200)
            .type("text/event-stream")
            .header("Connection", "keep-alive")
            .header("Cache-Control", "no-cache")
            .header("Content-Encoding", "identity");
        }
    });

    var startWatcher = function (err, master) {
        options.master = master;
        new ScoreWatcher(options).start();
        next(err);
    };

    // To start the score watcher we need to make sure the db contains
    // a master model for this year and that it starts with an empty bracket
    Master.findByIndex('year', year, function (err, model) {
        if (err) {
            server.log(['error'], 'Error finding master by index: ' + err);
            next(err);
        } else if (!model) {
            createMaster(null, startWatcher);
        } else {
            startWatcher(null, _.last(model.brackets));
        }
    });
};

exports.register.attributes = {
    name: 'score-watcher',
    version: '1.0.0'
};

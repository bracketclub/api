var ScoreWatcher = require('score-watcher');
var path = require('path');
var _ = require('lodash');
var BracketData = require('bracket-data');



exports.register = function (server, config, next) {
    var options = _.extend({
        logfile: path.resolve(__dirname, '..', 'logs', 'scores.log'),
        scores: {
            interval: 1
        }
    }, config);

    var sport = config.sport;
    var year = config.year;
    var empty = new BracketData({props: ['constants'], sport: sport, year: year}).constants.EMPTY;
    var Master = server.plugins.db.Master;

    var updateBracket = function (master, found, cb) {
        var data = found.toJSON();
        data.brackets || (data.brackets = []);
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
        var model = Master.create({year: year, brackets: [master]});
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
                        server.log(['debug'], 'SSE:' + master);
                    }
                    cb(err);
                });
            }
        });
    };

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
            createMaster(empty, startWatcher);
        } else if (!model.brackets || model.brackets.length === 0) {
            updateBracket(empty, model, startWatcher);
        } else {
            startWatcher(null, _.last(model.brackets));
        }
    });
};

exports.register.attributes = {
    name: 'score-watcher',
    version: '1.0.0'
};

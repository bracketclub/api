var ScoreWatcher = require('score-watcher');
var path = require('path');
var _ = require('lodash');


exports.register = function (server, config, next) {
    var options = _.extend({
        logfile: path.resolve(__dirname, '..', 'logs', 'scores.log'),
        scores: {
            interval: 1
        }
    }, config);

    var year = config.year;
    var Master = server.plugins.db.Master;
    options.onSave = function (master, cb) {
        Master.findByIndex('year', year, function (err, found) {
            if (err) {
                server.log(['error'], 'Error finding master by index: ' + err);
                cb();
            } else {
                if (found) {
                    var data = found.toJSON();
                    var last = _.last(data.brackets);
                    if (last === master) {
                        server.log(['log'], 'Skipping master since it matches latest: ' + master);
                        cb();
                    } else {
                        data.brackets.push(master);
                        Master.update(found.key, data, function (err, model) {
                            if (err) {
                                server.log(['error'], 'Error updating master: ' + err);
                            } else {
                                server.log(['log'], 'Updated master: ' + model.toJSON().brackets.length + ' to ' + master);
                            }
                            cb();
                        });
                    }
                }
                else {
                    var model = Master.create({year: year, brackets: [master]});
                    model.save(function (err) {
                        if (err) {
                            server.log(['error'], 'Error creating master: ' + err);
                        } else {
                            server.log(['log'], 'Created master: ' + model.toJSON());
                        }
                        cb();
                    });
                }
            }
        });
    };

    Master.findByIndex('year', year, function (err, model) {
        var last = _.last(model.brackets);
        if (last) {
            options.master = last;
            new ScoreWatcher(options).start();
            next(err);
        }
    });
};

exports.register.attributes = {
    name: 'score-watcher',
    version: '1.0.0'
};

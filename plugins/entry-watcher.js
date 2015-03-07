var EntryWatcher = require('entry-watcher');
var path = require('path');
var _ = require('lodash');
var Stream = require('stream');


exports.register = function (server, config, next) {
    var options = _.extend({
        logfile: path.resolve(__dirname, '..', 'logs', 'entries.log'),
        type: 'tweet',
        auth: config.twitter,
    }, config);

    var year = config.year;
    var Entry = server.plugins.db.Entry;
    var channel = new Stream.PassThrough();

    var filterByYear = {
        filter: function (model) {
            return year ? model.year === year : true;
        }
    };

    var createEntry = function (data, cb) {
        var created = Entry.create(data);
        created.save(function (err) {
            if (err) {
                 server.log(['error'], 'Error creating entry:' + err);
                 cb(err);
            } else {
                server.log(['debug'], 'Created entry: ' + created.toString());
                cb(null, created);
            }
        });
    };

    var updateEntry = function (data, model, cb) {
        Entry.update(model.key, data, function (err, updated) {
            if (err) {
                server.log(['error'], 'Error updating entry:' + err);
                cb(err);
            } else {
                server.log(['debug'], 'Updated entry: ' + updated.toString());
                cb(null, updated);
            }
        });
    };

    var updateOrCreate = function (data, model, cb) {
        if (model) {
            updateEntry(data, model, cb);
        } else {
            createEntry(data, cb);
        }
    };

    options.onSave = function (data) {
        Entry.getByIndex('user_id', data.user_id, _.extend({limit: 1}, filterByYear), function (err, found) {
            if (err) {
                server.log(['error'], 'Error finding entry by index:' + err);
            } else {
                updateOrCreate(data, found[0], function (err, entry) {
                    if (!err && entry) {
                        channel.write("event: entries\n");
                        channel.write("data: " + entry.toString() +  "\n\n");
                    }
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

    new EntryWatcher(options).start();
    next();
};

exports.register.attributes = {
    name: 'entry-watcher',
    version: '1.0.0'
};

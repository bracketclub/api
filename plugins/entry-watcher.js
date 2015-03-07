var EntryWatcher = require('entry-watcher');
var path = require('path');
var _ = require('lodash');


exports.register = function (server, config, next) {
    var options = _.extend({
        logfile: path.resolve(__dirname, '..', 'logs', 'entries.log'),
        type: 'tweet',
        auth: config.twitter,
    }, config);

    var year = config.year;
    var Entry = server.plugins.db.Entry;

    var filterByYear = {
        filter: function (model) {
            return year ? model.year === year : true;
        }
    };

    var createEntry = function (data) {
        var created = Entry.create(data);
        created.save(function (err) {
            if (err) {
                 server.log(['error'], 'Error creating entry:' + err);
            } else {
                server.log(['log'], 'Created entry: ' + created.toJSON());
            }
        });
    };

    var updateEntry = function (data, model) {
        Entry.update(model.key, data, function (err, updated) {
            if (err) {
                server.log(['error'], 'Error updating entry:' + err);
            } else {
                server.log(['log'], 'Updated entry: ' + updated.toJSON());
            }
        });
    };

    var updateOrCreate = function (data, model) {
        if (model) {
            updateEntry(data, model);
        } else {
            createEntry(data);
        }
    };

    options.onSave = function (data) {
        Entry.findByIndex('user_id', data.user_id, filterByYear, function (err, found) {
            if (err) {
                server.log(['error'], 'Error finding entry by index:' + err);
            } else {
                updateOrCreate(data, found);
            }
        });
    };

    new EntryWatcher(options).start();
    next();
};

exports.register.attributes = {
    name: 'entry-watcher',
    version: '1.0.0'
};

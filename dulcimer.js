var dulcimer = require('dulcimer');
var moment = require('moment');
dulcimer.connect('./db');

// ------------------------
// Entries
// ------------------------
var Entry = module.exports.Entry = new dulcimer.Model({
    created: {type: 'string', required: true},
    user_id: {type: 'string', required: true, index: true},
    data_id: {type: 'string', required: true},
    username: {type: 'string', required: true},
    name: {type: 'string', required: true},
    profile_pic: {type: 'string', required: true},
    bracket: {type: 'string', required: true},
    year: {
        index: true,
        derived: function () {
            return moment(this.created, 'ddd MMM DD HH:mm:ss ZZ YYYY').format('YYYY');
        }
    }
}, {name: 'entry'});

module.exports.upsertEntry = function upsertEntry(server, entry) {
    Entry.findByIndex('user_id', entry.user_id, function (err, foundEntry) {
        if (err) {
            server.log(['error', 'entry'], err);
        } else {
            if (foundEntry) {
                Entry.update(foundEntry.key, foundEntry.toJSON(),  function (err, updatedEntry) {
                    if (err) {
                        server.log(['error', 'entry', 'updated'], err);
                    }
                    else {
                        server.log(['entry', 'updated'], updatedEntry.toJSON());
                    }
                });
            } else {
                var created = Entry.create(entry);
                created.save(function (err) {
                    if (err) {
                        server.log(['error', 'entry', 'created'], err);
                    }
                    else {
                        server.log(['entry', 'created'], created.toJSON());
                    }
                });
            }
        }
    });
};



// ------------------------
// Masters
// ------------------------
var Master = module.exports.Master = new dulcimer.Model({
    year: {type: 'string', required: true, index: true},
    brackets: {type: 'array', required: true}
}, {name: 'master'});

module.exports.upsertEntry = function upsertEntry(server, master, index) {
    Master.runWithLock(function (unlock) {
        Master.get(key, function (err, model) {
            model.count += amount;
            //note the withoutLock
            model.save({withoutLock: true}, function (err) {
                unlock(); //if you don't do this, this function will only be able to run once.. ever!
                cb(err, model.count);
            });
        });
    });


    Master.findByIndex('index', entry.user_id, function (err, foundEntry) {
        if (err) {
            server.log(['error', 'entry'], err);
        } else {
            if (foundEntry) {
                Entry.update(foundEntry.key, foundEntry.toJSON(),  function (err, updatedEntry) {
                    if (err) {
                        server.log(['error', 'entry', 'updated'], err);
                    }
                    else {
                        server.log(['entry', 'updated'], updatedEntry.toJSON());
                    }
                });
            } else {
                var created = Entry.create(entry);
                created.save(function (err) {
                    if (err) {
                        server.log(['error', 'entry', 'created'], err);
                    }
                    else {
                        server.log(['entry', 'created'], created.toJSON());
                    }
                });
            }
        }
    });
};


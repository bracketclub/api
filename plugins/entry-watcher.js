var EntryWatcher = require('entry-watcher');


exports.register = function (server, options, next) {
    var watcher = new EntryWatcher(options).start();
    server.expose('watcher', watcher);
    next();
};

exports.register.attributes = {
    name: 'entry-watcher',
    version: '1.0.0'
};

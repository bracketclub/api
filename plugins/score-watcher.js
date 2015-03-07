var ScoreWatcher = require('score-watcher');


exports.register = function (server, options, next) {
    var watcher = new ScoreWatcher(options).start();
    server.expose('watcher', watcher);
    next();
};

exports.register.attributes = {
    name: 'score-watcher',
    version: '1.0.0'
};

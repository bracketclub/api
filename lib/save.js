var path = require('path');
var exec = require('child_process').exec;
var async = require('async');
var jsonUpdate = require('json-update');
var _ = require('lodash');
var rootPath = path.resolve(__dirname, '..');
var comRootPath = path.resolve(__dirname, '..', '..', 'tweetyourbracket.com');
var logger = require('bucker').createLogger({
    console: {
        color: true
    },
    app: {
        filename: path.resolve(__dirname, '../logs', 'app.log'),
        format: ':level :time :data',
        timestamp: 'HH:mm:ss',
        accessFormat: ':time :level :method :status :url'
    }
});

var runCommandFn = function (cmd, _cwd, cb) {
    var cwd = _cwd || rootPath;
    logger.log(path.basename(cwd), '-', cmd);
    exec(cmd, {cwd: cwd, env: process.environment}, cb);
};
var loadJson = function (options, cb) {
    var jsonPath = path.resolve(__dirname, '..', 'data', options.sport, options.year + '.json');
    jsonUpdate.load(jsonPath, function (err, obj) {
        if (err || !obj) obj = {};
        cb(jsonPath, obj);
    });
};

var push = _.debounce(function () {
    async.waterfall([
        // Push data to git
        function (cb) {
            runCommandFn('git add data/*', null, cb);
        },
        function (stdout, stderr, cb) {
            runCommandFn('git commit -n -m "Updating data"', null, cb);
        },
        function (stdout, stderr, cb) {
            runCommandFn('git pull origin master', null, cb);
        },
        function (stdout, stderr, cb) {
            runCommandFn('git push origin master', null, cb);
        },

        // Check out dotcom site, build, update and push to prod
        function (stdout, stderr, cb) {
            runCommandFn('git checkout master', comRootPath, cb);
        },
        function (stdout, stderr, cb) {
            runCommandFn('git pull origin master', comRootPath, cb);
        },
        function (stdout, stderr, cb) {
            runCommandFn('npm run update-data', comRootPath, cb);
        },
        function (stdout, stderr, cb) {
            runCommandFn('npm run build', comRootPath, cb);
        },
        function (stdout, stderr, cb) {
            runCommandFn('npm run production', comRootPath, cb);
        }
    ], function (err) {
        if (err) {
            logger.error(err.message);
        } else {
            logger.debug('Completed without errors');
        }
    });
}, 1000 * 60 * 1, {
    leading: false,
    trailing: true,
    maxWait: 1000 * 60 * 5
});


module.exports.entryJSON = function (options, entry, cb) {
    loadJson(options, function (jsonPath, obj) {
        if (!obj.entries) obj.entries = [];
        var existing = false;
        _.each(obj.entries, function (e, index, list) {
            if (e.user_id === entry.user_id) {
                list[index] = entry;
                existing = true;
            }
        });
        if (!existing) obj.entries.push(entry);
        logger.debug('ENTRY', entry.username);
        jsonUpdate.update(jsonPath, obj, function () {
            push();
            cb && cb.apply(this, arguments);
        });
    });
};

module.exports.masterJSON = function (options, master, cb) {
    loadJson(options, function (jsonPath, obj) {
        if (!obj.masters) obj.masters = [];
        var latest = _.last(obj.masters);
        if (latest !== master) obj.masters.push(master);
        logger.debug('MASTER', master);
        jsonUpdate.update(jsonPath, obj, function () {
            push();
            cb && cb.apply(this, arguments);
        });
    });
};



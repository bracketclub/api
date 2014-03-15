var path = require('path');
var exec = require('child_process').exec;
var async = require('async');
var jsonUpdate = require('json-update');
var _ = require('lodash');
var rootPath = path.resolve(__dirname, '..');
var comRootPath = path.resolve(__dirname, '..', '..', 'tweetyourbracket.com');
var runCommandFn = function (cmd, _cwd, cb) {
    var cwd = _cwd || rootPath;
    console.log('COMMAND', cmd);
    console.log('DIR', cwd);
    exec(cmd, {cwd: cwd}, cb);
};
var loadJson = function (options, cb) {
    var jsonPath = path.resolve(__dirname, '..', 'data', options.sport, options.year + '.json');
    jsonUpdate.load(jsonPath, function (err, obj) {
        if (err || !obj) obj = {};
        cb(jsonPath, obj);
    });
};

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
        jsonUpdate.update(jsonPath, obj, cb || function () {});
    });
};

module.exports.masterJSON = function (options, master, cb) {
    loadJson(options, function (jsonPath, obj) {
        if (!obj.masters) obj.masters = [];
        var latest = _.last(obj.masters);
        if (latest !== master) obj.masters.push(master);
        jsonUpdate.update(jsonPath, obj, cb || function () {});
    });
};

module.exports.push = function () {
    async.waterfall([
        function (cb) {
            runCommandFn('git pull origin master', null, cb);
        },
        function (err, stdout, stderr, cb) {
            runCommandFn('git add data/*', null, cb);
        },
        function (err, stdout, stderr, cb) {
            runCommandFn('git commit -n -m "Updating data"', null, cb);
        },
        function (err, stdout, stderr, cb) {
            if (stdout.indexOf('nothing to commit, working directory clean') > -1) {
                cb(new Error('nothing to commit'));
            } else {
                runCommandFn('git push origin master', null, cb);
            }
        },
        function (err, stdout, stderr, cb) {
            runCommandFn('git co production', comRootPath, cb);
        },
        function (err, stdout, stderr, cb) {
            runCommandFn('git pull origin production', comRootPath, cb);
        },
        function (err, stdout, stderr, cb) {
            runCommandFn('npm version patch', comRootPath, cb);
        },
        function (err, stdout, stderr, cb) {
            runCommandFn('git push origin production', comRootPath, cb);
        }
    ], function (err) {
        console.log(err || 'Completed without errors');
    });
};

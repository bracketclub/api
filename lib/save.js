var path = require('path');
var exec = require('child_process').exec;
var async = require('async');
var jsonUpdate = require('json-update');
var _ = require('lodash');
var rootPath = path.resolve(__dirname, '..');
var runCommandFn = function (cmd) {
    return function (cb) {
        console.log(cmd);
        exec(cmd, {cwd: rootPath}, cb);
    };
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
    async.series([
        runCommandFn('git pull origin master'),
        runCommandFn('git add data/*'),
        runCommandFn('git commit -m "Updating data"'),
        runCommandFn('git push origin master')
    ], function (err) {
        console.log(err || 'Completed without errors');
    });
};

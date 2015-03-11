var async = require('async');
var models = require('../models');
var path = require('path');

var outDir = path.resolve(__dirname, '..', 'data', 'ncaa-mens-basketball');

async.parallel([
    function (cb) {
        var data = require(outDir + '/entry.json');
        models.Entry.importData(data, function (err) {
            console.log('Entries imported');
            cb(err);
        });
    },
    function (cb) {
        var data = require(outDir + '/master.json');
        models.Master.importData(data, function (err) {
            console.log('Masters imported');
            cb(err);
        });
    }
], function (err) {
    console.log(err || 'Done');
});

var async = require('async');
var models = require('../models');

async.parallel([
    function (cb) {
        var data = require('../data/ncaa-mens-basketball/entry.json');
        models.Entry.importData(data, function (err) {
            console.log('Entries imported');
            cb(err);
        });
    },
    function (cb) {
        var data = require('../data/ncaa-mens-basketball/masters.json');
        models.Master.importData(data, function (err) {
            console.log('Masters imported');
            cb(err);
        });
    }
], function (err) {
    console.log(err || 'Done');
});

var _ = require('lodash');
var async = require('async');
var path = require('path');
var fs = require('fs');
var stream = require('stream');

var dataDir = path.resolve(__dirname, '..', 'data', 'ncaa-mens-basketball');
var staticDir = path.resolve(__dirname, '..', 'data-static', 'ncaa-mens-basketball');
var models = require('../models');


function EchoStream () {
    stream.Writable.call(this);
}

require('util').inherits(EchoStream, stream.Writable);

EchoStream.prototype._write = function (chunk, encoding, done) {
    this.__data || (this.__data = '');
    this.__data += chunk.toString();
    done();
};


async.parallel([
    function (cb) {
        var s = new EchoStream();
        s.on('finish', function () {
            var entries = _.chain(JSON.parse(this.__data))
            .sortBy('ms')
            .map(function (entry) {
                return _.omit(entry, 'bucket');
            })
            .value();
            async.parallel([
                function (_cb) {
                    fs.writeFile(dataDir + '/entries.json', JSON.stringify(entries), _cb);
                },
                function (_cb) {
                    fs.writeFile(staticDir + '/entries.js', 'var __entries=' + JSON.stringify(entries) + ';', _cb);
                }
            ], cb);
        });
        s.on('error', cb);
        models.Entry.exportJSON(s);
    },
    function (cb) {
        var s = new EchoStream();
        s.on('finish', function () {
            var masters =  _.chain(JSON.parse(this.__data))
            .sortBy('year')
            .map(function (entry) {
                return _.omit(entry, 'bucket');
            })
            .value();
            async.parallel([
                function (_cb) {
                    fs.writeFile(dataDir + '/masters.json', JSON.stringify(masters), _cb);
                },
                function (_cb) {
                    fs.writeFile(staticDir + '/masters.js', 'var __masters=' + JSON.stringify(masters) + ';', _cb);
                }
            ], cb);
        });
        s.on('error', cb);
        models.Master.exportJSON(s);
    }
], function (err) {
    console.log(err ? err : 'Done without errors');
});

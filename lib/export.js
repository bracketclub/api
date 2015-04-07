var _ = require('lodash');
var async = require('async');
var path = require('path');
var fs = require('fs');
var stream = require('stream');

var outDir = path.resolve(__dirname, '..', 'data', 'ncaa-mens-basketball');
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
            fs.writeFile(outDir + '/entry.json', JSON.stringify(entries), cb);
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
            fs.writeFile(outDir + '/master.json', JSON.stringify(masters), cb);
        });
        s.on('error', cb);
        models.Master.exportJSON(s);
    }
], function (err, results) {
    console.log(err, results);
});

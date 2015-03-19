var Stream = require('stream');
var _ = require('lodash');


function Channels () {
    this.channels = {};
}

Channels.prototype.add = function () {
    var id = _.uniqueId('ch_');
    this.channels[id] = new Stream.PassThrough();
    return {channel: this.channels[id], id: id};
};

Channels.prototype.remove = function (id) {
    this.channels[id].end();
    delete this.channels[id];
};

Channels.prototype.write = function (data) {
    _.each(this.channels, function (ch) {
        ch.write('event: ' + data.event + '\n');
        ch.write('data: ' + JSON.stringify(data.data) + '\n\n');
    });
};

module.exports = Channels;

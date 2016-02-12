'use strict';

const Stream = require('stream');
const _ = require('lodash');

const Channels = function Channels() {
  this.channels = {};
};

Channels.prototype.add = function _add() {
  const id = _.uniqueId('ch_');
  this.channels[id] = new Stream.PassThrough();
  return {channel: this.channels[id], id};
};

Channels.prototype.remove = function _remove(id) {
  this.channels[id].end();
  delete this.channels[id];
};

Channels.prototype.write = function _write(data) {
  _.each(this.channels, (ch) => {
    ch.write(`event: ${data.event}\n`);
    ch.write(`data: ${JSON.stringify(data.data || {})}\n\n`);
  });
};

module.exports = Channels;

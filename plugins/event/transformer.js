"use strict";

const Stream = require("stream");

const END_LINE = "\r\n";

class Transform extends Stream.Transform {
  constructor(options = {}, objectMode) {
    super({ objectMode });

    this.event = options.event || null;

    let counter = 1;
    this.generateId = options.generateId || (() => counter++);
  }

  _transform(chunk, encoding, callback) {
    if (typeof chunk === "string" && chunk[0] === ":") {
      this.push(chunk + END_LINE + END_LINE);
      return callback();
    }

    const chunkEvent =
      (typeof chunk === "object" ? chunk.event : null) || this.event;

    const event = {
      id: this.generateId(chunk),
      data: chunk,
    };

    if (chunkEvent) event.event = chunkEvent;

    this.push(this.stringify(event));
    return callback();
  }

  _flush(callback) {
    this.push(this.stringify({ event: "end", data: "" }));
    callback();
  }

  stringify(event) {
    return (
      Object.keys(event).reduce((memo, key) => {
        let val = event[key];
        if (val instanceof Buffer) val = val.toString();
        if (typeof val === "object") val = JSON.stringify(val);
        return `${memo}${key}: ${val}${END_LINE}`;
      }, "") + END_LINE
    );
  }
}

module.exports = Transform;

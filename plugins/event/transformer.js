"use strict";

const Stream = require("stream");

const END_LINE = "\r\n";

class Transform extends Stream.Transform {
  constructor() {
    super({ objectMode: true });

    let counter = 1;
    this.generateId = () => counter++;
  }

  _transform({ data, event }, encoding, callback) {
    this.push(
      this.stringify({
        id: this.generateId(),
        data,
        event,
      })
    );
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

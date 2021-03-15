// Modified from https://github.com/mtharrison/susie
// Copyright (c) 2015, Matt Harrison
// All rights reserved.

"use strict";

const { PassThrough } = require("stream");
const Transformer = require("./transformer");
const packageInfo = require("../../package");

const handleEvent = function (event) {
  const stream = new PassThrough();
  const through = new Transformer();

  through.pipe(stream);
  event.pipe(through);

  // eslint-disable-next-line no-invalid-this
  return this(stream)
    .header("content-type", "text/event-stream")
    .header("content-encoding", "identity")
    .header("cache-control", "no-cache")
    .header("connection", "keep-alive");
};

exports.register = (server, options, next) => {
  server.decorate("reply", "event", handleEvent);
  next();
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-event`,
  version: packageInfo.version,
};

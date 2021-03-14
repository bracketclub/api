"use strict";

const util = require("util");
const { PassThrough } = require("stream");
const PGPubsub = require("pg-pubsub");
const ms = require("ms");
const _ = require("lodash");
const pipe = require("multipipe");
const packageInfo = require("../../package");
const postgres = require("../../lib/postgres-config");

const WRITE_WAIT = 250;
const LOG_TAG = "sse";

exports.register = (server, options, done) => {
  // Listen for PG NOTIFY queries
  const sub = new PGPubsub(postgres.connectionString, {
    log: (...args) => server.log([LOG_TAG, "pgpubsub"], util.format(...args)),
  });

  const createSSERoute = (route, write, { debounce = true } = {}) => {
    // Create a stream which will be the reply and be written to by pg pubsub
    const eventStream = new PassThrough({ objectMode: true });

    // Log and write to the stream
    const writeEvent = _[debounce ? "debounce" : "identity"]((id, name) => {
      const data = write(id);
      server.log([LOG_TAG, name], data);
      eventStream.write(data);
    }, WRITE_WAIT);

    // Add a pubsub channel for the namespace. This will listen for all NOTIFY
    // queries on that table
    sub.addChannel(route, (id) => writeEvent(id, route));

    server.route({
      method: "GET",
      path: `/${route}/events`,
      config: {
        description: `Get ${route} events stream`,
        tags: ["api", LOG_TAG, route],
        handler: (request, reply) => {
          const handlerStream = new PassThrough({ objectMode: true });

          const response = reply.event(
            pipe(eventStream, handlerStream, { objectMode: true })
          );

          response.header("access-control-allow-origin", "*");
          response.header("access-control-allow-credentials", true);
          response.header(
            "access-control-expose-headers",
            "content-type, content-length, etag"
          );

          // Reply immediately with one heartbeat so that the stream
          // does not show up as an error if it gets closed before the first interval
          handlerStream.write(":heartbeat");

          return response;
        },
      },
    });

    server.route({
      method: "OPTIONS",
      path: `/${route}/events`,
      config: {
        description: `Get ${route} events stream`,
        tags: ["api", LOG_TAG, route],
        handler: (request, reply) => {
          const response = reply();

          response.header("access-control-allow-origin", "*");
          response.header("access-control-allow-credentials", true);
          response.header(
            "access-control-expose-headers",
            "content-type, content-length, etag"
          );

          if (request.headers["access-control-request-headers"]) {
            response.header(
              "access-control-allow-headers",
              request.headers["access-control-request-headers"]
            );
          }

          if (request.headers["access-control-request-method"]) {
            response.header(
              "access-control-allow-methods",
              request.headers["access-control-request-method"]
            );
          }

          return response;
        },
      },
    });

    // https://github.com/zeit/now-cli/issues/20
    // When deployed to now.sh it seems to close streams after 1 or 2 minutes
    // so this will keep those alive
    setInterval(() => eventStream.write(":heartbeat"), ms("25s"));
  };

  // Don't debounce stream writes for users since individual users wont
  // ever update that frequently.
  createSSERoute("users", (id) => ({ id, event: "users" }), {
    debounce: false,
  });
  createSSERoute("entries", (event) => ({ event }));
  createSSERoute("masters", (event) => ({ event }));

  return done();
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-sse`,
  version: packageInfo.version,
};

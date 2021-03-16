"use strict";

const util = require("util");
const { PassThrough } = require("stream");
const PGPubsub = require("pg-pubsub");
const ms = require("ms");
const _ = require("lodash");
const packageInfo = require("../../package");
const postgres = require("../../lib/postgres-config");

const WRITE_WAIT = 1000;
const LOG_TAG = "sse";

exports.register = (server, options, done) => {
  // Listen for PG NOTIFY queries
  const sub = new PGPubsub(postgres.connectionString, {
    log: (...args) => server.log([LOG_TAG, "pgpubsub"], util.format(...args)),
  });

  const createSSERoute = (route, write) => {
    server.route({
      method: "GET",
      path: `/${route}/events`,
      config: {
        description: `Get ${route} events stream`,
        tags: ["api", LOG_TAG, route],
        handler: (request, reply) => {
          // Create a stream which will be the reply and be written to by pg pubsub
          const eventStream = new PassThrough({ objectMode: true });

          const keepalive = () =>
            eventStream.write({ event: "keepalive", time: Date.now() });

          // Add a pubsub channel for the namespace. This will listen for all NOTIFY
          // queries on that table
          const handler = _.debounce((id) => {
            const data = write(id);
            server.log([LOG_TAG, route], data);
            eventStream.write(data);
          }, WRITE_WAIT);

          sub.addChannel(route, handler);

          // https://devcenter.heroku.com/articles/error-codes#h15-idle-connection
          // Heroku has a 55s idle connection timeout. But in practice it is 30s
          const keepAliveInterval = setInterval(keepalive, ms("20s"));
          const initialTimeout = setTimeout(keepalive, 2000);

          request.once("disconnect", () => {
            clearInterval(keepAliveInterval);
            clearTimeout(initialTimeout);
            sub.removeChannel(route, handler);
          });

          return reply.event(eventStream);
        },
      },
    });
  };

  // Don't debounce stream writes for users since individual users wont
  // ever update that frequently.
  createSSERoute("users", (id) => ({ id, event: "users" }));
  createSSERoute("entries", (event) => ({ event }));
  createSSERoute("masters", (event) => ({ event }));

  return done();
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-sse`,
  version: packageInfo.version,
};

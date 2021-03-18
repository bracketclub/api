"use strict";

const util = require("util");
const { PassThrough } = require("stream");
const PGPubsub = require("pg-pubsub");
const ms = require("ms");
const _ = require("lodash");
const packageInfo = require("../../package");
const { connectionString } = require("../../lib/db");

const WRITE_WAIT = 1000;
const LOG_TAG = "sse";

exports.register = (server, options, done) => {
  // Listen for PG NOTIFY queries
  const sub = new PGPubsub(connectionString, {
    log: (...args) => server.log([LOG_TAG, "pgpubsub"], util.format(...args)),
  });

  server.route({
    method: "GET",
    path: `/event-stream`,
    config: {
      description: `Get event stream`,
      tags: [LOG_TAG],
      handler: (request, reply) => {
        // Create a stream which will be the reply and be written to by pg pubsub
        const eventStream = new PassThrough({ objectMode: true });
        const writeToStream = (event, data) =>
          eventStream.write({ event, data });

        // Add a pubsub channel for the namespace. This will listen for all NOTIFY
        // queries on that table
        const createHandler = (event) =>
          _.debounce((data) => {
            request.log([LOG_TAG, event], data);
            writeToStream(event, data);
          }, WRITE_WAIT);

        const handlers = ["masters", "entries", "users"].map((channel) => {
          const handler = createHandler(channel);
          sub.addChannel(channel, handler);
          return [channel, handler];
        });

        const keepalive = () =>
          writeToStream("keepalive", { time: new Date().toJSON() });

        // https://devcenter.heroku.com/articles/error-codes#h15-idle-connection
        // Heroku has a 55s idle connection timeout. But in practice it is 30s
        const keepAliveInterval = setInterval(keepalive, ms("20s"));
        const initialTimeout = setTimeout(keepalive, ms("2s"));

        request.once("disconnect", () => {
          clearInterval(keepAliveInterval);
          clearTimeout(initialTimeout);
          handlers.forEach((handler) => sub.removeChannel(...handler));
        });

        return reply.event(eventStream);
      },
    },
  });

  return done();
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-sse`,
  version: packageInfo.version,
};

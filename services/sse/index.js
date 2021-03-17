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

        // Add a pubsub channel for the namespace. This will listen for all NOTIFY
        // queries on that table
        const createHandler = (fn) =>
          _.debounce((id) => {
            const data = fn(id);
            request.log([LOG_TAG, data.event], data);
            eventStream.write(data);
          }, WRITE_WAIT);

        const mastersHandler = createHandler((sportYear) => ({
          event: "masters",
          id: sportYear,
        }));

        const entriesHandler = createHandler((sportYear) => ({
          event: "entries",
          id: sportYear,
        }));

        const usersHandler = createHandler((userId) => ({
          event: "users",
          id: userId,
        }));

        sub.addChannel("masters", mastersHandler);
        sub.addChannel("entries", entriesHandler);
        sub.addChannel("users", usersHandler);

        const keepalive = () =>
          eventStream.write({
            event: "keepalive",
            time: new Date().toJSON(),
          });

        // https://devcenter.heroku.com/articles/error-codes#h15-idle-connection
        // Heroku has a 55s idle connection timeout. But in practice it is 30s
        const keepAliveInterval = setInterval(keepalive, ms("20s"));
        const initialTimeout = setTimeout(keepalive, ms("2s"));

        request.once("disconnect", () => {
          clearInterval(keepAliveInterval);
          clearTimeout(initialTimeout);
          sub.removeChannel("masters", mastersHandler);
          sub.removeChannel("entries", entriesHandler);
          sub.removeChannel("users", usersHandler);
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

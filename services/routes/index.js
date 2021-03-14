"use strict";

const packageInfo = require("../../package");

const users = require("./controllers/users");
const entries = require("./controllers/entries");
const masters = require("./controllers/masters");

exports.register = (server, options, done) => {
  // Users
  server.route({ method: "GET", path: "/users/{id}", config: users.get });
  server.route({
    method: "GET",
    path: "/users/{id}/{sport}-{year}",
    config: users.byEvent,
  });

  // Entries
  server.route({
    method: "GET",
    path: "/entries/{sport}-{year}",
    config: entries.all,
  });
  server.route({ method: "GET", path: "/entries/{id}", config: entries.get });

  // Masters
  server.route({
    method: "GET",
    path: "/masters/{sport}-{year}",
    config: masters.get,
  });

  return done();
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-routes`,
  version: packageInfo.version,
};

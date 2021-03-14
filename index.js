"use strict";

require("dotenv").config();

const Hapi = require("hapi");
const Hoek = require("hoek");
const config = require("getconfig");
const postgres = require("./lib/postgres-config");
const packageInfo = require("./package");

const server = new Hapi.Server(config.hapi.options);

const goodReporters = {
  console: [
    {
      module: "good-squeeze",
      name: "Squeeze",
      args: [config.hapi.logEvents],
    },
    {
      module: "good-console",
    },
    "stdout",
  ],
};

if (config.loggly.token) {
  goodReporters.loggly = [
    {
      module: "good-squeeze",
      name: "Squeeze",
      args: [config.hapi.logEvents],
    },
    {
      module: "good-loggly",
      args: [
        {
          token: config.loggly.token,
          subdomain: config.loggly.subdomain,
          tags: config.loggly.tags,
          name: packageInfo.name,
          hostname: config.baseUrl,
          threshold: 20,
          maxDelay: 15000,
        },
      ],
    },
  ];
}

const plugins = [
  {
    register: require("good"),
    options: {
      reporters: goodReporters,
    },
  },
  {
    register: require("./plugins/event"),
  },
  {
    register: require("pgboom"),
    options: {
      getNull404: true,
    },
  },
  {
    register: require("./plugins/postgres"),
    options: { config: postgres },
  },
  {
    register: require("./services/routes"),
  },
  {
    register: require("./services/sse"),
  },
  {
    register: require("./services/healthcheck"),
  },
];

server.connection({
  routes: {
    cors: true,
  },
  host: config.hapi.host,
  port: config.hapi.port,
});

// server.ext("onPreResponse", (request, reply) => {
//   const response = request.response.isBoom
//     ? request.response.output
//     : request.response;

//   response.headers["access-control-max-age"] = 60 * 10;
//   response.headers["access-control-allow-origin"] = "*";
//   response.headers["access-control-expose-headers"] = "*";
//   response.headers["access-control-allow-headers"] = "*";
//   response.headers["access-control-allow-methods"] = "*";

//   return reply.continue();
// });

server.register(plugins, (err) => {
  Hoek.assert(!err, `Failed loading plugins: ${err}`);

  server.start((startErr) => {
    Hoek.assert(!startErr, `Failed starting service: ${startErr}`);
    server.log(["info", "startup"], `Service is running at ${server.info.uri}`);
  });
});

server.on("stop", () =>
  server.log(["info", "shutdown"], "Service has stopped")
);

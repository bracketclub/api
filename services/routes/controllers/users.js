"use strict";

const Joi = require("joi");

const utils = require("../lib/reply");
const db = require("../../../lib/db");

const userWithEntriesQuery = (where) => `
SELECT
  u.id, u.username, u.profile_pic,
  json_agg(e.*) as entries
FROM
  users as u,
  (
    SELECT DISTINCT ON (sport, extract(YEAR from created))
      bracket, created, sport, id, "user",
      (extract(YEAR from created) || '') as year
    FROM
      entries
    WHERE
      "user" = $1 ${where ? `AND ${where}` : ""}
    ORDER BY
      sport, extract(YEAR from created), created DESC
  ) as e
WHERE
  u.id = $1
GROUP BY
  u.id;
`;

const userQuery = () => `
SELECT
  u.id, u.username, u.profile_pic,
  ARRAY[]::integer[] as entries
FROM
  users as u
WHERE
  u.id = $1;
`;

module.exports = {
  get: {
    description: "Get user by id",
    tags: ["api", "users"],
    handler: (request, reply) => {
      db.query(
        request,
        userWithEntriesQuery(),
        [request.params.id],
        (err, res) => reply(err, utils.get(res))
      );
    },
    validate: {
      params: {
        id: Joi.string().regex(/^\d+$/),
      },
    },
  },
  byEvent: {
    description: "Entries by user by event",
    tags: ["api", "users"],
    handler: (request, reply) => {
      const { sport, year, id } = request.params;

      const getUserWithEntries = (cb) =>
        db.query(
          request,
          userWithEntriesQuery(
            "sport = $2 AND extract(YEAR from created) = $3"
          ),
          [id, sport, year],
          (err, res) => cb(err, utils.get(res))
        );

      const getUser = (cb) =>
        db.query(request, userQuery(), [id], (err, res) =>
          cb(err, utils.get(res))
        );

      getUserWithEntries((err, res) => {
        if (err || res) {
          reply(err, res);
          return;
        }
        // Still attempt to return the user if they have no entries for this
        // event. Probably a better (SQL) way to do this but no idea
        getUser(reply);
      });
    },
    validate: {
      params: {
        year: Joi.string().regex(/^20\d\d$/),
        sport: Joi.string().regex(/^\w+$/),
        id: Joi.string().regex(/^\d+$/),
      },
    },
  },
};

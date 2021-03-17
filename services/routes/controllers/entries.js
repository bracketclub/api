"use strict";

const Joi = require("joi");

const utils = require("../lib/reply");
const db = require("../../../lib/db");

const entriesQuery = (where) => `
SELECT DISTINCT ON (u.id)
  e.bracket, e.id, e.created, e.sport,
  (extract(YEAR from e.created) || '') as year,
  row_to_json(u) as "user"
FROM
  entries e,
  users u
WHERE
  ${where} AND e.user = u.id
ORDER BY
  u.id, created DESC;
`;

module.exports = {
  all: {
    description: "All entries",
    tags: ["entries"],
    handler: (request, reply) => {
      const { sport, year } = request.params;

      db.query(
        request,
        entriesQuery("extract(YEAR from created) = $1 AND sport = $2"),
        [year, sport],
        (err, res) => reply(err, utils.all(res))
      );
    },
    validate: {
      params: {
        year: Joi.string().regex(/^20\d\d$/),
        sport: Joi.string().regex(/^\w+$/),
      },
    },
  },
  get: {
    description: "Get entry by id",
    tags: ["entries"],
    handler: (request, reply) => {
      db.query(
        request,
        entriesQuery("id = $1"),
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
};

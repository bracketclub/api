'use strict';

const Joi = require('joi');

const utils = require('../lib/reply');

const usersQuery = (where) => `
SELECT
  u.user_id, u.username, u.profile_pic,
  json_agg(e.*) as entries
FROM
  users as u,
  (SELECT
    DISTINCT ON (sport, extract(YEAR from created))
      bracket, created, sport, data_id, (extract(YEAR from created) || '') as year
    FROM entries
    WHERE user_id = $1 ${where ? `AND ${where}` : ''}
    ORDER BY sport, extract(YEAR from created), created DESC
  ) as e
WHERE u.user_id = $1
GROUP BY u.user_id;`;

const onlyUserQuery = () => `SELECT
  u.user_id, u.username, u.profile_pic,
  ARRAY[]::integer[] as entries
FROM users as u
WHERE u.user_id = $1;`;

module.exports = {
  get: {
    description: 'Get user by id',
    tags: ['api', 'users'],
    handler: (request, reply) => {
      request.pg.client.query(
        usersQuery(),
        [request.params.id],
        (err, res) => reply(err, utils.get(res))
      );
    },
    validate: {
      params: {
        id: Joi.string().regex(/^\d+$/)
      }
    }
  },
  byEvent: {
    description: 'Entries by user by event',
    tags: ['api', 'entries'],
    handler: (request, reply) => {
      const year = request.params.year;
      const sport = request.params.sport;
      const id = request.params.id;

      request.pg.client.query(
        usersQuery('sport = $2 AND extract(YEAR from created) = $3'),
        [id, sport, year],
        (err, res) => {
          if (err) return reply(err);
          const userWithEntries = utils.get(res);
          if (userWithEntries) return reply(null, userWithEntries);
          // Still attempt to return the user if they have no entries for this
          // event. Probably a better (SQL) way to do this but no idea
          request.pg.client.query(onlyUserQuery(), [id], (err2, res2) => {
            reply(err2, utils.get(res2));
          });
        }
      );
    },
    validate: {
      params: {
        year: Joi.string().regex(/^20\d\d$/),
        sport: Joi.string().regex(/^\w+$/),
        id: Joi.string().regex(/^\d+$/)
      }
    }
  }
};

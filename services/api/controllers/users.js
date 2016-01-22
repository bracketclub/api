'use strict';

const Joi = require('joi');

const utils = require('../lib/reply');

const usersQuery = (where, whereEntries) => `SELECT
  u.user_id, u.username, u.profile_pic,
  json_agg(
    (SELECT x FROM (
      SELECT e.bracket, e.created, e.data_id, e.sport, (extract(YEAR from created) || '') as year
      ${whereEntries ? `WHERE ${whereEntries}` : ''}
    ) x)
  ) AS entries
  FROM users u
  LEFT JOIN entries e on e.user_id = u.user_id
  ${where ? `WHERE ${where}` : ''}
  GROUP BY u.user_id`;

module.exports = {
  get: {
    description: 'Get user by id',
    tags: ['api', 'users'],
    handler: (request, reply) => {
      request.pg.client.query(
        usersQuery('u.user_id = $1'),
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
    description: 'Entries by user',
    tags: ['api', 'entries'],
    handler: (request, reply) => {
      const year = request.params.year;
      const sport = request.params.sport;
      const id = request.params.id;

      request.pg.client.query(
        usersQuery('u.user_id = $1', 'e.sport = $2 AND extract(YEAR from created) = $3'),
        [id, sport, year],
        (err, res) => {
          const user = utils.get(res);

          if (user) {
            user.entries = user.entries.filter(Boolean);
          }

          return reply(err, user);
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

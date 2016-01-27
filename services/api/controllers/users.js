'use strict';

const Joi = require('joi');

const utils = require('../lib/reply');

const usersQuery = () => `SELECT
  u.user_id, u.username, u.profile_pic,
  json_agg(e.*) as entries
FROM
  users as u,
  (
    SELECT
    DISTINCT ON (sport, extract(YEAR from created))
    bracket, created, sport, data_id, (extract(YEAR from created) || '') as year
    FROM entries
    WHERE user_id = $1
    ORDER BY sport, extract(YEAR from created), created DESC
  ) as e
WHERE u.user_id = $1
GROUP BY u.user_id;`;

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
  }
};

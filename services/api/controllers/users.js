'use strict';

const Joi = require('joi');

const utils = require('../lib/reply');

const usersQuery = (where) => `SELECT
  u.user_id, u.username, u.profile_pic,
  json_agg((SELECT x FROM (SELECT e.bracket, e.created, e.data_id, e.sport, extract(YEAR from created) as year) x)) AS entries
  FROM users u
  LEFT JOIN entries e on e.user_id = u.user_id
  ${where ? `WHERE ${where}` : ''}
  GROUP BY u.user_id`;

module.exports = {
  get: {
    description: 'Get user by id',
    tags: ['api', 'users'],
    handler: (request, reply) => {
      request.pg.client.query(usersQuery('u.user_id = $1'), [request.params.id], (err, res) => {
        reply(err, utils.get(res));
      });
    },
    validate: {
      params: {
        id: Joi.string().regex(/^[\d]+$/)
      }
    }
  }
};

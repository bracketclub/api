'use strict';

const Joi = require('joi');

const utils = require('../lib/reply');

module.exports = {
  all: {
    description: 'All users',
    tags: ['api', 'users'],
    handler: (request, reply) => {
      request.pg.client.query('SELECT * FROM users;', (err, res) => {
        reply(err, utils.all(res));
      });
    }
  },
  get: {
    description: 'Get user by id',
    tags: ['api', 'users'],
    handler: (request, reply) => {
      request.pg.client.query('SELECT * FROM users WHERE user_id = $1;', [request.params.id], (err, res) => {
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

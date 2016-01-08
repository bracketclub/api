'use strict';

const Joi = require('joi');
const _ = require('lodash');

const utils = require('../lib/reply');
const where = require('../lib/where');

module.exports = {
  all: {
    description: 'All entries',
    tags: ['api', 'entries'],
    handler: (request, reply) => {
      const clauses = [];

      if (!_.isEmpty(request.query)) {
        const year = request.query.year;
        const user = request.query.user;

        if (year) {
          clauses.push({
            text: 'extract(YEAR from created) = $',
            value: year
          });
        }

        if (user) {
          clauses.push({
            text: 'user_id = $',
            value: user
          });
        }
      }

      const query = where(clauses);
      request.pg.client.query(`SELECT * FROM entries ${query.text};`, query.values, (err, res) => reply(err, utils.all(res)));
    },
    validate: {
      query: {
        year: Joi.string().regex(/^20\d\d$/),
        user: Joi.string().regex(/^[\d]+$/)
      }
    }
  },
  get: {
    description: 'Get entry by id',
    tags: ['api', 'entries'],
    handler: (request, reply) => {
      request.pg.client.query('SELECT * FROM entries WHERE data_id = $1;', [request.params.id], (err, res) => {
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

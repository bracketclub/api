'use strict';

const Joi = require('joi');

const sseHandler = require('../lib/sseHandler');
const utils = require('../lib/reply');

const mastersQuery = (where) => `SELECT
  bracket, created
  FROM masters
  ${where ? `WHERE ${where}` : ''}
  ORDER BY created`;

module.exports = {
  all: {
    description: 'All masters',
    tags: ['api', 'masters'],
    handler: (request, reply) => {
      const year = request.query.year;
      const response = (err, res) => reply(err, utils.all(res));

      if (year) {
        request.pg.client.query(mastersQuery('extract(YEAR from created) = $1'), [year], response);
      }
      else {
        request.pg.client.query(mastersQuery(), response);
      }
    },
    validate: {
      query: {
        year: Joi.string().regex(/^20\d\d$/)
      }
    }
  },
  events(channel) {
    return {
      description: 'Subscribe to SSE channel for masters',
      tags: ['api', 'sse', 'masters'],
      handler: sseHandler(channel)
    };
  }
};

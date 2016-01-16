'use strict';

const Joi = require('joi');

const sseHandler = require('../lib/sseHandler');
const utils = require('../lib/reply');

const mastersQuery = (where) => `SELECT
  json_agg((SELECT x FROM (SELECT bracket, created) x) ORDER BY created) as brackets,
  (sport || '-' || extract(YEAR from created)) as id
  FROM masters
  ${where ? `WHERE ${where}` : ''}
  GROUP BY extract(YEAR from created), sport`;

module.exports = {
  get: {
    description: 'Get masters by year',
    tags: ['api', 'masters'],
    handler: (request, reply) => {
      const year = request.params.year;
      const sport = request.params.sport;

      request.pg.client.query(mastersQuery('extract(YEAR from created) = $1 AND sport = $2'), [year, sport], (err, res) => {
        reply(err, utils.get(res));
      });
    },
    validate: {
      params: {
        year: Joi.string().regex(/^20\d\d$/),
        sport: Joi.string()
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

'use strict';

const Joi = require('joi');

const sseHandler = require('../lib/sseHandler');
const utils = require('../lib/reply');

const mastersQuery = (where) => `SELECT
  json_agg((SELECT x FROM (SELECT bracket, created) x) ORDER BY created) as brackets,
  extract(YEAR from created) as year
  FROM masters
  ${where ? `WHERE ${where}` : ''}
  GROUP BY year
  ORDER BY year DESC`;

module.exports = {
  all: {
    description: 'All masters',
    tags: ['api', 'masters'],
    handler: (request, reply) => {
      request.pg.client.query(mastersQuery(), (err, res) => reply(err, utils.all(res)));
    }
  },
  get: {
    description: 'Get masters by year',
    tags: ['api', 'masters'],
    handler: (request, reply) => {
      request.pg.client.query(mastersQuery('extract(YEAR from created) = $1'), [request.params.id], (err, res) => {
        reply(err, utils.get(res));
      });
    },
    validate: {
      params: {
        id: Joi.string().regex(/^20\d\d$/)
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

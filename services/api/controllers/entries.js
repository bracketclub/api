'use strict';

const Joi = require('joi');

const sseHandler = require('../lib/sseHandler');
const utils = require('../lib/reply');

const entriesQuery = (where) => `SELECT
  e.bracket, e.data_id, e.created, e.sport,
  row_to_json(u) as user
  FROM entries e, users u
  WHERE ${where ? `${where} AND` : ''} e.user_id = u.user_id
  GROUP BY u.*, e.data_id;`;

module.exports = {
  all: {
    description: 'All entries',
    tags: ['api', 'entries'],
    handler: (request, reply) => {
      const year = request.params.year;
      const sport = request.params.sport;
      const response = (err, res) => reply(err, utils.all(res));

      request.pg.client.query(entriesQuery('extract(YEAR from created) = $1 AND sport = $2'), [year, sport], response);
    },
    validate: {
      params: {
        year: Joi.string().regex(/^20\d\d$/),
        sport: Joi.string()
      }
    }
  },
  get: {
    description: 'Get entry by id',
    tags: ['api', 'entries'],
    handler: (request, reply) => {
      request.pg.client.query(entriesQuery('data_id = $1'), [request.params.id], (err, res) => {
        reply(err, utils.get(res));
      });
    },
    validate: {
      params: {
        id: Joi.string().regex(/^[\d]+$/)
      }
    }
  },
  events(channel) {
    return {
      description: 'Subscribe to SSE channel for entries',
      tags: ['api', 'sse', 'entries'],
      handler: sseHandler(channel)
    };
  }
};

'use strict';

const Joi = require('joi');
const _ = require('lodash');

const sseHandler = require('../lib/sseHandler');
const utils = require('../lib/reply');
const where = require('../lib/where');

module.exports = {
  all: {
    description: 'All masters',
    tags: ['api', 'masters'],
    handler: (request, reply) => {
      const clauses = [];

      if (!_.isEmpty(request.query)) {
        const year = request.query.year;

        if (year) {
          clauses.push({
            text: 'extract(YEAR from created) = $',
            value: year
          });
        }
      }

      const query = where(clauses);
      request.pg.client.query(`SELECT bracket, created FROM masters ${query.text} ORDER BY created;`, query.values, (err, res) => reply(err, utils.all(res)));
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

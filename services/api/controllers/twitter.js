'use strict';

const Joi = require('joi');
const Twit = require('twit');
const config = require('getconfig');

module.exports = {
  friends: {
    description: 'Get users followers',
    tags: ['api', 'twitter'],
    handler: (request, reply) => {
      const token = request.query.token;
      const secret = request.query.secret;
      const user_id = request.query.id;

      const T = new Twit({
        consumer_key: config.twitter.consumer_key,
        consumer_secret: config.twitter.consumer_secret,
        access_token: token,
        access_token_secret: secret
      });

      T.get('friends/ids', {user_id, stringify_ids: true}, reply);
    },
    validate: {
      query: {
        token: Joi.string(),
        secret: Joi.string(),
        id: Joi.string()
      }
    }
  }
};

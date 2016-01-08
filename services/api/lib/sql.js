'use strict';

const _ = require('lodash');

module.exports = function SQL(parts) {
  return {
    text: parts.reduce((prev, curr, i) => `${prev}$${i}${curr}`),
    values: _.rest(arguments)
  };
};

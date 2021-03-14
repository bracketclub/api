"use strict";

const all = (res) => res && res.rows;
const getRow = (res) =>
  res && res.rows && res.rows.length ? res.rows[0] : null;

module.exports = { all, get: getRow };

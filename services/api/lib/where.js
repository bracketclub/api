'use strict';

const where = (clauses) => {
  if (!clauses || !clauses.length) {
    return {text: '', values: []};
  }

  const values = [];
  const withValues = clauses.map((clause) => {
    values.push(clause.value);
    return clause.text.replace('$', `$${values.length}`);
  });

  return {
    text: `WHERE ${withValues.join(' AND ')}`,
    values
  };
};

module.exports = where;

var _ = require('lodash');
var data = ['2012', '2013', '2014'].map(function (year) {
    var d = require('../data/ncaa-mens-basketball/' + year);
    d.year = year;
    return d;
});

module.exports.entries = _.flatten(_.map(data, function (value) {
    return _.values(value.entries);
}));

module.exports.masters =_.map(data, function (d) {
    return {brackets: d.masters, year: d.year};
});

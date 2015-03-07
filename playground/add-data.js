var level = require('level');
var db = level('../db', {
    valueEncoding: 'json'
});

var sport = 'ncaa-mens-basketball';
['2012', '2013', '2014', '2015'].forEach(function (year) {
    var data = {};
    data[sport] = require('../data/' + sport + '/' + year);
    db.put(sport, data);
});
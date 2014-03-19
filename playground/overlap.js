var data = require('../data/index');
var sport = 'ncaa-mens-basketball';
var _ = require('lodash');
var log = function (obj) {
    console.log(JSON.stringify(obj, null, 2));
};

var confident = [
    'tessatweettrain',
    'lynnandtonic',
    'kathykarrys',
    'msrivette',
    'juliamakes'
];

var current = data({sport: sport, year: new Date().getFullYear() + ''});
var previous = data({sport: sport, year: (new Date().getFullYear() - 1) + ''});
var previous2 = data({sport: sport, year: (new Date().getFullYear() - 2) + ''});

var previous2Users = _.chain(previous2.entries).pluck('username').invoke('toLowerCase').value();
var previousUsers = _.chain(previous.entries).pluck('username').invoke('toLowerCase').value();
var currentUsers = _.chain(current.entries).pluck('username').invoke('toLowerCase').value();

console.log('2013');
var diff2013 = _.difference(previousUsers, currentUsers, confident);
log(diff2013);

console.log('2012');
var diff2012 = _.difference(previous2Users, currentUsers, confident);
log(diff2012);

console.log('All');
var diffTotal = _.uniq(diff2013.concat(diff2012));
log(diffTotal);
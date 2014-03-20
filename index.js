var BracketData = require('bracket-data');
var liveData = require('./data/index');


module.exports = function (options) {
    var year = options.year;
    var sport = options.sport;
    var emptyBracket = new BracketData({year: year, sport: sport, props: ['constants']}).constants.EMPTY;
    var data = liveData({year: year, sport: sport});

    if (!data.masters || (data.masters && data.masters.length === 0)) {
        data.masters = [emptyBracket];
    }

    if (data.masters && data.masters.length > 0 && data.masters[0] !== emptyBracket) {
        data.masters.unshift(emptyBracket);
    }

    return data;
};


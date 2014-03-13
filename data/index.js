var data = {
    'ncaa-mens-basketball': {
        '2012': require('./ncaa-mens-basketball/2012.json'),
        '2013': require('./ncaa-mens-basketball/2013.json')
    }
};

module.exports = function (options) {
    options || (options = {});
    var yearData = data[options.sport] && data[options.sport][options.year];

    if (yearData) {
        return yearData;
    } else {
        throw new Error('The combination of ' + options.sport + ' and ' + options.year + ' does not exist.');
    }
};

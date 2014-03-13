var data = {};
var path = require('path');
var _ = require('lodash');
var walkdir = require('walkdir');
var dataPaths = walkdir.sync('./data');

var dataFiles = _.chain(dataPaths).filter(function (dataPath) {
    return path.extname(dataPath) === '.json' && path.basename(dataPath, '.json') !== 'defaults';
}).groupBy(function (dataPath) {
    return path.basename(path.dirname(dataPath));
}).value();

_.each(dataFiles, function (files, sport) {
    _.each(files, function (file) {
        var year = path.basename(file, '.json');
        data[sport] || (data[sport] = {});
        data[sport][year] = require('./' + sport + '/' + year);
    });
});

module.exports = function (options) {
    options || (options = {});
    var yearData = data[options.sport] && data[options.sport][options.year];

    if (yearData) {
        return yearData;
    } else {
        throw new Error('The combination of ' + options.sport + ' and ' + options.year + ' does not exist.');
    }
};

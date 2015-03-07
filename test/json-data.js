var liveData = function (options) {
    return require('../data/' + options.sport + '/' + options.year + '.json');
};
var assert = require('assert');


describe('Data', function () {
    it('Has masters', function () {
        var data = liveData({year: '2013', sport: 'ncaa-mens-basketball'});
        assert.equal(63, data.masters.length);
    });

    it('Has masters', function () {
        var data = liveData({year: '2012', sport: 'ncaa-mens-basketball'});
        assert.equal(63, data.masters.length);
    });

    it('Has entries', function () {
        var data = liveData({year: '2013', sport: 'ncaa-mens-basketball'});
        assert.equal(27, Object.keys(data.entries).length);
    });

    it('Has entries', function () {
        var data = liveData({year: '2012', sport: 'ncaa-mens-basketball'});
        assert.equal(15, Object.keys(data.entries).length);
    });

    it('should throw an error if year+sport is non-existant', function () {
        assert.throws(function () {
            liveData({
                year: '9',
                sport: 'world-crazyball-championship'
            });
        }, Error);
    });
});
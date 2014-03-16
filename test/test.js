var liveData = require('../index');
var assert = require('assert');
var path = require('path');
var fs = require('fs');


describe('Tweet watcher', function () {
    it('Has masters', function () {
        var data = liveData({year: '2013', sport: 'ncaa-mens-basketball'});
        assert.equal(64, data.masters.length);
    });

    it('Has masters', function () {
        var data = liveData({year: '2012', sport: 'ncaa-mens-basketball'});
        assert.equal(64, data.masters.length);
    });

    it('Has entries', function () {
        var data = liveData({year: '2013', sport: 'ncaa-mens-basketball'});
        assert.equal(27, data.entries.length);
    });

    it('Has entries', function () {
        var data = liveData({year: '2012', sport: 'ncaa-mens-basketball'});
        assert.equal(15, data.entries.length);
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

var save = require('../lib/save');
describe('Save entry', function () {

    it('It should save an entry', function (done) {
        var opts = {year: '1996', sport: 'ncaa-mens-basketball'};
        var jsonPath = path.resolve(__dirname, '..', 'data', opts.sport,  opts.year + '.json');

        save.entryJSON(opts, {user_id: 1, bracket: 1}, function () {
            var data = JSON.parse(fs.readFileSync(jsonPath));
            assert.equal(1, data.entries.length);
            assert.equal(1, data.entries[0].bracket);
            assert.equal(1, data.entries[0].user_id);
            fs.unlinkSync(jsonPath);
            done();
        });
    });

    it('It should overwrite an entry', function (done) {
        var opts = {year: '1996', sport: 'ncaa-mens-basketball'};
        var jsonPath = path.resolve(__dirname, '..', 'data', opts.sport,  opts.year + '.json');

        save.entryJSON(opts, {user_id: 1, bracket: 1}, function () {
            var data = JSON.parse(fs.readFileSync(jsonPath));
            assert.equal(1, data.entries.length);
            assert.equal(1, data.entries[0].bracket);
            assert.equal(1, data.entries[0].user_id);
            save.entryJSON(opts, {user_id: 1, bracket: 2}, function () {
                var data = JSON.parse(fs.readFileSync(jsonPath));
                assert.equal(1, data.entries.length);
                assert.equal(2, data.entries[0].bracket);
                assert.equal(1, data.entries[0].user_id);
                fs.unlinkSync(jsonPath);
                done();
            });
        });
    });
});

describe('Save master', function () {

    it('It should save a master', function (done) {
        var opts = {year: '1996', sport: 'ncaa-mens-basketball'};
        var jsonPath = path.resolve(__dirname, '..', 'data', opts.sport,  opts.year + '.json');

        save.masterJSON(opts, 'abc', function () {
            var data = JSON.parse(fs.readFileSync(jsonPath));
            assert.equal(1, data.masters.length);
            assert.equal('abc', data.masters[0]);
            fs.unlinkSync(jsonPath);
            done();
        });
    });

    it('It should not save the same master twice', function (done) {
        var opts = {year: '1996', sport: 'ncaa-mens-basketball'};
        var jsonPath = path.resolve(__dirname, '..', 'data', opts.sport,  opts.year + '.json');

        save.masterJSON(opts, 'abc', function () {
            var data = JSON.parse(fs.readFileSync(jsonPath));
            assert.equal(1, data.masters.length);
            assert.equal('abc', data.masters[0]);
            save.masterJSON(opts, 'abc', function () {
                var data = JSON.parse(fs.readFileSync(jsonPath));
                assert.equal(1, data.masters.length);
                assert.equal('abc', data.masters[0]);
                fs.unlinkSync(jsonPath);
                done();
            });
        });
    });

    it('It should append the next master', function (done) {
        var opts = {year: '1996', sport: 'ncaa-mens-basketball'};
        var jsonPath = path.resolve(__dirname, '..', 'data', opts.sport,  opts.year + '.json');

        save.masterJSON(opts, 'abc', function () {
            var data = JSON.parse(fs.readFileSync(jsonPath));
            assert.equal(1, data.masters.length);
            assert.equal('abc', data.masters[0]);
            save.masterJSON(opts, 'def', function () {
                var data = JSON.parse(fs.readFileSync(jsonPath));
                assert.equal(2, data.masters.length);
                assert.equal('abc', data.masters[0]);
                assert.equal('def', data.masters[1]);
                fs.unlinkSync(jsonPath);
                done();
            });
        });
    });
});
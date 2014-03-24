var liveData = require('../index');
var assert = require('assert');
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

var Save = require('../lib/save');
describe('Save entry', function () {

    it('It should save an entry', function (done) {
        var save = new Save({year: '1996', sport: 'ncaa-mens-basketball'});

        save.entry({user_id: 1, bracket: 1}, function (err, obj, jsonPath) {
            var data = JSON.parse(fs.readFileSync(jsonPath));
            assert.equal(1, data.entries.length);
            assert.equal(1, data.entries[0].bracket);
            assert.equal(1, data.entries[0].user_id);
            fs.unlinkSync(jsonPath);
            done();
        });
    });

    it('It should overwrite an entry', function (done) {
        var save = new Save({year: '1996', sport: 'ncaa-mens-basketball'});

        save.entry({user_id: 1, bracket: 1}, function (err, obj, jsonPath) {
            var data = JSON.parse(fs.readFileSync(jsonPath));
            assert.equal(1, data.entries.length);
            assert.equal(1, data.entries[0].bracket);
            assert.equal(1, data.entries[0].user_id);
            save.entry({user_id: 1, bracket: 2}, function (err, obj, jsonPath) {
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
        var save = new Save({year: '1996', sport: 'ncaa-mens-basketball'});

        save.master('abc', function (err, obj, jsonPath) {
            var data = JSON.parse(fs.readFileSync(jsonPath));
            assert.equal(1, data.masters.length);
            assert.equal('abc', data.masters[0]);
            fs.unlinkSync(jsonPath);
            done();
        });
    });

    it('It should not save the same master twice', function (done) {
        var save = new Save({year: '1996', sport: 'ncaa-mens-basketball'});

        save.master('abc', function (err, obj, jsonPath) {
            var data = JSON.parse(fs.readFileSync(jsonPath));
            assert.equal(1, data.masters.length);
            assert.equal('abc', data.masters[0]);
            save.master('abc', function () {
                var data = JSON.parse(fs.readFileSync(jsonPath));
                assert.equal(1, data.masters.length);
                assert.equal('abc', data.masters[0]);
                fs.unlinkSync(jsonPath);
                done();
            });
        });
    });

    it('It should append the next master', function (done) {
        var save = new Save({year: '1996', sport: 'ncaa-mens-basketball'});

        save.master('abc', function (err, obj, jsonPath) {
            var data = JSON.parse(fs.readFileSync(jsonPath));
            assert.equal(1, data.masters.length);
            assert.equal('abc', data.masters[0]);
            save.master('def', function (err, obj, jsonPath) {
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

describe('Push when complete', function () {
    it('Should be done after push', function (done) {
        Save.prototype._push = function () {
            done();
        };

        var save = new Save({
            year: '1996',
            sport: 'ncaa-mens-basketball',
            pushWait: 500
        });

        save.entry({user_id: 1, bracket: 1}, function (err, obj, jsonPath) {
            var data = JSON.parse(fs.readFileSync(jsonPath));
            assert.equal(1, data.entries.length);
            assert.equal(1, data.entries[0].bracket);
            assert.equal(1, data.entries[0].user_id);
            fs.unlinkSync(jsonPath);
        });
    });

    it('Should be done after push even with multiple entries', function (done) {
        Save.prototype._push = function () {
            done();
        };

        var save = new Save({
            year: '1996',
            sport: 'ncaa-mens-basketball',
            pushWait: 1000
        });

        save.entry({user_id: 1, bracket: 1}, function (err, obj, jsonPath) {
            var data = JSON.parse(fs.readFileSync(jsonPath));
            assert.equal(1, data.entries.length);
            assert.equal(1, data.entries[0].bracket);
            assert.equal(1, data.entries[0].user_id);
            setTimeout(function () {
                save.entry({user_id: 2, bracket: 2}, function (err, obj, jsonPath) {
                    var data = JSON.parse(fs.readFileSync(jsonPath));
                    assert.equal(2, data.entries.length);
                    assert.equal(2, data.entries[1].bracket);
                    assert.equal(2, data.entries[1].user_id);
                    fs.unlinkSync(jsonPath);
                });
            }, 500);
        });
    });
});
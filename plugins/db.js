var dulcimer = require('dulcimer');
var moment = require('moment');
var _ = require('lodash');
var async = require('async');
var addData = require('../playground/add-data');


var filterByYear = function (req) {
    var year = req.params.year;
    return {filter: function (model) {
        return year ? model.year === year : true;
    }};
};

var formatReply = function (reply, err, resp) {
    reply({
        error: err ? {message: err.message, stack: err.stack} : null,
        response: err ? null : _.invoke(resp, 'toJSON')
    })
    .code(err ? 500 : 200);
};


exports.register = function (server, options, next) {
    dulcimer.connect(options.path);

    var Entry = new dulcimer.Model({
        created: {type: 'string', required: true},
        user_id: {type: 'string', required: true, index: true},
        data_id: {type: 'string', required: true},
        username: {type: 'string', required: true},
        name: {type: 'string', required: true},
        profile_pic: {type: 'string', required: true},
        bracket: {type: 'string', required: true},
        year: {
            index: true,
            derive: function () {
                return moment(this.created, 'ddd MMM DD HH:mm:ss ZZ YYYY').format('YYYY');
            }
        }
    }, {name: 'entry'});

    var Master = new dulcimer.Model({
        year: {type: 'string', required: true, index: true},
        brackets: {}
    }, {name: 'master'});

    server.route([{
        method: 'GET',
        path: '/masters',
        handler: function (request, reply) {
            Master.all(_.partial(formatReply, reply));
        }
    }, {
        method: 'GET',
        path: '/{year}/masters',
        handler: function (request, reply) {
            Master.all(filterByYear(request), _.partial(formatReply, reply));
        }
    }, {
        method: 'GET',
        path: '/entries',
        handler: function (request, reply) {
            Entry.all(_.partial(formatReply, reply));
        }
    }, {
        method: 'GET',
        path: '/{year}/entries',
        handler: function (request, reply) {
            Entry.all(filterByYear(request), _.partial(formatReply, reply));
        }
    }, {
        method: 'GET',
        path: '/entries/{id}',
        handler: function (request, reply) {
            Entry.getByIndex('user_id', request.params.id, _.partial(formatReply, reply));
        }
    }, {
        method: 'GET',
        path: '/{year}/entries/{id}',
        handler: function (request, reply) {
            Entry.getByIndex('user_id', request.params.id, filterByYear(request), _.partial(formatReply, reply));
        }
    }]);

    server.expose('Master', Master);
    server.expose('Entry', Entry);

    if (options.import) {
        server.log(['log'], 'Importing new data to db...');
        async.parallel([
            function (cb) {
                Entry.importData(addData.entries, function (err) {
                    server.log(['log'], 'Entries imported');
                    cb(err);
                });
            },
            function (cb) {
                Master.importData(addData.masters, function (err) {
                    server.log(['log'], 'Masters imported');
                    cb(err);
                });
            }
        ], next);
    } else {
        next();
    }
};

exports.register.attributes = {
    name: 'db',
    version: '1.0.0'
};

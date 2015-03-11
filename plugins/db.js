var models = require('../models');
var _ = require('lodash');


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
    var Entry = models.Entry;
    var Master = models.Master;

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

    next();
};

exports.register.attributes = {
    name: 'db',
    version: '1.0.0'
};

'use strict';

const EntryWatcher = require('entry-watcher');
const path = require('path');
const _ = require('lodash');

const Channels = require('../lib/channels');
const sseHandler = require('../lib/sseHandler');

exports.register = (server, config, next) => {
  const options = _.extend({
    logfile: path.resolve(__dirname, '..', 'logs', 'entries.log'),
    type: 'tweet',
    auth: config.twitter
  }, config);

  const year = config.year;
  const Entry = server.plugins.db.Entry;
  const channels = new Channels();

  const filterByYear = {
    filter: (model) => year ? model.year === year : true
  };

  const createEntry = (data, cb) => {
    const created = Entry.create(data);
    created.save((err) => {
      if (err) {
        server.log(['error'], `Error creating entry:' + err`);
        return cb(err);
      }

      server.log(['debug'], `Created entry: ${created.toString()}`);
      return cb(null, created);
    });
  };

  const updateEntry = (data, model, cb) => {
    Entry.update(model.key, data, (err, updated) => {
      if (err) {
        server.log(['error'], `Error updating entry: ${err}`);
        return cb(err);
      }

      server.log(['debug'], `Updated entry: ${updated.toString()}`);
      return cb(null, updated);
    });
  };

  const updateOrCreate = (data, model, cb) => {
    if (model) {
      updateEntry(data, model, cb);
    }
    else {
      createEntry(data, cb);
    }
  };

  options.onSave = (data) => {
    Entry.getByIndex('user_id', data.user_id, _.extend({limit: 1}, filterByYear), (err, found) => {
      if (err) {
        server.log(['error'], `Error finding entry by index: ${err}`);
      }
      else {
        updateOrCreate(data, found[0], (updateErr, entry) => {
          if (!updateErr && entry) {
            channels.write({event: 'entries', data: entry.toJSON()});
          }
        });
      }
    });
  };

  server.route({
    method: 'GET',
    path: '/entries/events',
    handler: sseHandler(channels)
  });

  if (options.start) {
    new EntryWatcher(options).start();
  }

  next();
};

exports.register.attributes = {
  name: 'entry-watcher',
  version: '1.0.0'
};

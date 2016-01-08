'use strict';

const ScoreWatcher = require('score-watcher');
const path = require('path');
const _ = require('lodash');
const pg = require('pg');

const packageInfo = require('../../package');
const Channels = require('../../lib/channels');
const sseHandler = require('../../lib/sseHandler');

exports.register = (plugin, config, next) => {
  if (!config.start) {
    return next();
  }

  const options = _.extend({
    logfile: path.resolve(__dirname, '..', 'logs', 'scores.log'),
    scores: {interval: 1}
  }, config.tweetyourbracket);

  const channels = new Channels();
  const log = (type, text) => plugin.log(['score-watcher', type], text);

  plugin.route({method: 'GET', path: '/masters/events', handler: sseHandler(channels)});

  pg.connect(config.postgres.connectionString, (connectErr, client, done) => {
    if (connectErr) return next(connectErr);
  });

  // No lint errors for now
  const Master = null;
  const year = null;

  const updateBracket = (master, found, cb) => {
    const data = found.toJSON();
    const last = _.last(data.brackets);
    if (last === master) {
      log('debug', `Skipping master since it matches latest: ${master}`);
      return cb(null, last);
    }

    data.brackets.push(master);
    Master.update(found.key, data, (err, model) => {
      if (err) {
        log('error', `Error updating master: ${err}`);
      }
      else {
        log('debug', `Updated master: ${model.toJSON().brackets.length} to ${master}`);
      }
      cb(err, master);
    });
  };

  const createMaster = (master, cb) => {
    const model = Master.create({year, brackets: master ? [master] : []});
    model.save((err) => {
      if (err) {
        log('error', `Error creating master: ${err}`);
      }
      else {
        log('debug', `Created master: ${model.toString()}`);
      }
      cb(err, master);
    });
  };

  const updateOrCreate = (master, found, cb) => {
    if (found) {
      updateBracket(master, found, cb);
    }
    else {
      createMaster(master, cb);
    }
  };

  options.onSave = (master, cb) => {
    Master.findByIndex('year', year, (err, found) => {
      if (err) {
        log('error', `Error finding master by index: ${err}`);
        return cb(err);
      }

      updateOrCreate(master, found, (updateErr, newMaster) => {
        if (!updateErr && master) {
          channels.write({event: 'masters', data: {master: newMaster}});
        }
        cb(err);
      });
    });
  };

  const startWatcher = (err, master) => {
    options.master = master;
    if (options.start) {
      new ScoreWatcher(options).start();
    }
    next(err);
  };

  // To start the score watcher we need to make sure the db contains
  // a master model for this year and that it starts with an empty bracket
  Master.findByIndex('year', year, (err, model) => {
    if (err) {
      log('error', `Error finding master by index: ${err}`);
      return next(err);
    }
    else if (!model) {
      createMaster(null, startWatcher);
    }
    else {
      startWatcher(null, _.last(model.brackets));
    }
  });
};

exports.register.attributes = {
  name: `x-${packageInfo.name}-score-watcher`,
  version: packageInfo.version
};

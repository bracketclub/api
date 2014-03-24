var path = require('path');
var exec = require('child_process').exec;
var async = require('async');
var jsonUpdate = require('json-update');
var _ = require('lodash');


function Save(options) {
    options || (options = {});
    _.defaults(options, {
        sport: null,
        year: null,
        pushWait: null,
        maxWait: 1000 * 60 * 5,
        rootPath: path.resolve(__dirname, '..'),
        sitePath: path.resolve(__dirname, '..', '..', 'tweetyourbracket.com')
    });

    this.rootPath = options.rootPath;
    this.sitePath = options.sitePath;

    this.logger = options.logger || require('bucker').createNullLogger();
    this.jsonPath = path.resolve(__dirname, '..', 'data', options.sport, options.year + '.json');

    if (options.pushWait) {
        this.push = _.debounce(this._push.bind(this), options.pushWait, {
            leading: false,
            trailing: true,
            maxWait: options.maxWait
        });
    }
}

Save.prototype._push = function () {
    var self = this;
    async.waterfall([
        // Push data to git
        function (cb) {
            self.runCommand('git add data/*', self.rootPath, cb);
        },
        function (stdout, stderr, cb) {
            self.runCommand('git commit -n -m "Updating data"', self.rootPath, cb);
        },
        function (stdout, stderr, cb) {
            self.runCommand('git pull origin master', self.rootPath, cb);
        },
        function (stdout, stderr, cb) {
            self.runCommand('git push origin master', self.rootPath, cb);
        },

        // Check out dotcom site, build, update and push to prod
        function (stdout, stderr, cb) {
            self.runCommand('git checkout master', self.sitePath, cb);
        },
        function (stdout, stderr, cb) {
            self.runCommand('git pull origin master', self.sitePath, cb);
        },
        function (stdout, stderr, cb) {
            self.runCommand('npm run update-data', self.sitePath, cb);
        },
        function (stdout, stderr, cb) {
            self.runCommand('npm run build', self.sitePath, cb);
        },
        function (stdout, stderr, cb) {
            self.runCommand('npm run production', self.sitePath, cb);
        }
    ], function (err) {
        if (err) {
            self.logger.error(err.message);
        } else {
            self.logger.debug('Completed without errors');
        }
    });
};

Save.prototype.runCommand = function (cmd, cwd, cb) {
    this.logger.log(path.basename(cwd), '-', cmd);
    exec(cmd, {cwd: cwd, env: process.environment}, cb);
};

Save.prototype.loadJSON = function (cb) {
    jsonUpdate.load(this.jsonPath, function (err, obj) {
        if (err || !obj) obj = {};
        cb(obj);
    }.bind(this));
};

Save.prototype.entry = function (entry, cb) {
    this.loadJSON(function (obj) {
        if (!obj.entries) obj.entries = [];
        var existing = false;
        _.each(obj.entries, function (e, index, list) {
            if (e.user_id === entry.user_id) {
                list[index] = entry;
                existing = true;
            }
        });
        if (!existing) obj.entries.push(entry);
        this.logger.debug('ENTRY', entry.username);
        jsonUpdate.update(this.jsonPath, obj, function (err, obj) {
            if (!err && this.push) this.push();
            cb(err, obj, this.jsonPath);
        }.bind(this));
    }.bind(this));
};

Save.prototype.master = function (master, cb) {
    this.loadJSON(function (obj) {
        if (!obj.masters) obj.masters = [];
        var latest = _.last(obj.masters);
        if (latest !== master) obj.masters.push(master);
        this.logger.debug('MASTER', master);
        jsonUpdate.update(this.jsonPath, obj, function (err, obj) {
            if (!err && this.push) this.push();
            cb(err, obj, this.jsonPath);
        }.bind(this));
    }.bind(this));
};

module.exports = Save;

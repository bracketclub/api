var CronJob = require('cron').CronJob;
var save = require('./save');


new CronJob('0 */5 * * * *', function () {
    save.push();
}, null, true);
var dulcimer = require('dulcimer');
var moment = require('moment');
var path = require('path');


var TWITTER_TS = 'ddd MMM DD HH:mm:ss ZZ YYYY';
dulcimer.connect(path.resolve(__dirname, 'db'));


module.exports = {

    Entry: new dulcimer.Model({
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
                return moment(this.created, TWITTER_TS).format('YYYY');
            }
        },
        ms: {
            index: true,
            derive: function () {
                return moment(this.created, TWITTER_TS).valueOf();
            }
        }
    }, {name: 'entry'}),

    Master: new dulcimer.Model({
        year: {type: 'string', required: true, index: true},
        brackets: {}
    }, {name: 'master'})

};

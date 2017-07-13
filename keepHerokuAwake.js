/**
 * Created by monad on 2015. 8. 7..
 */
var CronJob = require('cron').CronJob;
var request = require('request');

const URL = 'http://www.campsitefinder.us/';
function keepAwake(url) {
  request.get(url, function(err, res, body) {
    if(err) return console.log(err);
    console.log('awaking!');
  });
}

var job = new CronJob({
  cronTime: '00 */15 * * * *', //every 15 minutes
  onTick: keepAwake.bind(null, URL),
  timeZone: 'America/Los_Angeles',
  start: true
});

keepAwake(URL);
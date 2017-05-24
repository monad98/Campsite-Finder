'use strict';

const bluebird = require('bluebird');
const request = bluebird.promisifyAll(require('request'), { multiArgs: true });
const cheerio = require('cheerio');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
const ses = require('nodemailer-ses-transport');
const Campground = require('../models/Campground');

// const clockwork = require('clockwork')({ key: process.env.CLOCKWORK_KEY });

function checkEmptySite(arrDate, dateObj, info) {
  //info: {contractCode, parkId, campingDate, lengthOfStay, lookingFor=2003}


  request.get('http://www.reserveamerica.com/camping/south-carlsbad-sb/r/campgroundDetails.do?contractCode=CA&parkId=120090#sr', function (err, res, body) {
    if(err) return console.log(err);
    var cookie = res.headers['set-cookie'][0].split(';')[0];
    // console.log(cookie);


    const j = request.jar();

    j.setCookie(request.cookie(cookie), 'http://www.reserveamerica.com');

    // var arrDate = 'Tue Nov 22 2016';
    // var arrDate2 = 'Mon Nov 21 2016';
    // var arrDate2 = 'Fri Nov 25 2016';

    var formData = {
      contractCode:'CA',
      parkId:120090,
      siteTypeFilter:'ALL',
      submitSiteForm:true,
      search:'site',
      campingDate:arrDate,
      lengthOfStay:1,
      currentMaximumWindow:12,
      contractDefaultMaxWindow: 'MS:24,LT:18,GA:24,SC:13,PA:24',
      stateDefaultMaxWindow:'MS:24,GA:24,SC:13,PA:24',
      defaultMaximumWindow:12,
      lookingFor:2003,
      camping_2003_3012:5
    };
    var options = {
      url: 'https://www.reserveamerica.com/camping/south-carlsbad-sb/r/campgroundDetails.do?',
      port: 80,
      qs: { contractCode:"CA", parkId: 120090 },
      method: 'POST',
      jar: j,
      form: formData
    };

    request(options, function (err, res, html) {
      if(err) console.log(err);
      else {
        // console.log(html);
        const $ = cheerio.load(html);
        var text = $('.matchSummary').text();
        // fs.writeFile("a.html", html);
        var available = +text.split(" ")[0];
        console.log(text);
        console.log("available camp site at "+ arrDate + ": " + available);
        if(available>0 && available<217 && previous !== available) {
          previous = available;
          sendEmailNew("South Carlsbad CAMPGROUND: " + available + " available" +
            " site on " + arrDate ,"http://www.reserveamerica.com/camping/south-carlsbad-sb/r/campgroundDetails.do?contractCode=CA&parkId=120090");
          console.log("South Carlsbad CAMPGROUND: " + available + " available" + " site on, " + arrDate);
          // dateObj[index] = true;
        }
      }
    });
  });
}




const findCampsite = function(req, res) {
  const body = req.body;
  console.log(body);
  // checkEmptySite();
  res.redirect('/');
};

const getCampsites = function(req, res, next) {
  const qs = req.query.qs;
  Campground.find({ name: { $regex: qs, $options: 'i'} }).exec()
    .then(campgrounds => res.json(campgrounds))
    .catch(err => next(err));
};



function sendEmailNew(title, link) {
  // login
  var transporter = nodemailer.createTransport(ses({
    region: 'us-west-2',
    accessKeyId: 'AKIAIQI2MMN64JWJZILQ',
    secretAccessKey: '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'
  }));

  // send mail
  transporter.sendMail({
    from: '"캠핑" <monad98@gmail.com>',
    to: 'monad98@gmail.com',
    subject: title,
    text: link + "<br>"
  }, function(error, response) {
    if (error) {
      console.log(error);
    } else {
      console.log('Message sent');
    }
  });
}





// const job = new CronJob({
//   cronTime: '00 */2 * * * *',
//   onTick: camp,
//   timeZone: 'America/Los_Angeles',
//   start: true
// });













module.exports = {
  findCampsite,
  getCampsites
}






/**
 * GET /api/clockwork
 * Clockwork SMS API example.
 */
// exports.getClockwork = (req, res) => {
//   res.render('api/clockwork', {
//     title: 'Clockwork SMS API'
//   });
// };

/**
 * POST /api/clockwork
 * Send a text message using Clockwork SMS
 */
// exports.postClockwork = (req, res, next) => {
//   const message = {
//     To: req.body.telephone,
//     From: 'Hackathon',
//     Content: 'Hello from the Hackathon Starter'
//   };
//   clockwork.sendSms(message, (err, responseData) => {
//     if (err) { return next(err.errDesc); }
//     req.flash('success', { msg: `Text sent to ${responseData.responses[0].to}` });
//     res.redirect('/api/clockwork');
//   });
// };
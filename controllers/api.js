'use strict';

const bluebird = require('bluebird');
const request = bluebird.promisifyAll(require('request'), { multiArgs: true });
const cheerio = require('cheerio');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
const ses = require('nodemailer-ses-transport');
const CampingCronjob = require('../models/campingCronjob');
const Campground = require('../models/campground');
const clockwork = require('clockwork')({ key: process.env.CLOCKWORK_KEY });


const findCampsite = function(req, res, next) {
  req.checkBody('email', 'Email is not valid').optional().isEmail();
  req.checkBody('campingDate', 'Start Date is not valid').isDate();
  req.checkBody('campingDate', 'Start Date can not be the past').isAfter();
  req.checkBody('lengthOfStay', 'Length of Stay should be a number').isNumeric();
  if(req.body['phone']) req.checkBody('phone', 'Mobile number is not valid').optional().isMobilePhone('en-US');
  if(req.body['email']) req.sanitizeBody('email').normalizeEmail({ remove_dots: false });
  req.sanitizeBody('campGround').trim();

  const errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/');
  }

  const body = req.body;
  body.user = req.user._id;
  Campground.findOne({name: body.campground}).exec()
    .then(campground => {
      body.campground = campground;
      body.method = body.phone ? 'SMS' : 'Email';
      const newCampingCronjob = new CampingCronjob(body);
      newCampingCronjob.save()
        .then(() => res.redirect('/saved'));
    })
    .catch(err => next(err));
};

const getCampsites = function(req, res, next) {
  const qs = req.query.qs;
  Campground.find({ name: { $regex: qs, $options: 'i'} }).exec()
    .then(campgrounds => res.json(campgrounds))
    .catch(err => next(err));
};

const deleteCronJob = function (req, res, next) {
  const _id = req.params.id;
  CampingCronjob.remove({ _id })
    .then(() => res.status(204).end())
    .catch(err => next(err));
};



function sendEmail(title, link) {
  // login
  const transporter = nodemailer.createTransport(ses({
    region: 'us-west-2',
    accessKeyId: process.env.AMAZON_ACCESS_KEY_ID,
    secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY
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


function postClockwork () {
  const message = {
    To: req.body.telephone,
    From: 'Hackathon',
    Content: 'Hello from the Hackathon Starter'
  };
  clockwork.sendSms(message, (err, responseData) => {
    if (err) { return next(err.errDesc); }
    req.flash('success', { msg: `Text sent to ${responseData.responses[0].to}` });
    res.redirect('/api/clockwork');
  });
};

function checkEmptySite(arrDate, dateObj, info) {

  request.get('http://www.reserveamerica.com/camping/south-carlsbad-sb/r/campgroundDetails.do?contractCode=CA&parkId=120090#sr', function (err, res, body) {
    if(err) return console.log(err);
    const cookie = res.headers['set-cookie'][0].split(';')[0];
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
          // previous = available;
          sendEmail("South Carlsbad CAMPGROUND: " + available + " available" +
            " site on " + arrDate ,"http://www.reserveamerica.com/camping/south-carlsbad-sb/r/campgroundDetails.do?contractCode=CA&parkId=120090");
          console.log("South Carlsbad CAMPGROUND: " + available + " available" + " site on, " + arrDate);
          // dateObj[index] = true;
        }
      }
    });
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
  getCampsites,
  deleteCronJob
};






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

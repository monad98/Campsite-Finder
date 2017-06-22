const bluebird = require('bluebird');
const CronJob = require('cron').CronJob;
const request = require('request');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
const ses = require('nodemailer-ses-transport');
const clockwork = require('clockwork')({ key: process.env.CLOCKWORK_KEY });
const CampingCronjob = require('../models/campingCronjob');
const moment = require('moment');
const pug = require('pug');
const path = require('path');
const compileMessage = pug.compileFile(path.join(__dirname, 'email-template.pug'));
const BASEURL = `https://www.reserveamerica.com/camping`;

const pullJobsFromMongodb = () => {
  const today = moment().startOf('day');
  const dayAfterTomorrow = moment(today).add(2, 'days');
  const fiveMinsAgo = moment().subtract(5, 'minutes');
  const twoHoursAgo = moment().subtract(2, 'hours');
  CampingCronjob.find({
    campingDate: {
      $gt: dayAfterTomorrow.toDate(),
    },
    $or: [
      {$and: [
        {updatedAt: {$lt: fiveMinsAgo.toDate()}}, //checked more than 5 minutes ago
        {hadEmptySites: false} // and at that time there was no empty site.
      ]},
      {$and: [
        {updatedAt: {$lt: twoHoursAgo.toDate()}}, //checked more than 2 hours ago
        {hadEmptySites: true} // and at that time there was empty sites.
      ]}
    ]
  })
    .populate('campground', 'name lName state code')
    .lean()
    .exec()
    .then(jobs => {
      jobs.forEach(job => {
        checkEmptySite(job);
      });
    });


};

const checkEmptySite = ({_id, campground, campingDate, lengthOfStay, email, phone, type}) => {
  const url = `https://www.reserveamerica.com/camping/${campground.lName}/r/campgroundDetails.do?contractCode=${campground.code}&parkId=${campground._id}`;

  request.get(url, function (err, res, body) {
    if(err) return console.log(err);
    const sessionId = res.headers['set-cookie'][0].split(';')[0];
    const j = request.jar();

    j.setCookie(request.cookie(sessionId), url);

    const formData = {
      contractCode: campground.code,
      parkId: campground._id,
      siteTypeFilter:'ALL',
      submitSiteForm:true,
      search:'site',
      campingDate: campingDate.toString().split(' ').splice(0,4).join(' '),
      lengthOfStay: lengthOfStay,
      currentMaximumWindow:12,
      contractDefaultMaxWindow: 'MS:24,LT:18,GA:24,SC:13,PA:24',
      stateDefaultMaxWindow:'MS:24,GA:24,SC:13,PA:24',
      defaultMaximumWindow:12,
      camping_2003_3012:5
    };
    if(type) formData.lookingFor = type;

    const options = {
      url: url,
      method: 'POST',
      jar: j,
      form: formData
    };
    request(options, function (err, res, html) {
      if(err) return console.log(err);
      const $ = cheerio.load(html);
      const text = $('.matchSummary').text();
      const numOfavailable = +text.split(" ")[0]; // number of available empty site
      let availableLinks, available = [];
      if(numOfavailable) {
        availableLinks = $('table tbody tr td a.now'); // anchor tags of avaiable sites
        availableLinks.each(function(idx) {
          if(idx < 5) { // don't parse more than five campsite. Empty sites are enough, so user don't need to use this app.
            const tdElems = $(this).parent().parent().children();
            const siteNumber = tdElems.eq(0).children().last().children().first().html();
            const type = tdElems.eq(2).html();
            let accessible = false;
            let max = tdElems.eq(3).html();
            if(max.length > 10) {
              max = max.split('<')[0];
              accessible = true;
            }
            const link = BASEURL + $(this).attr('href') + '&arvdate=' + moment(campingDate).format('MM/DD/YYYY');
            available.push({siteNumber, type, max, link, accessible});
          }
        });
        const cancel = `${process.env.WEBSITE_URL}/api/cancel/${campground._id}`;

        const title = `Campsite Finder - ${numOfavailable} campsite(s) available at ${campground.name}`;
        //USER chose to get notified by email
        if(email) sendEmail(title, composeMessage(campground, available, cancel, campingDate), email)
          .then(() => {
            updateHadEmptyCampSites(_id);
          });

        else sendSMS(title, phone, BASEURL + available[0].link)
          .then(() => {
            updateHadEmptyCampSites(_id);
          })

      } else {
        //just update updatedAt time.
        updateUpdatedAt(_id);
      }

    });
  });
};

const composeMessage = (campground, available, cancel, campingDate) => {
  // html body for email
  return compileMessage({campground, available, cancel, campingDate});
};


function sendSMS (title, phone, link) {
  const message = {
    To: '1' + phone,
    From: 'Campsite',
    Content: `${title} Link: ${link}`
  };
  return new Promise((resolve, reject) => {
    clockwork.sendSms(message, (err, responseData) => {
      if (err) {
        reject(err);
      }
      resolve(responseData);
    });
  });
}

const sendEmail = (title, message, to) => {
  const transporter = nodemailer.createTransport({
    service: 'Mailgun',
    auth: {
      user: [process.env.MAILGUN_USER],
      pass: [process.env.MAILGUN_PASSWORD]
    }
  });

  // send mail
  return new Promise((resolve, reject) => {
    transporter.sendMail({
      from: `"CAMPSITE FINDER" <admin@campsitefinder.us>`,
      to,
      subject: title,
      html: message
    }, function(error) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const updateHadEmptyCampSites = (_id) => {
  CampingCronjob.findByIdAndUpdate(_id, { $set: {hadEmptySites: true}})
    .lean()
    .then(() => {})
    .catch(err => console.log(err));
};

const updateUpdatedAt = (_id) => {
  CampingCronjob.findByIdAndUpdate(_id, { $set: {updatedAt: new Date()}})
    .lean()
    .then(() => {})
    .catch(err => console.log(err));
};


const job = new CronJob({
  // cronTime: '*/10 * * * * *',
  cronTime: '*/20 * * * * *',
  onTick: pullJobsFromMongodb,
  timeZone: 'America/Los_Angeles',
  start: true
});
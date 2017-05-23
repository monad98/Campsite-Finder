'use strict';

const bluebird = require('bluebird');
const request = bluebird.promisifyAll(require('request'), { multiArgs: true });
const cheerio = require('cheerio');
// const clockwork = require('clockwork')({ key: process.env.CLOCKWORK_KEY });



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
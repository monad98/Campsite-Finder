'use strict';

const CampingCronjob = require('../models/campingCronjob');
const Campground = require('../models/campground');
const moment = require('moment');


const findCampsite = function(req, res, next) {
  if(req.body.phone) req.body.phone = req.body.phone.split('-').join('');
  req.checkBody('campground', 'Campground can not be empty.').notEmpty();
  req.checkBody('email', 'Email is not valid').optional().isEmail();
  req.checkBody('campingDate', 'Start Date is not valid').isDate();
  req.checkBody('campingDate', 'Start Date can not be the past').isAfter();
  req.checkBody('lengthOfStay', 'Length of Stay should be a number').isNumeric();
  req.checkBody('phone', 'Mobile number is not valid').optional().isMobilePhone('en-US');
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
      body.campingDate = moment(body.campingDate, 'ddd MMM DD YYYY').toDate();
      if(body.phone) body.phone = body.phone.split('-').join();
      if(!+body.type) delete body.type;
      const newCampingCronjob = new CampingCronjob(body);
      newCampingCronjob.save()
        .then(() => res.redirect('/saved'));
    })
    .catch(err => next(err));
};

const getCampsites = function(req, res, next) {
  const qs = req.query.qs;
  Campground.find({ name: { $regex: qs, $options: 'i'} })
    .limit(20)
    .exec()
    .then(campgrounds => res.json(campgrounds))
    .catch(err => next(err));
};

const deleteCronJob = function (req, res, next) {
  const _id = req.params.id;
  CampingCronjob.remove({ _id })
    .then(() => res.status(204).json({result: 'Not you will not receive a notification'}))
    .catch(err => next(err));
};

const deleteCronJobFromEmail = function (req, res, next) {
  const _id = req.params.id;
  CampingCronjob.remove({ _id })
    .then(() => res.render('stop-notification'))
    .catch(err => next(err));
};

module.exports = {
  findCampsite,
  getCampsites,
  deleteCronJob,
  deleteCronJobFromEmail
};
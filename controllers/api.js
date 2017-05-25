'use strict';

const CampingCronjob = require('../models/campingCronjob');
const Campground = require('../models/campground');
const moment = require('moment');


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
      body.campingDate = moment(body.campingDate).toDate();
      if(!+body.type) delete body.type;
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
    .then(() => res.status(204).json({result: 'Not you will not receive a notification'}))
    .catch(err => next(err));
};

module.exports = {
  findCampsite,
  getCampsites,
  deleteCronJob
};


var xxx =[{name: 'Any Camping Site', value: 0}, { name: 'RV Sites', value: 2001}, {name: 'Trailer', value: 2002}, {name: 'Tent', value: 2003}, {name: 'Cabins or Lodgings', value: 10001}, {name: 'Group' + ' Sites', value: 9002}, {name: 'Day' + ' use', value: 9001}, {name: 'Horse sites', value: 3001}, {name: 'Boat sites', value: 2004}]
var bbb = xxx.reduce((acc, elem) => {
  acc[elem.value] = elem.name;
  return acc;
}, {});
console.log(JSON.stringify(bbb))


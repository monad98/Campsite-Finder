const CampingCronjob = require('../models/campingCronjob');
const moment = require('moment');

/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  res.render('home', {
    title: 'Campsite Finder', dayAfterTomorrow: moment().startOf('day').add(2, 'days').toDate()
  });
};

/**
 * GET /account
 * Saved requests page.
 */
exports.savedRequestsPage = (req, res) => {
  const userId = req.user._id;

  CampingCronjob.find({user: userId}, {user: 0})
    .populate({ path: 'campground', select: 'name state'})
    .lean()
    .exec()
    .then(jobs => {
      res.render('saved-request', {
        title: 'Saved Requests',
        jobs
      });


    });



};


const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const User = require('./user');
const campingCronjobSchema = new mongoose.Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required:true,
    index: true
  },
  campground: {
    type: Number,
    ref: 'Campground',
    required: true
  },
  campingDate: {
    type: Date,
    required: true
  },
  lengthOfStay: {
    type: Number,
    required: true
  },
  type: {
    type: Number
  },
  method: {
    type: String,
    enum: ['SMS', 'Email'],
    default: 'Email'
  },
  email: String,
  phone: String,
  scrapeFreq: { //we don't use this
    type: Number,
    default: 300000 //5 minutes
  },
  hadEmptySites: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

const CampingCronjob = mongoose.model('CampingCronjob', campingCronjobSchema);

module.exports = CampingCronjob;

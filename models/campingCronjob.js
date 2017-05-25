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
    type: String,
    required: true
  },
  lengthOfStay: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['SMS', 'Email'],
    default: 'Email'
  },
  email: String,
  phone: String,
  scrapeFreq: {
    type: Number,
    default: 300000 //5 minutes
  }

}, { timestamps: true });

const CampingCronjob = mongoose.model('CampingCronjob', campingCronjobSchema);

module.exports = CampingCronjob;

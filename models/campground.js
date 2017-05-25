const mongoose = require('mongoose');

const campgroundSchema = new mongoose.Schema({
  _id: {type: Number, unique: true},
  name: {type: String, index: true},
  lName: String,
  // parkId: Number,
  state: String,
  code: String,
  desc: String
}, { timestamps: false });

const Campground = mongoose.model('Campground', campgroundSchema);

module.exports = Campground;

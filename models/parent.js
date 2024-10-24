const mongoose = require("mongoose");

const parentSchema = new mongoose.Schema({
  parentName: {
    type: String,
    required: true,
    trim: true,
  },
  school: {
    type: String,
    required: true,
    trim: true,
  },
  classNum: {    // currently i am assuming that we are taking class and section as input from parent (we can also extract this info from ID card)
    type: String,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
  schoolIdCard: {
    type: String,
    required: true,
  },
  address: {
    societyCommunity: {
      type: String,
      required: false,
      trim: true,
    },
    city: {
      type: String,
      required: false,
      trim: true,
    },
    state: {
      type: String,
      required: false,
      trim: true,
    },
    country: {
      type: String,
      required: false,
      trim: true,
    },
    zipCode: {
      type: String,
      required: false,
      trim: true,
    },
  },
  createdOn: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedOn: {
    type: Date,
    default: Date.now,
    immutable: false,
  },
});

parentSchema.pre('save', function(next) {
  this.updatedOn = Date.now();
  next();
});

module.exports = mongoose.model('Parent', parentSchema);

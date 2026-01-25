const mongoose = require('mongoose');

// we need mongoose schema
const userAnalyticsSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  totalApplications: {
    type: Number,
    required: true,
  },

  totalActiveApplications: { // active applications : stage = [applied, hr screen, hr interview, technical interview, job offer]
    type: Number,
    required: true,
  },

  avgResponseDays: {
    type: Number,
    required: true,
  },

    byStage: {
    type: Map,
    required: true,
  },

  bySource: {
    type: Map,
    required: true,
  },
},
  { timestamps: true }
);


// then we register the model with mongoose
const UserAnalytics = mongoose.model('UserAnalytics', userAnalyticsSchema);

// export the model
module.exports = UserAnalytics;

const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  companyName: {
    type: String,
    required: true,
  },

  roleTitle: {
    type: String,
    required: true,
  },

  jobSource: {
    type: String,
    enum: ['LinkedIn', 'Job Board', 'Company Website', 'Referral', 'Social Media', 'Recruitment Agency', 'Career Fair', 'Cold Application'],
    required: true,
  },

  jobUrl: {
    type: String,
  },

  stage: {
    type: String,
    enum: ['Applied', 'HR Screen', 'HR Interview', 'Technical Interview', 'Job Offer', 'Accepted', 'Rejected'],
    default: 'Applied',
  },

  appliedDate: {
    type: Date,
    required: true,
    defualt: Date.now,
  },

  lastStageChangeAt: {
    type: Date,
  },

  hrScreenDate: {
    type: Date,
  },

  nextActionDate: {
    type: Date,
    required: function(){return this.stage != 'Applied' && this.stage !== 'Rejected' }, // only required when stage changes
  },

  nextActionType: {
    type: String,
    enum: ['Follow-up Email', 'Follow-up Call', 'Scheduele Meeting', 'Upcoming Interview', 'Upcoming Assessment', 'Document Submission','Thank-You Note', 'Waiting Response', 'Micellaneous Reminder'],
    required: function(){return this.stage != 'Applied' && this.stage !== 'Rejected' },
  },

  nextActionNote: {
    type: String,
  },

  rejectedReason:{
    type: String,
    enum: ['Role Filled', 'Lack of Experience', 'Skill Mismatch', 'Failed Assesment', 'Failed Interview', 'Salary Mismatch','Culture Fit', 'Overqualified', 'Internal Candidate', 'No Response', 'Other'],
    required: function(){return this.stage === 'Rejected'},
  },

  rejectedStage:{
    type: String,
    required: function(){return this.rejectedReason != null || this.rejectedReason != undefined}, // captured from stage before change
  },

  notes:{
    type: String,
  },

},
  { timestamps: true }
)

// then we register the model with mongoose
const Application = mongoose.model('Application', applicationSchema)

// export the model
module.exports = Application


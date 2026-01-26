const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');

// Controllers
const authCtrl = require('./controllers/auth') 
const applicationCtrl = require('./controllers/application')
const UserAnalyticsCtrl = require('./controllers/userAnalytics')

// Middleware 
const isSignedIn = require('./middleware/isSignedIn')


mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

app.use(cors());
app.use(express.json());
app.use(logger('dev'));

// ---------- PUBLIC ROUTES ----------
app.use('/auth', authCtrl) 

// ---------- PROTECTED ROUTES ----------
app.use(isSignedIn)
app.use('/applications', applicationCtrl)
app.use('/useranalytics', UserAnalyticsCtrl)

app.listen(process.env.PORT || 3000, () => {
  console.log('The express app is ready!');
});

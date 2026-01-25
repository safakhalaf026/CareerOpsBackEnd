const express = require('express')
const router = express.Router()
const Application = require('../models/Application')

// defining vars
activeStage = ['Applied','HR Screen','HR Interview','Technical Interview','Job Offer']
completedStage = ['Accepted','Rejected']

router.post('/', async(req,res)=>{
    try {
        const applicationData = {
            ...req.body,
            user: req.user._id
        }
        const application  = await Application.create(applicationData)
        return res.status(201).json(({application}))
    } catch (error) {
        console.error(error)
        return res.status(500).json({ err: 'Failed to create application' })
    }
})
router.get('/', async(req,res)=>{
    try {
        const applications = await Application.find().populate('user')
        return res.status(201).json(({applications}))
    } catch (error) {
        console.error(error)
        return res.status(500).json({ err: 'Failed to fetch application data' })
    }
})
module.exports = router;
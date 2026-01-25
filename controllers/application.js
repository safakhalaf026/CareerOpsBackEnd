const express = require('express')
const router = express.Router()
const Application = require('../models/Application')

// defining vars
activeStage = ['applied', 'hr screen', 'hr interview', 'technical interview', 'job offer']
completedStage = ['accepted','rejected']

router.post('/', async(req,res)=>{
    try {
        const applicationData = {
            ...req.body,
            user: req.user._id
        }
        const application  = await Application.create(applicationData)
        return res.status(201).json({application})
    } catch (error) {
        console.error(error)
        return res.status(500).json({ err: 'Failed to create application' })
    }
})

router.get('/', async(req,res)=>{
    try {
        const status = req.query.status?.toLowerCase()
        const stage = req.query.stage?.toLowerCase()
        const jobSource = req.query.source?.toLowerCase()

        // all of the user's applications
        const filter={user: req.user._id}

        // status filter (active/completed)
        if (status === 'active'){
            filter.stage = { $in: activeStage.map(s => new RegExp(`^${s}$`, 'i')) }
        }

        if (status === 'completed'){
            filter.stage = { $in: completedStage.map(s => new RegExp(`^${s}$`, 'i')) }
        }

        // specific stage filter 
        if (stage){
            filter.stage = { $regex: `^${stage}$`, $options: 'i' }
        }

        // specific source filter
        if (jobSource){
            filter.jobSource =  { $regex: `^${jobSource}$`, $options: 'i' }
        }

        const applications = await Application.find(filter).populate('user').sort({createdAt: -1})
        return res.status(201).json({applications})
    } catch (error) {
        console.error(error)
        return res.status(500).json({ err: 'Failed to fetch application data' })
    }
})

router.get('/:applicationId', async(req,res)=>{
    try {
        const {applicationId}= req.params
        const application = await Application.findById(applicationId).populate('user')
        if (!application){
            return res.status(404).json({err: 'Application Not Found'})
        }else{
            return res.status(201).json({application})
        }
        
    } catch (error) {
        console.error(error)
        return res.status(500).json({ err: 'Failed to fetch application data' })
    }
})

router.delete('/:applicationId', async(req,res)=>{
    try {
        const {applicationId}= req.params
        const findApplication = await Application.findById(applicationId)
        if (!findApplication){
            return res.status(404).json({err: 'Application Not Found'})
        }
        const applicationOwner = String(findApplication.user)
        if(applicationOwner !== req.user._id){
            return res.status(403).json({ err: 'Only application creator can delete applications' })
        }
        const application = await Application.findByIdAndDelete(applicationId)
        return res.status(200).json({application})
        
    } catch (error) {
        console.error(error)
        return res.status(500).json({ err: 'Failed to fetch application data' })
    }
})
module.exports = router;
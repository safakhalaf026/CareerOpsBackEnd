const express = require('express')
const router = express.Router()
const Application = require('../models/Application')
const Analytics = require('../models/UserAnalytics')
const mongoose = require('mongoose')

const activeStage = ['Applied','HR Screen','HR Interview','Technical Interview','Job Offer']
const stageOrder = ['Applied','HR Screen','HR Interview','Technical Interview','Job Offer','Accepted','Rejected']

router.get('/summary', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id)
    const today = new Date() // create date object using user local time (server OS)
    today.setHours(0,0,0,0) // (hours, minutes, seconds, milliseconds), sets day to midnight

    // total applications
    const totalApplications = await Application.countDocuments({ user: userId })

// ======================================================================================================================================================================================

    // total active applications
    const totalActiveApplications = await Application.countDocuments({ 
      user: userId, // retrieves documents where userID in DB matches logged in user
      stage: { $in: activeStage } // and documents that are in the pre-defined active stage
    })

// ======================================================================================================================================================================================

    // avg response days from 'Applied' to 'HR Screen'
    const avgAgg = await Application.aggregate([ // .aggregate rturns an array
      { $match: { user: userId, hrScreenDate: { $ne: null } } }, // filter documents that belong only to the user AND where the hrScreenDate exists
      {
        $project: { // reshape document to only inculde diffDays
          diffDays: { // create a $project object (diffDays{})
            $divide: [ // to convert day difference to days NOT milliseconds 
              { $subtract: ['$hrScreenDate', '$appliedDate'] }, // subtracting two dates > returns difference in milliseconds
              1000 * 60 * 60 * 24 // milliseconds in one day 
            ]
          }
        }
      },
      { $group: { _id: null, avgResponseDays: { $avg: '$diffDays' } } } // nullifying id means all docs in one GROUP, then calc avg using $avg
    ])
    const avgResponseDays = avgAgg[0]?.avgResponseDays ?? 0 // return 0 if no HR screen dates exist

// ======================================================================================================================================================================================

    // upcoming next actions count
    const upcomingNextActions = await Application.countDocuments({
      user: userId,
      stage: { $in: activeStage },
      nextActionDate: { $ne: null, $gte: today } // count active applications with an action date that is greater than or equal to the recorded date 
    })

// ======================================================================================================================================================================================

    // active applications by stage (vertical bar)
    const activeByStageAgg = await Application.aggregate([
      { $match: { user: userId, stage: { $in: activeStage } } }, // filter documents that belong only to the user AND are in the active stage
      { $group: { _id: '$stage', count: { $sum: 1 } } } // groups by stage and counts number of application for each stage
    ])

    const activeByStageLabels = activeStage // labels for JS frontend
    const activeByStageMap = Object.fromEntries(activeByStageAgg.map(x => [x._id, x.count])) // refromats aggregated result into an object format 
    const activeByStageData = activeByStageLabels.map(s => activeByStageMap[s] ?? 0) // builds an array of counts in the same order as activeStage

// ======================================================================================================================================================================================

    // all applications by source (pie)
    const bySourceAgg = await Application.aggregate([
      { $match: { user: userId, jobSource: { $ne: null } } },
      { $group: { _id: '$jobSource', count: { $sum: 1 } } }// groups by jobSource and counts number of application for each source
    ])
    const bySourceLabels = bySourceAgg.map(x => x._id)
    const bySourceMap = Object.fromEntries(bySourceAgg.map(x => [x._id, x.count]))
    const bySourceData = bySourceAgg.map(x => x.count)

// ======================================================================================================================================================================================

    // rejection reasons (horizontal bar)
    const rejectionAgg = await Application.aggregate([
      { $match: { user: userId, stage: 'Rejected', rejectedReason: { $ne: null } } }, // filter applications that belong to the user WHERE the stage === rejected and the reason is NOT null
      { $group: { _id: '$rejectedReason', count: { $sum: 1 } } }, // group those reasons and count them 
      { $sort: { count: -1 } } // in descending order so highest count comes first
    ])
    const rejectionLabels = rejectionAgg.map(x => x._id)
    const rejectionData = rejectionAgg.map(x => x.count)

// ======================================================================================================================================================================================

    // stage vs source (stacked area)
    const stageVsSourceAgg = await Application.aggregate([
      { $match: { user: userId } },
      {
        $group: { // each unique (stage,source) = one group > then count each group
          _id: { stage: '$stage', source: '$jobSource' },
          count: { $sum: 1 }
        }
      }
    ])

    // define job sources (not from DB so it automatically excludes empty job sources)
    const sources = [...new Set(stageVsSourceAgg.map(x => x._id.source).filter(Boolean))]

    // build lookup object
    const lookup = {}
    for (const s of sources) lookup[s] = {}
    for (const row of stageVsSourceAgg) {
      lookup[row._id.source][row._id.stage] = row.count
    }

    const stageVsSourceLabels = stageOrder
    const stageVsSourceDatasets = sources.map(source => ({
      label: source,
      data: stageVsSourceLabels.map(stage => lookup[source][stage] ?? 0)
    }))

    const analyticsPayload = {
      user: userId,
      totalApplications,
      totalActiveApplications,
      avgResponseDays: Number(avgResponseDays.toFixed(1)),
      byStage: activeByStageMap,
      bySource: bySourceMap
    }

    await Analytics.findOneAndUpdate(
      { user: userId },
      analyticsPayload,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )

// ======================================================================================================================================================================================

    // formatted payload for chart.js
    return res.json({
      kpis: {
        totalApplications,
        totalActiveApplications,
        avgResponseDays: Number(avgResponseDays.toFixed(1)),
        upcomingNextActions
      },
      charts: {
        activeByStage: {
          labels: activeByStageLabels,
          datasets: [{ label: 'Active Applications', data: activeByStageData }]
        },
        bySourcePie: {
          labels: bySourceLabels,
          datasets: [{ label: 'Applications', data: bySourceData }]
        },
        rejectionReasonsHorizontal: {
          labels: rejectionLabels,
          datasets: [{ label: 'Rejections', data: rejectionData }]
        },
        stageVsSourceStackedArea: {
          labels: stageVsSourceLabels,
          datasets: stageVsSourceDatasets
        }
      }
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ err: 'Failed to build analytics summary' })
  }
})
module.exports = router
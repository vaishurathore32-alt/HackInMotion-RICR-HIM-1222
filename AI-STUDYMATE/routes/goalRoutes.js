const express = require("express");

const StudyGoal = require("../models/StudyGoal");
const StudyPlan = require("../models/StudyPlan");

const {
    generateStudyPlan
} = require("../services/aiPlanner");

const router = express.Router();


// CREATE GOAL + GENERATE AI PLAN
router.post("/", async (req, res) => {

    try {

        const {
            userId = "demo-user",
            subject,
            examGoal,
            deadline,
            hoursPerDay,
            daysPerWeek,
            currentKnowledgeLevel,
            weakTopics = []
        } = req.body;


        if (
            !subject ||
            !examGoal ||
            !deadline ||
            !hoursPerDay ||
            !daysPerWeek
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }


        const goal = await StudyGoal.create({

            userId,

            subject,

            examGoal,

            deadline,

            hoursPerDay,

            daysPerWeek,

            currentKnowledgeLevel,

            weakTopics
        });


        console.log("🧠 Generating AI study plan...");


        const aiPlan = await generateStudyPlan(goal);


        const sessions = aiPlan.sessions.map(session => ({

            dayNumber: session.dayNumber,

            date: new Date(session.date),

            topic: session.topic,

            duration: session.duration,

            activity: session.activity,

            priority: session.priority,

            type: session.type,

            completed: false

        }));


        const plan = await StudyPlan.create({

            userId,

            goalId: goal._id,

            title: `${subject} AI Study Plan`,

            sessions,

            aiSummary: aiPlan.summary

        });


        res.status(201).json({

            success: true,

            message: "AI study plan created",

            goal,

            plan

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: "Failed to create study plan",

            error: error.message

        });

    }

});


module.exports = router;
const express = require("express");

const StudyPlan = require("../models/StudyPlan");

const router = express.Router();


// GET USER'S PLAN
router.get("/:userId", async (req, res) => {

    try {

        const plan = await StudyPlan.findOne({
            userId: req.params.userId
        })
        .populate("goalId");


        if (!plan) {

            return res.status(404).json({

                success: false,

                message: "No study plan found"

            });

        }


        res.json({

            success: true,

            plan

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

});


// GET TODAY'S PLAN
router.get("/:userId/today", async (req, res) => {

    try {

        const plan = await StudyPlan.findOne({

            userId: req.params.userId

        });


        if (!plan) {

            return res.status(404).json({

                success: false,

                message: "Plan not found"

            });

        }


        const today = new Date();

        const todayStart = new Date(today);

        todayStart.setHours(0, 0, 0, 0);


        const tomorrow = new Date(todayStart);

        tomorrow.setDate(tomorrow.getDate() + 1);


        const sessions = plan.sessions.filter(session => {

            const sessionDate = new Date(session.date);

            return (
                sessionDate >= todayStart &&
                sessionDate < tomorrow
            );

        });


        const totalMinutes = sessions.reduce(

            (total, session) =>
                total + session.duration,

            0

        );


        const completedMinutes = sessions
            .filter(session => session.completed)
            .reduce(
                (total, session) =>
                    total + session.duration,
                0
            );


        res.json({

            success: true,

            date: today,

            totalMinutes,

            completedMinutes,

            sessions

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

});


module.exports = router;
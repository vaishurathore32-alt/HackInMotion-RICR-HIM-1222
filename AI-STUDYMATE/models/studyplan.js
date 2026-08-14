const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
    {
        dayNumber: {
            type: Number,
            required: true
        },

        date: {
            type: Date,
            required: true
        },

        topic: {
            type: String,
            required: true
        },

        duration: {
            type: Number,
            required: true
        },

        activity: {
            type: String,
            required: true
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },

        type: {
            type: String,
            enum: [
                "learning",
                "practice",
                "revision",
                "quiz"
            ],
            default: "learning"
        },

        completed: {
            type: Boolean,
            default: false
        },

        completedAt: {
            type: Date,
            default: null
        }
    }
);

const studyPlanSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            default: "demo-user",
            index: true
        },

        goalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudyGoal",
            required: true
        },

        title: {
            type: String,
            default: "AI Study Plan"
        },

        sessions: {
            type: [sessionSchema],
            default: []
        },

        aiSummary: {
            type: String,
            default: ""
        },

        adaptiveUpdates: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("StudyPlan", studyPlanSchema);
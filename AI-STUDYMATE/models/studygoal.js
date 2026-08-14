const mongoose = require("mongoose");

const studyGoalSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            default: "demo-user",
            index: true
        },

        subject: {
            type: String,
            required: true,
            trim: true
        },

        examGoal: {
            type: String,
            required: true,
            trim: true
        },

        deadline: {
            type: Date,
            required: true
        },

        hoursPerDay: {
            type: Number,
            required: true,
            min: 0.5,
            max: 24
        },

        daysPerWeek: {
            type: Number,
            required: true,
            min: 1,
            max: 7
        },

        currentKnowledgeLevel: {
            type: String,
            enum: [
                "beginner",
                "basic",
                "intermediate",
                "advanced"
            ],
            default: "beginner"
        },

        weakTopics: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("StudyGoal", studyGoalSchema);
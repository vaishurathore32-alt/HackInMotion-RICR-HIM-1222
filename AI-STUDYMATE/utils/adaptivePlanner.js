const {
    analyzeQuizPerformance,
    generateStudyPlan
} = require("../services/aiPlanner");


async function createAdaptivePlan(goal, quizResults) {

    // Step 1: Analyze quiz performance using AI
    const analysis =
        await analyzeQuizPerformance(quizResults);


    // Step 2: Add newly detected weak topics
    const existingWeakTopics =
        goal.weakTopics || [];


    const updatedWeakTopics = [
        ...new Set([
            ...existingWeakTopics,
            ...analysis.weakTopics
        ])
    ];


    // Step 3: Update goal
    goal.weakTopics =
        updatedWeakTopics;


    await goal.save();


    // Step 4: Generate a new AI plan
    const newAIPlan =
        await generateStudyPlan(goal);


    // Step 5: Return everything
    return {
        analysis,
        updatedWeakTopics,
        newAIPlan
    };
}


module.exports = {
    createAdaptivePlan
};
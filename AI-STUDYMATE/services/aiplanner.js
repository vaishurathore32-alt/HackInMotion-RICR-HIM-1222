const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function generateStudyPlan(goal) {

    const prompt = `
You are an expert AI study planner.

Create a personalized study plan for a student.

Student information:

Subject:
${goal.subject}

Exam / Learning Goal:
${goal.examGoal}

Deadline:
${goal.deadline}

Hours available per day:
${goal.hoursPerDay}

Days available per week:
${goal.daysPerWeek}

Current knowledge level:
${goal.currentKnowledgeLevel}

Weak topics:
${goal.weakTopics.length
    ? goal.weakTopics.join(", ")
    : "No specific weak topics provided"}

Rules:

1. Create a realistic plan.
2. Do not exceed the student's available hours per day.
3. Focus more time on weak topics.
4. Include learning sessions.
5. Include practice sessions.
6. Include revision sessions.
7. Include quizzes.
8. Add higher priority to weak topics.
9. Spread revision throughout the plan.
10. Make the plan achievable before the deadline.
11. Each session should have a duration in minutes.
12. Use dates starting from today.
13. Return ONLY valid JSON.

JSON format:

{
    "summary": "short explanation",
    "sessions": [
        {
            "dayNumber": 1,
            "date": "YYYY-MM-DD",
            "topic": "topic",
            "duration": 45,
            "activity": "what student should do",
            "priority": "high",
            "type": "learning"
        }
    ]
}

Allowed priority values:

low
medium
high

Allowed type values:

learning
practice
revision
quiz
`;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",

        contents: prompt,

        config: {
            responseMimeType: "application/json",

            responseSchema: {
                type: "object",

                properties: {
                    summary: {
                        type: "string"
                    },

                    sessions: {
                        type: "array",

                        items: {
                            type: "object",

                            properties: {
                                dayNumber: {
                                    type: "integer"
                                },

                                date: {
                                    type: "string"
                                },

                                topic: {
                                    type: "string"
                                },

                                duration: {
                                    type: "integer"
                                },

                                activity: {
                                    type: "string"
                                },

                                priority: {
                                    type: "string"
                                },

                                type: {
                                    type: "string"
                                }
                            },

                            required: [
                                "dayNumber",
                                "date",
                                "topic",
                                "duration",
                                "activity",
                                "priority",
                                "type"
                            ]
                        }
                    }
                },

                required: [
                    "summary",
                    "sessions"
                ]
            }
        }
    });

    const text = response.text;

    return JSON.parse(text);
}

async function analyzeQuizPerformance(results) {

    const prompt = `
You are an AI learning analyst.

Analyze the student's quiz performance.

Results:

${JSON.stringify(results, null, 2)}

Identify:

1. Strong topics
2. Weak topics
3. Topics needing revision
4. Recommended additional study time
5. Recommended activities

Return ONLY JSON.

Format:

{
    "weakTopics": [],
    "strongTopics": [],
    "revisionTopics": [],
    "recommendations": []
}
`;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",

        contents: prompt,

        config: {
            responseMimeType: "application/json",

            responseSchema: {
                type: "object",

                properties: {
                    weakTopics: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },

                    strongTopics: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },

                    revisionTopics: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },

                    recommendations: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    }
                },

                required: [
                    "weakTopics",
                    "strongTopics",
                    "revisionTopics",
                    "recommendations"
                ]
            }
        }
    });

    return JSON.parse(response.text);
}

module.exports = {
    generateStudyPlan,
    analyzeQuizPerformance
};
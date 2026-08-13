require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();

const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(express.json());

app.use(express.static(
    path.join(__dirname, "public")
));


// ======================================================
// DATABASE
// ======================================================

const DATA_DIR = path.join(
    __dirname,
    "data"
);

const DATA_FILE = path.join(
    DATA_DIR,
    "planner.json"
);


if (!fs.existsSync(DATA_DIR)) {

    fs.mkdirSync(
        DATA_DIR,
        { recursive: true }
    );

}


function getDefaultData() {

    return {

        goal: null,

        plan: [],

        completedSessions: [],

        quizResults: [],

        adaptiveChanges: []

    };

}


function loadData() {

    try {

        if (!fs.existsSync(DATA_FILE)) {

            return getDefaultData();

        }

        return JSON.parse(
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            "Database read error:",
            error
        );

        return getDefaultData();

    }

}


function saveData(data) {

    fs.writeFileSync(

        DATA_FILE,

        JSON.stringify(
            data,
            null,
            2
        )

    );

}


// ======================================================
// GENERATE STUDY PLAN
// ======================================================

app.post(
    "/api/generate-plan",
    async (req, res) => {

        try {

            const {

                subject,
                goal,
                deadline,
                hoursPerDay,
                daysPerWeek,
                knowledgeLevel,
                weakTopics

            } = req.body;


            if (
                !subject ||
                !goal ||
                !deadline ||
                !hoursPerDay ||
                !daysPerWeek
            ) {

                return res.status(400).json({

                    error:
                        "Please fill all required fields."

                });

            }


            const today =
                new Date();


            const deadlineDate =
                new Date(deadline);


            const difference =
                deadlineDate - today;


            const daysRemaining =
                Math.max(

                    1,

                    Math.ceil(

                        difference /
                        (1000 * 60 * 60 * 24)

                    )

                );


            // Don't create an enormous plan
            const numberOfDays =
                Math.min(
                    daysRemaining,
                    30
                );


            const dailyMinutes =
                Math.round(
                    Number(hoursPerDay) * 60
                );


            const prompt = `

You are an expert AI Study Planner.

Create a personalized study plan for a student.

STUDENT INFORMATION:

Subject:
${subject}

Goal:
${goal}

Deadline:
${deadline}

Days remaining:
${daysRemaining}

Study hours per day:
${hoursPerDay}

Available days per week:
${daysPerWeek}

Current knowledge level:
${knowledgeLevel}

Weak topics:
${weakTopics || "None specified"}


IMPORTANT REQUIREMENTS:

1. Create a realistic study plan.

2. Never exceed ${dailyMinutes} minutes in one day.

3. Respect the student's available days.

4. Give extra attention to weak topics.

5. Include:
   - Learning
   - Practice
   - Revision
   - Quiz

6. Use spaced revision.

7. High priority topics should receive more attention.

8. Include revision before the deadline.

9. Every session must have a duration.

10. Session durations should normally be
15, 20, 30, 45 or 60 minutes.


RETURN ONLY VALID JSON.

FORMAT:

{
  "plan": [
    {
      "day": "Day 1",
      "totalMinutes": 120,
      "sessions": [
        {
          "id": "day1-session1",
          "topic": "SQL Joins",
          "duration": 45,
          "activity": "Learn INNER JOIN and LEFT JOIN",
          "priority": "High",
          "revision": "Review JOIN syntax",
          "practice": "Solve 5 SQL questions",
          "completed": false
        }
      ]
    }
  ]
}

Create a maximum of ${numberOfDays} days.

`;


            console.log(
                "🤖 Generating AI study plan..."
            );


            const response =
                await ai.models.generateContent({

                    model:
                        "gemini-3.6-flash",

                    contents:
                        prompt,

                    config: {

                        responseMimeType:
                            "application/json"

                    }

                });


            const result =
                JSON.parse(
                    response.text
                );


            const data =
                loadData();


            data.goal = {

                subject,
                goal,
                deadline,
                hoursPerDay,
                daysPerWeek,
                knowledgeLevel,
                weakTopics

            };


            data.plan =
                result.plan || [];


            data.completedSessions = [];

            data.quizResults = [];

            data.adaptiveChanges = [];


            saveData(data);


            res.json({

                success: true,

                plan: data.plan

            });


        } catch (error) {

            console.error(
                "AI plan error:",
                error
            );


            res.status(500).json({

                error:
                    error.message ||
                    "Failed to generate study plan."

            });

        }

    }
);


// ======================================================
// DASHBOARD
// ======================================================

app.get(
    "/api/dashboard",
    (req, res) => {

        const data =
            loadData();

        res.json(data);

    }
);


// ======================================================
// COMPLETE SESSION
// ======================================================

app.post(
    "/api/session/complete",
    (req, res) => {

        const {
            sessionId
        } = req.body;


        const data =
            loadData();


        if (
            !data.completedSessions.includes(
                sessionId
            )
        ) {

            data.completedSessions.push(
                sessionId
            );

        }


        data.plan.forEach(day => {

            day.sessions.forEach(session => {

                if (
                    session.id ===
                    sessionId
                ) {

                    session.completed = true;

                }

            });

        });


        saveData(data);


        res.json({

            success: true

        });

    }
);


// ======================================================
// QUIZ RESULT
// ======================================================

app.post(
    "/api/quiz",
    (req, res) => {

        const {
            topic,
            score
        } = req.body;


        if (
            !topic ||
            score === undefined
        ) {

            return res.status(400).json({

                error:
                    "Topic and score are required."

            });

        }


        const data =
            loadData();


        data.quizResults.push({

            topic,

            score: Number(score),

            date:
                new Date().toISOString()

        });


        saveData(data);


        let message;


        if (score < 40) {

            message =
                `⚠️ ${topic} is a major weakness. Extra revision recommended.`;

        }

        else if (score < 60) {

            message =
                `🟡 ${topic} needs improvement.`;

        }

        else if (score < 80) {

            message =
                `🟢 ${topic} is improving.`;

        }

        else {

            message =
                `🎉 Excellent! ${topic} score is ${score}%.`;

        }


        res.json({

            success: true,

            message

        });

    }
);


// ======================================================
// ADAPTIVE RE-PLANNING
// ======================================================

app.post(
    "/api/adaptive-replan",
    async (req, res) => {

        try {

            const data =
                loadData();


            if (!data.goal) {

                return res.status(400).json({

                    error:
                        "Create a study goal first."

                });

            }


            if (
                !data.quizResults ||
                data.quizResults.length === 0
            ) {

                return res.status(400).json({

                    error:
                        "Take a quiz first."

                });

            }


            const weakTopics =
                data.quizResults.filter(

                    quiz =>
                        quiz.score < 60

                );


            if (weakTopics.length === 0) {

                return res.json({

                    success: true,

                    message:
                        "No major weak topics detected.",

                    plan:
                        data.plan

                });

            }


            const prompt = `

You are an Adaptive AI Study Planner.

The student already has a study plan.

Analyze the quiz results and improve the plan.

STUDENT GOAL:

${JSON.stringify(
    data.goal,
    null,
    2
)}


QUIZ RESULTS:

${JSON.stringify(
    data.quizResults,
    null,
    2
)}


CURRENT PLAN:

${JSON.stringify(
    data.plan,
    null,
    2
)}


WEAK TOPICS:

${JSON.stringify(
    weakTopics,
    null,
    2
)}


RULES:

1. Scores below 60% indicate weakness.

2. Scores below 40% indicate major weakness.

3. Add extra revision for weak topics.

4. Add practice questions.

5. Do not remove completed sessions.

6. Keep completed sessions completed.

7. Do not exceed the student's daily study time.

8. Reduce unnecessary repetition of topics with high scores.

9. Give more time to weak topics.

10. Return the complete updated plan.


RETURN ONLY VALID JSON.

FORMAT:

{
  "analysis": "Explanation of what changed",
  "changes": [
    "Added normalization revision",
    "Reduced unnecessary SQL revision"
  ],
  "plan": []
}

`;


            console.log(
                "🔄 AI is adapting the study plan..."
            );


            const response =
                await ai.models.generateContent({

                    model:
                        "gemini-3.6-flash",

                    contents:
                        prompt,

                    config: {

                        responseMimeType:
                            "application/json"

                    }

                });


            const result =
                JSON.parse(
                    response.text
                );


            data.plan =
                result.plan ||
                data.plan;


            data.adaptiveChanges.push({

                date:
                    new Date().toISOString(),

                analysis:
                    result.analysis,

                changes:
                    result.changes || []

            });


            saveData(data);


            res.json({

                success: true,

                analysis:
                    result.analysis,

                changes:
                    result.changes,

                plan:
                    data.plan

            });


        } catch (error) {

            console.error(
                "Adaptive AI error:",
                error
            );


            res.status(500).json({

                error:
                    error.message ||
                    "Adaptive planning failed."

            });

        }

    }
);


// ======================================================
// START SERVER
// ======================================================

app.listen(
    PORT,
    () => {

        console.log(
            `

🎓 AI STUDY PLANNER

Server running at:
http://localhost:${PORT}

            `
        );

    }
);
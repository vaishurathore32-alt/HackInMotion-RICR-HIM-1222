const API_BASE = "";

let currentPlan = null;
let currentUserId = "student123";


// ==========================================
// ELEMENTS
// ==========================================

const goalForm =
    document.getElementById("goalForm");

const generateButton =
    document.getElementById("generateButton");

const loading =
    document.getElementById("loading");

const results =
    document.getElementById("results");

const todaySessions =
    document.getElementById("todaySessions");

const adaptiveButton =
    document.getElementById("adaptiveButton");


// ==========================================
// CREATE STUDY PLAN
// ==========================================

goalForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const subject =
            document.getElementById("subject").value.trim();

        const examGoal =
            document.getElementById("examGoal").value.trim();

        const deadline =
            document.getElementById("deadline").value;

        const hoursPerDay =
            Number(
                document.getElementById("hours").value
            );

        const daysPerWeek =
            Number(
                document.getElementById("days").value
            );

        const currentKnowledgeLevel =
            document.getElementById("knowledge").value;

        const weakTopicsInput =
            document
                .getElementById("weakTopics")
                .value
                .trim();


        const weakTopics =
            weakTopicsInput
                ? weakTopicsInput
                    .split(",")
                    .map(topic => topic.trim())
                    .filter(Boolean)
                : [];


        const data = {

            userId: currentUserId,

            subject,

            examGoal,

            deadline,

            hoursPerDay,

            daysPerWeek,

            currentKnowledgeLevel,

            weakTopics

        };


        try {

            setLoading(true);


            const response =
                await fetch(
                    `${API_BASE}/api/goals`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(data)
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Failed to create study plan"
                );

            }


            currentPlan =
                result.plan;


            displayPlan(
                result.plan
            );


            await loadProgress();


            await loadTodayPlan();


            showMessage(
                "✨ StudyMate created your personalized study plan!"
            );


        } catch (error) {

            console.error(error);

            showMessage(
                `❌ ${error.message}`,
                true
            );

        } finally {

            setLoading(false);

        }

    }
);


// ==========================================
// DISPLAY GENERATED PLAN
// ==========================================

function displayPlan(plan) {

    if (!plan) {
        return;
    }


    results.style.display = "block";


    document.getElementById(
        "aiSummary"
    ).textContent =
        plan.aiSummary ||
        "Your personalized study plan is ready.";


    const sessions =
        plan.sessions || [];


    document.getElementById(
        "totalSessions"
    ).textContent =
        sessions.length;


    const totalMinutes =
        sessions.reduce(
            (sum, session) =>
                sum + Number(session.duration || 0),
            0
        );


    document.getElementById(
        "totalMinutes"
    ).textContent =
        `${totalMinutes} min`;


    displayWeakTopics();

}


// ==========================================
// LOAD TODAY'S PLAN
// ==========================================

async function loadTodayPlan() {

    try {

        const response =
            await fetch(
                `${API_BASE}/api/plans/${currentUserId}/today`
            );


        if (!response.ok) {
            return;
        }


        const data =
            await response.json();


        displayTodaySessions(
            data.sessions || []
        );


    } catch (error) {

        console.error(
            "Today's plan error:",
            error
        );

    }

}


// ==========================================
// DISPLAY TODAY SESSIONS
// ==========================================

function displayTodaySessions(
    sessions
) {

    if (!sessions.length) {

        todaySessions.innerHTML = `

            <div class="empty-state">

                <span>📚</span>

                <p>
                    No sessions scheduled for today.
                </p>

            </div>

        `;

        document.getElementById(
            "todayTime"
        ).textContent = "0 min";

        return;
    }


    const totalMinutes =
        sessions.reduce(
            (sum, session) =>
                sum + Number(session.duration || 0),
            0
        );


    document.getElementById(
        "todayTime"
    ).textContent =
        `${totalMinutes} min`;


    todaySessions.innerHTML =
        sessions
            .map(session =>
                createSessionHTML(session)
            )
            .join("");

}


// ==========================================
// SESSION HTML
// ==========================================

function createSessionHTML(
    session
) {

    const completed =
        session.completed === true;


    return `

        <div
            class="session ${completed ? "completed" : ""}"
            data-session-id="${session._id}"
        >

            <button
                class="session-check"
                onclick="completeSession('${session._id}')"
                ${completed ? "disabled" : ""}
            >
                ${completed ? "✓" : ""}
            </button>


            <div class="session-info">

                <h4>
                    ${escapeHTML(session.topic)}
                </h4>

                <p>
                    ${escapeHTML(session.activity)}
                </p>

            </div>


            <div class="session-meta">

                <div class="session-duration">
                    ${session.duration} min
                </div>

                <span
                    class="priority ${session.priority}"
                >
                    ${session.priority}
                </span>

            </div>

        </div>

    `;
}


// ==========================================
// COMPLETE SESSION
// ==========================================

async function completeSession(
    sessionId
) {

    if (!currentPlan) {

        showMessage(
            "Please create a study plan first.",
            true
        );

        return;
    }


    try {

        const response =
            await fetch(

                `${API_BASE}/api/progress/session/` +
                `${currentPlan._id}/${sessionId}`,

                {
                    method: "PATCH"
                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not complete session"
            );

        }


        await loadTodayPlan();

        await loadProgress();


        showMessage(
            "✅ Session completed!"
        );


    } catch (error) {

        console.error(error);

        showMessage(
            `❌ ${error.message}`,
            true
        );

    }

}


// ==========================================
// LOAD PROGRESS
// ==========================================

async function loadProgress() {

    if (!currentPlan) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/progress/${currentPlan._id}`
            );


        if (!response.ok) {
            return;
        }


        const data =
            await response.json();


        updateProgressUI(data);


    } catch (error) {

        console.error(
            "Progress error:",
            error
        );

    }

}


// ==========================================
// UPDATE PROGRESS UI
// ==========================================

function updateProgressUI(
    data
) {

    const percentage =
        Number(data.percentage || 0);


    const total =
        Number(data.totalSessions || 0);


    const completed =
        Number(data.completedSessions || 0);


    document.getElementById(
        "progressPercentage"
    ).textContent =
        `${percentage}%`;


    document.getElementById(
        "progressBig"
    ).textContent =
        `${percentage}%`;


    document.getElementById(
        "progressFill"
    ).style.width =
        `${percentage}%`;


    document.getElementById(
        "progressText"
    ).textContent =
        `${completed} of ${total} sessions completed`;


    document.getElementById(
        "completedSessions"
    ).textContent =
        completed;


    document.getElementById(
        "remainingSessions"
    ).textContent =
        Math.max(
            total - completed,
            0
        );

}


// ==========================================
// DISPLAY WEAK TOPICS
// ==========================================

function displayWeakTopics() {

    const container =
        document.getElementById(
            "weakTopicsDisplay"
        );


    const input =
        document
            .getElementById("weakTopics")
            .value
            .trim();


    if (!input) {

        container.innerHTML = `

            <span class="topic-empty">
                No weak topics added yet.
            </span>

        `;

        return;
    }


    const topics =
        input
            .split(",")
            .map(topic => topic.trim())
            .filter(Boolean);


    container.innerHTML =
        topics
            .map(topic => `
                <span class="topic">
                    ${escapeHTML(topic)}
                </span>
            `)
            .join("");

}


// ==========================================
// ADAPTIVE AI
// ==========================================

adaptiveButton.addEventListener(
    "click",
    async function () {

        if (!currentPlan) {

            showMessage(
                "Create a study plan first.",
                true
            );

            return;
        }


        const topic =
            document
                .getElementById("quizTopic")
                .value
                .trim();


        const score =
            Number(
                document
                    .getElementById("quizScore")
                    .value
            );


        if (!topic) {

            showMessage(
                "Please enter the quiz topic.",
                true
            );

            return;
        }


        if (
            Number.isNaN(score) ||
            score < 0 ||
            score > 100
        ) {

            showMessage(
                "Please enter a score between 0 and 100.",
                true
            );

            return;
        }


        try {

            adaptiveButton.disabled =
                true;

            adaptiveButton.textContent =
                "🧠 AI Analyzing...";


            const response =
                await fetch(

                    `${API_BASE}/api/progress/adaptive/` +
                    `${currentPlan._id}`,

                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                quizResults: [

                                    {
                                        topic,
                                        score
                                    }

                                ]

                            })

                    }

                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Adaptive planning failed"
                );

            }


            currentPlan =
                data.plan;


            displayPlan(
                data.plan
            );


            await loadTodayPlan();

            await loadProgress();


            const weakTopics =
                data.analysis?.weakTopics || [];


            document.getElementById(
                "adaptiveResult"
            ).textContent =

                weakTopics.length

                    ? `StudyMate detected weak areas: ${weakTopics.join(", ")}. Your plan has been adapted.`
                    : "StudyMate analyzed your performance and updated your plan.";


            document.getElementById(
                "weakTopicsDisplay"
            ).innerHTML =

                weakTopics.length

                    ? weakTopics
                        .map(topic => `
                            <span class="topic">
                                ${escapeHTML(topic)}
                            </span>
                        `)
                        .join("")

                    : `
                        <span class="topic-empty">
                            No new weak topics detected.
                        </span>
                    `;


        } catch (error) {

            console.error(error);

            showMessage(
                `❌ ${error.message}`,
                true
            );

        } finally {

            adaptiveButton.disabled =
                false;

            adaptiveButton.textContent =
                "🧠 Analyze Performance";

        }

    }
);


// ==========================================
// LOADING
// ==========================================

function setLoading(
    isLoading
) {

    loading.hidden =
        !isLoading;


    generateButton.disabled =
        isLoading;


    if (isLoading) {

        generateButton.textContent =
            "🤖 StudyMate is thinking...";

    } else {

        generateButton.textContent =
            "✨ Generate My AI Study Plan";

    }

}


// ==========================================
// MESSAGE
// ==========================================

function showMessage(
    message,
    isError = false
) {

    const oldMessage =
        document.querySelector(
            ".toast"
        );


    if (oldMessage) {
        oldMessage.remove();
    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "toast";


    toast.textContent =
        message;


    if (isError) {

        toast.style.background =
            "#dc2626";

    }


    document.body.appendChild(
        toast
    );


    setTimeout(() => {

        toast.remove();

    }, 3500);

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}
// ==========================================
// INITIAL STATE
// ==========================================
results.style.display =
    "block";
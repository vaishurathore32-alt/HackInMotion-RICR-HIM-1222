// ======================================================
// LOAD DASHBOARD
// ======================================================

async function loadDashboard() {

    try {

        const response =
            await fetch(
                "/api/dashboard"
            );


        const data =
            await response.json();


        renderDashboard(data);

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}


// ======================================================
// GENERATE PLAN
// ======================================================

document
    .getElementById("goalForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const loading =
                document.getElementById(
                    "loading"
                );


            loading.style.display =
                "block";


            const goalData = {

                subject:
                    document.getElementById(
                        "subject"
                    ).value,

                goal:
                    document.getElementById(
                        "goal"
                    ).value,

                deadline:
                    document.getElementById(
                        "deadline"
                    ).value,

                hoursPerDay:
                    Number(
                        document.getElementById(
                            "hoursPerDay"
                        ).value
                    ),

                daysPerWeek:
                    Number(
                        document.getElementById(
                            "daysPerWeek"
                        ).value
                    ),

                knowledgeLevel:
                    document.getElementById(
                        "knowledgeLevel"
                    ).value,

                weakTopics:
                    document.getElementById(
                        "weakTopics"
                    ).value

            };


            try {

                const response =
                    await fetch(
                        "/api/generate-plan",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    goalData
                                )

                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    alert(
                        result.error
                    );

                    return;

                }


                alert(
                    "🎉 AI Study Plan Generated!"
                );


                loadDashboard();


            } catch (error) {

                console.error(error);

                alert(
                    "Could not connect to server."
                );

            } finally {

                loading.style.display =
                    "none";

            }

        }
    );


// ======================================================
// RENDER DASHBOARD
// ======================================================

function renderDashboard(data) {

    const plan =
        data.plan || [];


    const completed =
        data.completedSessions || [];


    const allSessions =
        plan.flatMap(
            day =>
                day.sessions
        );


    const total =
        allSessions.length;


    const completedCount =
        completed.length;


    const percentage =
        total === 0
            ? 0
            : Math.round(
                completedCount /
                total *
                100
            );


    document.getElementById(
        "totalSessions"
    ).textContent = total;


    document.getElementById(
        "completedSessions"
    ).textContent =
        completedCount;


    document.getElementById(
        "progressPercent"
    ).textContent =
        percentage + "%";


    document.getElementById(
        "progressBar"
    ).style.width =
        percentage + "%";


    const weakCount =
        (data.quizResults || [])
            .filter(
                quiz =>
                    quiz.score < 60
            )
            .length;


    document.getElementById(
        "weakCount"
    ).textContent =
        weakCount;


    renderToday(
        plan
    );


    renderFullPlan(
        plan
    );


    renderAdaptive(
        data
    );

}


// ======================================================
// TODAY'S PLAN
// ======================================================

function renderToday(plan) {

    const container =
        document.getElementById(
            "todayPlan"
        );


    if (!plan.length) {

        container.innerHTML =
            "<p>No plan generated yet.</p>";

        return;

    }


    const today =
        plan[0];


    container.innerHTML = `

        <h3>${today.day}</h3>

        <p>
            Total:
            ${today.totalMinutes}
            minutes
        </p>

        <br>

        ${today.sessions
            .map(
                createSessionHTML
            )
            .join("")}

    `;

}


// ======================================================
// SESSION HTML
// ======================================================

function createSessionHTML(session) {

    const priority =
        session.priority
            .toLowerCase();


    return `

        <div class="
            session
            ${session.completed
                ? "completed"
                : ""}
        ">

            <div>

                <h3>
                    ${session.topic}
                </h3>

                <p>
                    ⏱
                    ${session.duration}
                    minutes
                </p>

                <p>
                    🎯
                    ${session.activity}
                </p>

                <p>
                    🔄
                    ${session.revision}
                </p>

                <p>
                    📝
                    ${session.practice}
                </p>

                <br>

                <span class="
                    badge
                    ${priority}
                ">

                    ${session.priority}
                    Priority

                </span>

            </div>


            <div>

                ${
                    session.completed

                    ?

                    `<strong>
                        ✅ Completed
                    </strong>`

                    :

                    `<button
                        onclick="
                        completeSession(
                            '${session.id}'
                        )">

                        Complete

                    </button>`
                }

            </div>

        </div>

    `;

}


// ======================================================
// FULL PLAN
// ======================================================

function renderFullPlan(plan) {

    const container =
        document.getElementById(
            "fullPlan"
        );


    if (!plan.length) {

        container.innerHTML =
            "<p>No plan generated yet.</p>";

        return;

    }


    container.innerHTML =
        plan
            .map(
                day => `

                <div>

                    <h3>
                        ${day.day}
                    </h3>

                    <p>
                        Total:
                        ${day.totalMinutes}
                        minutes
                    </p>

                    <br>

                    ${day.sessions
                        .map(
                            createSessionHTML
                        )
                        .join("")}

                </div>

                <hr><br>

                `
            )
            .join("");

}


// ======================================================
// COMPLETE SESSION
// ======================================================

async function completeSession(
    sessionId
) {

    try {

        const response =
            await fetch(
                "/api/session/complete",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({
                            sessionId
                        })

                }
            );


        if (response.ok) {

            loadDashboard();

        }

    } catch (error) {

        console.error(error);

    }

}


// ======================================================
// QUIZ
// ======================================================

document
    .getElementById("quizForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const topic =
                document.getElementById(
                    "quizTopic"
                ).value;


            const score =
                Number(
                    document.getElementById(
                        "quizScore"
                    ).value
                );


            try {

                const response =
                    await fetch(
                        "/api/quiz",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    topic,
                                    score

                                })

                        }
                    );


                const result =
                    await response.json();


                document.getElementById(
                    "quizMessage"
                ).textContent =
                    result.message ||
                    result.error;


                loadDashboard();


            } catch (error) {

                console.error(error);

            }

        }
    );


// ======================================================
// ADAPTIVE RE-PLANNING
// ======================================================

document
    .getElementById("adaptButton")
    .addEventListener(
        "click",
        async function() {

            const button =
                this;


            button.disabled =
                true;


            button.textContent =
                "🤖 AI is adapting...";


            try {

                const response =
                    await fetch(
                        "/api/adaptive-replan",
                        {

                            method: "POST"

                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    alert(
                        result.error
                    );

                    return;

                }


                alert(
                    "🔄 Study plan updated by AI!"
                );


                loadDashboard();


            } catch (error) {

                console.error(error);

                alert(
                    "Adaptive planning failed."
                );

            } finally {

                button.disabled =
                    false;

                button.textContent =
                    "🤖 Adapt My Study Plan";

            }

        }
    );


// ======================================================
// START
// ======================================================

loadDashboard();
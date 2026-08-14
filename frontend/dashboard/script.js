/* =========================================================
   LEARNPATH DASHBOARD - FINAL SCRIPT
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const themeToggle = document.getElementById("themeToggle");

const globalSearch = document.getElementById("globalSearch");

const notificationBtn = document.getElementById("notificationBtn");
const logoutBtn = document.getElementById("logoutBtn");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

const profileMenu = document.getElementById("profileMenu");

const navLinks = document.querySelectorAll(".nav-link");

const filterButtons = document.querySelectorAll(".filter-btn");

const difficultyButtons =
    document.querySelectorAll(".difficulty-btn");

const faqQuestions =
    document.querySelectorAll(".faq-question");

const continueButtons =
    document.querySelectorAll(".continue-btn");

const primaryButtons =
    document.querySelectorAll(".primary-btn");

const practiceButtons =
    document.querySelectorAll(".practice-card button");

const recommendationButtons =
    document.querySelectorAll(".recommendation-card button");

const certificateButtons =
    document.querySelectorAll(
        ".certificate-card .outline-btn:not([disabled])"
    );


/* =========================================================
   SIDEBAR
========================================================= */

if (sidebarToggle && sidebar) {

    sidebarToggle.addEventListener("click", function () {

        sidebar.classList.toggle("sidebar-open");

    });

}


document.addEventListener("click", function (event) {

    if (
        window.innerWidth <= 900 &&
        sidebar &&
        sidebarToggle
    ) {

        if (
            sidebar.classList.contains("sidebar-open") &&
            !sidebar.contains(event.target) &&
            !sidebarToggle.contains(event.target)
        ) {

            sidebar.classList.remove("sidebar-open");

        }

    }

});


/* =========================================================
   SIDEBAR NAVIGATION
========================================================= */

navLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        navLinks.forEach(function (item) {

            item.classList.remove("active");

        });

        link.classList.add("active");

        if (
            window.innerWidth <= 900 &&
            sidebar
        ) {

            sidebar.classList.remove("sidebar-open");

        }

    });

});


/* =========================================================
   DARK / LIGHT MODE
========================================================= */

function updateThemeIcon() {

    if (!themeToggle) {
        return;
    }

    const icon = themeToggle.querySelector("i");

    if (!icon) {
        return;
    }

    if (
        document.body.classList.contains("dark-mode")
    ) {

        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");

    } else {

        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");

    }

}


/* Load saved theme */

const savedTheme =
    localStorage.getItem("learnpathTheme");

if (savedTheme === "dark") {

    document.body.classList.add("dark-mode");

}

updateThemeIcon();


/* Theme button */

if (themeToggle) {

    themeToggle.addEventListener("click", function () {

        document.body.classList.toggle("dark-mode");

        const isDark =
            document.body.classList.contains("dark-mode");

        localStorage.setItem(
            "learnpathTheme",
            isDark ? "dark" : "light"
        );

        updateThemeIcon();

        showToast(
            isDark
                ? "Dark mode enabled."
                : "Light mode enabled."
        );

    });

}


/* Settings theme button */

const settingsTheme =
    document.getElementById("settingsTheme");

if (settingsTheme) {

    settingsTheme.addEventListener(
        "click",
        function () {

            if (themeToggle) {

                themeToggle.click();

            }

        }
    );

}


/* =========================================================
   GLOBAL SEARCH
========================================================= */

if (globalSearch) {

    globalSearch.addEventListener(
        "input",
        handleGlobalSearch
    );

}


function handleGlobalSearch() {

    const searchValue =
        globalSearch.value
            .toLowerCase()
            .trim();


    /*
       Searchable dashboard cards.

       Tutorials intentionally removed because
       Tutorials section has been removed.
    */

    const cards =
        document.querySelectorAll(
            ".searchable-card, " +
            ".explore-card, " +
            ".path-card, " +
            ".practice-card, " +
            ".ai-card, " +
            ".recommendation-card, " +
            ".resource-card"
        );


    cards.forEach(function (card) {

        const text =
            card.textContent
                .toLowerCase();


        if (
            searchValue === "" ||
            text.includes(searchValue)
        ) {

            card.style.display = "";

        } else {

            card.style.display = "none";

        }

    });


    /*
       If user searches for something,
       automatically move to Explore Courses.
    */

    if (
        searchValue.length >= 2
    ) {

        const exploreSection =
            document.getElementById("explore");

        if (exploreSection) {

            /*
               Do not force-scroll on every keystroke.
               Only search/filter the existing cards.
            */

        }

    }

}


/* =========================================================
   EXPLORE COURSE FILTER
========================================================= */

filterButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            filterButtons.forEach(
                function (item) {

                    item.classList.remove(
                        "active"
                    );

                }
            );


            button.classList.add("active");


            const category =
                button.dataset.category;


            const exploreCards =
                document.querySelectorAll(
                    ".explore-card"
                );


            exploreCards.forEach(
                function (card) {

                    const cardCategory =
                        card.dataset.category;


                    if (
                        category === "all" ||
                        cardCategory === category
                    ) {

                        card.style.display = "";

                    } else {

                        card.style.display = "none";

                    }

                }
            );

        }
    );

});


/* =========================================================
   EXPLORE COURSE BUTTONS
========================================================= */

document
    .querySelectorAll(
        ".explore-card .outline-btn"
    )
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const card =
                    button.closest(
                        ".explore-card"
                    );


                if (!card) {
                    return;
                }


                const titleElement =
                    card.querySelector("h3");


                const courseName =
                    titleElement
                        ? titleElement.textContent.trim()
                        : "course";


                showToast(
                    "Opening " +
                    courseName +
                    "..."
                );

            }
        );

    });


/* =========================================================
   DYNAMIC COURSE SEARCH
========================================================= */

/*
    BACKEND API READY

    Later your backend can provide:

    GET /api/courses?search=javascript&page=1&limit=12

    Example response:

    {
        "courses": [],
        "page": 1,
        "limit": 12,
        "total": 100
    }

    For now the dashboard searches the
    courses already loaded in the HTML.

    When backend is ready, replace/use
    searchCoursesFromAPI().
*/


let courseSearchTimer = null;

function enableDynamicCourseSearch() {

    if (!globalSearch) {
        return;
    }


    globalSearch.addEventListener(
        "input",
        function () {

            clearTimeout(courseSearchTimer);


            const query =
                globalSearch.value.trim();


            if (query.length < 2) {

                return;

            }


            courseSearchTimer =
                setTimeout(
                    function () {

                        /*
                           Backend API call can be enabled here.
                        */

                        // searchCoursesFromAPI(query);

                    },
                    400
                );

        }
    );

}


/*
   Example backend function.

   Do NOT worry about this right now.
   Backend team can connect the real API later.
*/

async function searchCoursesFromAPI(query) {

    try {

        const page = 1;
        const limit = 12;


        const response =
            await fetch(
                `/api/courses?search=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
            );


        if (!response.ok) {

            throw new Error(
                "Course API request failed"
            );

        }


        const data =
            await response.json();


        renderDynamicCourses(
            data.courses || []
        );


    } catch (error) {

        console.error(
            "Course search error:",
            error
        );

        showToast(
            "Unable to load courses right now."
        );

    }

}


function renderDynamicCourses(courses) {

    const grid =
        document.querySelector(
            ".explore-grid"
        );


    if (!grid) {
        return;
    }


    grid.innerHTML = "";


    if (!courses.length) {

        grid.innerHTML = `
            <div class="empty-course-result">
                <i class="fa-solid fa-book-open"></i>
                <h3>No courses found</h3>
                <p>
                    Try searching for another course or topic.
                </p>
            </div>
        `;

        return;

    }


    courses.forEach(function (course) {

        const article =
            document.createElement("article");


        article.className =
            "explore-card searchable-card";


        article.dataset.category =
            course.category || "all";


        article.innerHTML = `

            <div class="explore-icon">

                <i class="fa-solid fa-book"></i>

            </div>

            <h3>
                ${escapeHTML(course.title || "Course")}
            </h3>

            <p>
                ${escapeHTML(
                    course.description ||
                    "Learn this course step by step."
                )}
            </p>

            <div class="explore-meta">

                <span>
                    <i class="fa-solid fa-layer-group"></i>
                    ${escapeHTML(
                        course.level || "Beginner"
                    )}
                </span>

                <span>
                    <i class="fa-solid fa-book"></i>
                    ${course.lessons || 0} Lessons
                </span>

            </div>

            <button
                class="outline-btn"
                type="button"
            >
                Explore
            </button>
        `;


        const button =
            article.querySelector(
                ".outline-btn"
            );


        button.addEventListener(
            "click",
            function () {

                showToast(
                    "Opening " +
                    (course.title || "course") +
                    "..."
                );

            }
        );


        grid.appendChild(article);

    });

}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


enableDynamicCourseSearch();


/* =========================================================
   PRACTICE DIFFICULTY FILTER
========================================================= */

difficultyButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            difficultyButtons.forEach(
                function (item) {

                    item.classList.remove(
                        "active"
                    );

                }
            );


            button.classList.add("active");


            const difficulty =
                button.textContent
                    .toLowerCase()
                    .trim();


            const practiceCards =
                document.querySelectorAll(
                    ".practice-card"
                );


            practiceCards.forEach(
                function (card) {

                    const levelElement =
                        card.querySelector(
                            ".practice-level"
                        );


                    const levelText =
                        levelElement
                            ? levelElement.textContent
                                .toLowerCase()
                            : "";


                    if (
                        difficulty === "all" ||
                        levelText.includes(
                            difficulty
                        ) ||
                        levelText.includes(
                            "all levels"
                        )
                    ) {

                        card.style.display = "";

                    } else {

                        card.style.display = "none";

                    }

                }
            );


            showToast(

                difficulty === "all"

                    ? "Showing all practice activities."

                    : difficulty.charAt(0)
                        .toUpperCase() +
                      difficulty.slice(1) +
                      " practice selected."

            );

        }
    );

});


/* =========================================================
   FAQ ACCORDION
========================================================= */

faqQuestions.forEach(function (question) {

    question.addEventListener(
        "click",
        function () {

            const faqItem =
                question.parentElement;


            const answer =
                faqItem.querySelector(
                    ".faq-answer"
                );


            const icon =
                question.querySelector("i");


            const isOpen =
                faqItem.classList.contains(
                    "open"
                );


            document
                .querySelectorAll(
                    ".faq-item"
                )
                .forEach(function (item) {

                    item.classList.remove(
                        "open"
                    );


                    const itemAnswer =
                        item.querySelector(
                            ".faq-answer"
                        );


                    if (itemAnswer) {

                        itemAnswer.style.maxHeight =
                            null;

                    }


                    const itemIcon =
                        item.querySelector(
                            ".faq-question i"
                        );


                    if (itemIcon) {

                        itemIcon.style.transform =
                            "rotate(0deg)";

                    }

                });


            if (!isOpen) {

                faqItem.classList.add(
                    "open"
                );


                if (answer) {

                    answer.style.maxHeight =
                        answer.scrollHeight +
                        "px";

                }


                if (icon) {

                    icon.style.transform =
                        "rotate(180deg)";

                }

            }

        }
    );

});


/* =========================================================
   PROGRESS BAR ANIMATION
========================================================= */

function animateProgressBars() {

    const progressBars =
        document.querySelectorAll(
            ".progress-bar div, " +
            ".path-progress div, " +
            ".skill-bar div"
        );


    progressBars.forEach(
        function (bar) {

            const finalWidth =
                bar.style.width;


            if (!finalWidth) {
                return;
            }


            bar.style.width = "0%";


            setTimeout(
                function () {

                    bar.style.width =
                        finalWidth;

                },
                200
            );

        }
    );

}


window.addEventListener(
    "load",
    function () {

        setTimeout(
            animateProgressBars,
            300
        );

    }
);


/* =========================================================
   CONTINUE LEARNING
========================================================= */

continueButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            const courseCard =
                button.closest(
                    ".course-card"
                );


            if (!courseCard) {
                return;
            }


            const title =
                courseCard.querySelector(
                    "h3"
                );


            const courseName =
                title
                    ? title.textContent.trim()
                    : "course";


            showToast(
                "Opening " +
                courseName +
                "..."
            );

        }
    );

});


/* =========================================================
   LEARNING PATH BUTTONS
========================================================= */

document
    .querySelectorAll(
        ".path-bottom button"
    )
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const pathCard =
                    button.closest(
                        ".path-card"
                    );


                if (!pathCard) {
                    return;
                }


                const title =
                    pathCard.querySelector(
                        "h3"
                    );


                const pathName =
                    title
                        ? title.textContent.trim()
                        : "learning path";


                showToast(
                    "Opening " +
                    pathName +
                    "..."
                );

            }
        );

    });


/* =========================================================
   AI CARDS
========================================================= */

document
    .querySelectorAll(
        ".ai-card button"
    )
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const aiCard =
                    button.closest(
                        ".ai-card"
                    );


                if (!aiCard) {
                    return;
                }


                const title =
                    aiCard.querySelector(
                        "h3"
                    );


                const featureName =
                    title
                        ? title.textContent.trim()
                        : "AI feature";


                showToast(
                    featureName +
                    " is ready to use."
                );

            }
        );

    });


/* =========================================================
   AI STUDY PLANNER / ASSISTANT
========================================================= */

primaryButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            const buttonText =
                button.textContent
                    .toLowerCase();


            if (
                buttonText.includes(
                    "assistant"
                )
            ) {

                showToast(
                    "Opening AI Study Assistant..."
                );

            } else if (
                buttonText.includes(
                    "planner"
                )
            ) {

                showToast(
                    "Opening AI Study Planner..."
                );

            } else if (
                buttonText.includes(
                    "community"
                )
            ) {

                showToast(
                    "Opening Student Community..."
                );

            }

        }
    );

});


/* =========================================================
   EXPLICIT PLANNER BUTTON
========================================================= */

const openPlanner =
    document.getElementById(
        "openPlanner"
    );


if (openPlanner) {

    openPlanner.addEventListener(
        "click",
        function () {

            showToast(
                "Opening AI Study Planner..."
            );

        }
    );

}


/* =========================================================
   EXPLICIT ASSISTANT BUTTON
========================================================= */

const openAssistant =
    document.getElementById(
        "openAssistant"
    );


if (openAssistant) {

    openAssistant.addEventListener(
        "click",
        function () {

            showToast(
                "Opening AI Study Assistant..."
            );

        }
    );

}


/* =========================================================
   PRACTICE BUTTONS
========================================================= */

practiceButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            const card =
                button.closest(
                    ".practice-card"
                );


            if (!card) {
                return;
            }


            const title =
                card.querySelector(
                    "h3"
                );


            const practiceName =
                title
                    ? title.textContent.trim()
                    : "practice";


            showToast(
                "Opening " +
                practiceName +
                "..."
            );

        }
    );

});


/* =========================================================
   RECOMMENDATIONS
========================================================= */

recommendationButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            const card =
                button.closest(
                    ".recommendation-card"
                );


            if (!card) {
                return;
            }


            const title =
                card.querySelector(
                    "h3"
                );


            const titleText =
                title
                    ? title.textContent.trim()
                    : "recommendation";


            showToast(
                "Opening " +
                titleText +
                "..."
            );

        }
    );

});


/* =========================================================
   CERTIFICATES
========================================================= */

certificateButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            const card =
                button.closest(
                    ".certificate-card"
                );


            if (!card) {
                return;
            }


            const title =
                card.querySelector(
                    "h3"
                );


            const certificateName =
                title
                    ? title.textContent.trim()
                    : "certificate";


            showToast(
                "Opening certificate: " +
                certificateName
            );

        }
    );

});


/* =========================================================
   NOTIFICATIONS
========================================================= */

if (notificationBtn) {

    notificationBtn.addEventListener(
        "click",
        function () {

            showToast(
                "You have new learning updates."
            );


            const dot =
                document.querySelector(
                    ".notification-dot"
                );


            if (dot) {

                dot.style.display = "none";

            }

        }
    );

}


/* =========================================================
   PROFILE
========================================================= */

if (profileMenu) {

    profileMenu.addEventListener(
        "click",
        function () {

            showToast(
                "Profile settings will be available soon."
            );

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function () {

            const confirmLogout =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmLogout) {
                return;
            }


            showToast(
                "Logging out..."
            );


            /*
               Backend/authentication team can
               connect actual logout here later.
            */


            setTimeout(
                function () {

                    window.location.href =
                        "../index.html";

                },
                1000
            );

        }
    );

}


/* =========================================================
   VIEW ALL LINKS
========================================================= */

document
    .querySelectorAll(".view-all")
    .forEach(function (link) {

        link.addEventListener(
            "click",
            function (event) {

                const href =
                    link.getAttribute(
                        "href"
                    );


                if (
                    !href ||
                    !href.startsWith("#")
                ) {

                    return;

                }


                const target =
                    document.querySelector(
                        href
                    );


                if (target) {

                    event.preventDefault();


                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            }
        );

    });


/* =========================================================
   SMOOTH SCROLL
========================================================= */

document
    .querySelectorAll(
        'a[href^="#"]'
    )
    .forEach(function (link) {

        link.addEventListener(
            "click",
            function (event) {

                const targetId =
                    link.getAttribute(
                        "href"
                    );


                if (
                    !targetId ||
                    targetId === "#"
                ) {

                    return;

                }


                const target =
                    document.querySelector(
                        targetId
                    );


                if (target) {

                    event.preventDefault();


                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            }
        );

    });


/* =========================================================
   ACTIVE SECTION ON SCROLL
========================================================= */

const sections =
    document.querySelectorAll(
        ".dashboard-content section[id]"
    );


window.addEventListener(
    "scroll",
    function () {

        let currentSection = "";


        sections.forEach(
            function (section) {

                const sectionTop =
                    section.offsetTop - 170;


                if (
                    window.scrollY >=
                    sectionTop
                ) {

                    currentSection =
                        section.getAttribute(
                            "id"
                        );

                }

            }
        );


        if (!currentSection) {
            return;
        }


        navLinks.forEach(
            function (link) {

                const linkTarget =
                    link.getAttribute(
                        "href"
                    );


                if (
                    linkTarget ===
                    "#" + currentSection
                ) {

                    navLinks.forEach(
                        function (item) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    link.classList.add(
                        "active"
                    );

                }

            }
        );

    }
);


/* =========================================================
   TOAST
========================================================= */

let toastTimer;


function showToast(message) {

    if (!toast || !toastMessage) {
        return;
    }


    toastMessage.textContent =
        message;


    toast.classList.add("show");


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key !== "Escape"
        ) {

            return;

        }


        if (sidebar) {

            sidebar.classList.remove(
                "sidebar-open"
            );

        }


        document
            .querySelectorAll(
                ".faq-item"
            )
            .forEach(
                function (item) {

                    item.classList.remove(
                        "open"
                    );


                    const answer =
                        item.querySelector(
                            ".faq-answer"
                        );


                    if (answer) {

                        answer.style.maxHeight =
                            null;

                    }


                    const icon =
                        item.querySelector(
                            ".faq-question i"
                        );


                    if (icon) {

                        icon.style.transform =
                            "rotate(0deg)";

                    }

                }
            );

    }
);


/* =========================================================
   MOBILE RESIZE
========================================================= */

window.addEventListener(
    "resize",
    function () {

        if (
            window.innerWidth > 900 &&
            sidebar
        ) {

            sidebar.classList.remove(
                "sidebar-open"
            );

        }

    }
);


/* =========================================================
   EMPTY STATE BUTTONS
========================================================= */

document
    .querySelectorAll(
        ".empty-learning-state .primary-btn"
    )
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const target =
                    document.getElementById(
                        "explore"
                    );


                if (target) {

                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            }
        );

    });


/* =========================================================
   RESOURCE CARDS
========================================================= */

document
    .querySelectorAll(
        ".resource-card"
    )
    .forEach(function (card) {

        card.addEventListener(
            "click",
            function () {

                const title =
                    card.querySelector(
                        "h3"
                    );


                if (!title) {
                    return;
                }


                showToast(
                    "Opening " +
                    title.textContent.trim() +
                    "..."
                );

            }
        );

    });


/* =========================================================
   COMMUNITY
========================================================= */

document
    .querySelectorAll(
        "#community .primary-btn"
    )
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                showToast(
                    "Student Community will be available soon."
                );

            }
        );

    });


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateThemeIcon();

        console.log(
            "Learnpath dashboard initialized successfully."
        );

    }
);
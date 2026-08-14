require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const goalRoutes =
    require("./routes/goalRoutes");

const planRoutes =
    require("./routes/planRoutes");

const progressRoutes =
    require("./routes/progressRoutes");


const app = express();


// ----------------------------
// DATABASE
// ----------------------------

connectDB();


// ----------------------------
// MIDDLEWARE
// ----------------------------

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// ----------------------------
// HEALTH CHECK
// ----------------------------

app.get("/", (req, res) => {

    res.json({

        success: true,

        message:
            "🤖 AI Study Planner API is running",

        version: "1.0.0"

    });

});


// ----------------------------
// API ROUTES
// ----------------------------

app.use(
    "/api/goals",
    goalRoutes
);


app.use(
    "/api/plans",
    planRoutes
);


app.use(
    "/api/progress",
    progressRoutes
);


// ----------------------------
// ERROR HANDLER
// ----------------------------

app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({

        success: false,

        message: "Internal server error"

    });

});


// ----------------------------
// START SERVER
// ----------------------------

const PORT =
    process.env.PORT || 5000;


app.listen(PORT, () => {

    console.log(
        `🚀 AI Study Planner running at http://localhost:${PORT}`
    );

});
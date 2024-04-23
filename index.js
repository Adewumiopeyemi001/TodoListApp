const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
//const cookieSession = require("cookie-session");
const passport = require("passport");
const passportSetup = require("./middleware/passportSetup.js");
const { connectDB } = require("./Config/db.js");
const userRouter = require('./Routes/user.routes');
const adminRouter = require('./Routes/admin.routes.js');
const authRoutes = require("./Routes/auth.routes.js");
const session = require("express-session");

const app = express();
app.use(express.json());
dotenv.config();
app.use(morgan("dev"));

// Set security HTTP headers with Helmet
app.use(helmet());

// Enable CORS
app.use(cors());

app.use(
  session({
    secret: "jhktoyuroyro7667er76e8",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());


// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
});

app.use(limiter);


const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Welcome To Our TODO LIST APP");
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1", authRoutes);
app.use("/api/admin", adminRouter);

app.get("*", (req, res) => {
    res.status(404).json("Page Not Found");
});

app.listen(port, async() => {
    try{
        await connectDB(process.env.MONGODB_UR);
        console.log("Database connection Established")
        console.log(`Server is listening on http://localhost:${port}`);

    }catch(error) {
        console.log("Error connecting to MongoDB: " + error.message);
    }
});

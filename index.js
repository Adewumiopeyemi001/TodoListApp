const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { connectDB } = require("./Config/db.js");
const userRouter = require('./Routes/user.routes');
const adminRouter = require('./Routes/admin.routes.js');


const app = express();
app.use(express.json());
dotenv.config();
app.use(morgan("dev"));

app.use(helmet());
app.use(cors());



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

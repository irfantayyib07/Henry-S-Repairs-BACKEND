require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path"); // (built-in module)
const PORT = process.env.PORT || 3500; // take port from the hosting environment
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const mongoose = require("mongoose");
const connectDB = require("./config/dbConnection")
const { logger, logEvents } = require("./middlewares/logger");
const errorHandler = require("./middlewares/errorHandler");

connectDB();

app.use(logger) // custom middleware
app.use(cors(corsOptions))
app.use(express.json()) // ability to process json
app.use(cookieParser()) // third-party middleware

// ROUTING

app.use("/", express.static(path.join(__dirname, "/public"))) // "/" is optional in "/public" (this line tells the server where to take static files from, like css, express.static is a built-in middleware)
// app.use(express.static("/public")); // the path is relative to server.js

app.use("/", require("./routes/root"))
app.use("/users", require("./routes/userRoutes"))
app.all("*", (req, res) => { // catch all
 res.status(404)

 if (req.accepts("html")) {
  res.sendFile(path.join(__dirname, "views", "404.html"))
 } else if (req.accepts("json")) {
  res.json({ message: "404 Not Found" })
 } else {
  res.type("txt").send("404 Not Found");
 }
})

app.use(errorHandler) // custom middleware

mongoose.connection.once("open", () => {
 console.log("Connected to MongoDB")
 app.listen(PORT, () => {console.log("server running on", PORT)})
})

mongoose.connection.on("error", (err) => {
 console.log(err)
 logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
})
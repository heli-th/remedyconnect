// src/app.js
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
//const config = require('./config/config');
//const authRoutes = require('./routes/authRoutes');
//const customerRoutes = require('./routes/customerRoutes');
const articleRoutes = require("./routes/articleRoutes");
const locationRoutes = require("./routes/locationRoutes");
const codeRoutes = require("./routes/codeRoutes");
const symptomCheckerRoutes = require("./routes/symptomCheckerRoute");
const kidsSiteVideoRouter = require("./routes/kidsSiteVideoRouter");
const cronJobs = require("./jobs/cronJobs");

const app = express();
app.use(cors());
// Or restrict to a specific origin:
// app.use(cors({ origin: 'https://my.duda.co' }));
app.use(express.json());

app.use("/static", express.static("public"));

app.use("/api/articles", articleRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/code", codeRoutes);
app.use("/api", symptomCheckerRoutes);
app.use("/api", kidsSiteVideoRouter);

cronJobs.start();

module.exports = app;

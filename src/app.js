// src/app.js
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
//const config = require('./config/config');
//const authRoutes = require('./routes/authRoutes');
//const customerRoutes = require('./routes/customerRoutes');
const articleRoutes = require('./routes/articleRoutes');
const locationRoutes = require('./routes/locationRoutes');
const codeRoutes = require('./routes/codeRoutes');
const cronJobs = require('./jobs/cronJobs');

const app = express();
app.use(cors());
// Or restrict to a specific origin:
// app.use(cors({ origin: 'https://my.duda.co' }));
app.use(express.json());

app.use("/static", express.static("public"));

app.use("/api/articles", articleRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/code", codeRoutes);

cronJobs.start();

module.exports = app;

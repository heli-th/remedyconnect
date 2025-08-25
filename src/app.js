// src/app.js
const cors = require("cors");
const express = require("express");
const cronJobs = require("./jobs/cronJobs");
const routes = require("./routes/index");

const app = express();
app.use(cors());
// Or restrict to a specific origin:
// app.use(cors({ origin: 'https://my.duda.co' }));
app.use(express.json());

app.use("/static", express.static("public"));

app.use("/api", routes);

cronJobs.start();

module.exports = app;

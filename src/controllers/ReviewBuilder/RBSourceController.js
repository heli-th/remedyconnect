const axios = require("axios");
const RESTRESPONSE = require("../../utils/RESTResponse");
const Airtable = require("airtable");

const TABLE_NAME = "Review Sources";

// Airtable config
const airbase = new Airtable({
  apiKey: process.env.REVIEWBUILDER_AIRTABLE_API_KEY,
}).base(process.env.REVIEWBUILDER_BASE_AIRTABLE_ID);

const getSourcesList = async (req, res) => {
  console.log(airbase);

  try {
    const records = [];

    await airbase(TABLE_NAME)
      .select()
      .eachPage((page, fetchNextPage) => {
        page.forEach((record) => {
          records.push({ id: record.id, fields: record.fields });
        });
        fetchNextPage();
      });

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createSource = async (req, res) => {
  try {
    const record = await airbase(TABLE_NAME).create({
      "Source Name": req.body.sourceName,
      "Duda ID": req.body.dudaId,
      "Source Type": req.body.sourceType,
      "Street Address": req.body.streetAddress,
      City: req.body.city,
      State: req.body.state,
      "Zip Code": req.body.zipCode,
      "Source ID": req.body.sourceId,
      "Rating Threshold": req.body.ratingThreshold,
      "Review Page URL": req.body.reviewPageUrl,
      "Survey Page URL": req.body.surveyPageUrl,
      "Time Zone": req.body.timeZone,
    });

    res.status(201).json({ id: record.id, fields: record.fields });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSourceById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await airbase(TABLE_NAME).find(id);

    res.status(200).json({
      success: true,
      id: record.id,
      fields: record.fields,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: "Record not found",
      details: error.message,
    });
  }
};

const updateSource = async (req, res) => {
  try {
    const record = await airbase(TABLE_NAME).update(req.params.id, {
      "Source Name": req.body.sourceName,
      "Source Type": req.body.sourceType,
      "Street Address": req.body.streetAddress,
      City: req.body.city,
      State: req.body.state,
      "Zip Code": req.body.zipCode,
      "Source ID": req.body.sourceId,
      "Rating Threshold": req.body.ratingThreshold,
      "Survey Page URL": req.body.surveyPageUrl,
      "Review Page URL": req.body.reviewPageUrl,
      "Time Zone": req.body.timeZone,
    });

    res.json({ id: record.id, fields: record.fields });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteSource = async (req, res) => {
  try {
    await airbase(TABLE_NAME).destroy(req.params.id);
    res.json({ success: true, message: "Record deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getSourcesList,
  createSource,
  getSourceById,
  updateSource,
  deleteSource,
};

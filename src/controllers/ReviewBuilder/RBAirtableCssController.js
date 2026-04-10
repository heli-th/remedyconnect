const express = require("express");
const Airtable = require("airtable");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Airtable config
const base = new Airtable({
  apiKey: process.env.REVIEWBUILDER_AIRTABLE_API_KEY,
}).base(process.env.REVIEWBUILDER_BASE_AIRTABLE_ID);


// API to sync CSS
const syncCss = async (req, res) => {
// router.post("/sync", authenticate, async (req, res) => {
  try {
    let cssContent = "";

    await base("Duda Css")
      .select({
        view: "Grid view",
      })
      .eachPage(async (records, fetchNextPage) => {
        records.forEach((record) => {
          const name = record.get("Name");
          const css = record.get("Css");

          if (css) {
            cssContent += `/* ${name || "Unnamed"} */\n`;
            cssContent += `${css}\n\n`;
          }
        });

        fetchNextPage();
      });

    // File path
    const filePath = path.join(__dirname, "../../../public/css/duda.css");

    // Write CSS file
    fs.writeFileSync(filePath, cssContent, "utf8");

    return res.json({
      success: true,
      message: "CSS synced successfully",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error syncing CSS",
    });
  }
}
// });

module.exports = { syncCss };
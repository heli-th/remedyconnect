const bycrypt = require("bcryptjs");
const crypto = require("crypto");
const validator = require("validator");
const axios = require("axios");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const { createToken } = require("../services/TokenServices");
const RESTRESPONSE = require("../utils/RESTRESPONSE");
const cheerio = require("cheerio");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
require('dotenv').config();

/* BY CLIENT */
const GetArticlesListByClient = async (req, res) => {
  const airTableId = req.query.airtableId; 

  if (!airTableId) { 
    return res.status(404).send(
      RESTRESPONSE(false, "AirtableId is required in query parameters")
    );
  }

  try {
    const articles = await getCurrentClientArticles(airTableId);
    return res.send(
      RESTRESPONSE(true, "Articles Fetched For Category", {
        articles: articles,
      })
    );
  } catch (error) {
    return res.status(500).send(
      RESTRESPONSE(false, "Failed to fetch articles", { error: error.message })
    );
  }
};

/* BY CATEGORY */
const GetArticlesListByClientCategory = async (req, res) => {
  const airTableId = req.query.airtableId; // Get airtableId from query parameters
  const collectionName = req.query.collection; // Get collection from query parameters

  if (!airTableId || !collectionName) { // Ensure both parameters are provided
    return res.status(404).send(
      RESTRESPONSE(false, "Both airtableId and CollectionName are required in query parameters")
    );
  }

  try {
    const articles = await getCurrentClientArticlesByCollection(airTableId, collectionName); // Fetch articles using airtableId
    return res.send(
      RESTRESPONSE(true, "Articles Fetched For Category", {
        articles: articles,
      })
    );
  } catch (error) {
    return res.status(500).send(
      RESTRESPONSE(false, "Failed to fetch articles", { error: error.message })
    );
  }
};

/* BY CATEGORY */
const GetArticlesListBykidSiteVideo = async (req, res) => {
  const airTableId = process.env.BASE_AIRTABLE_ID; // Get airtableId from query parameters// Get collection from query parameters

  if (!airTableId ) { // Ensure both parameters are provided
    return res.status(404).send(
      RESTRESPONSE(false, "AirtableId is required in query parameters")
    );
  }

  try {
    const articles = await getKidSIteVideosArticles(airTableId); // Fetch articles using airtableId
    return res.send(
      RESTRESPONSE(true, "Articles Fetched For Kid Site Video", {
        articles: articles,
      })
    );
  } catch (error) {
    return res.status(500).send(
      RESTRESPONSE(false, "Failed to fetch articles", { error: error.message })
    );
  }
};

/* BY CATEGORY */
const GetArticlesListByACI = async (req, res) => {
  const airTableId = process.env.BASE_AIRTABLE_ID; // Get airtableId from query parameters// Get collection from query parameters

  if (!airTableId ) { // Ensure both parameters are provided
    return res.status(404).send(
      RESTRESPONSE(false, "AirtableId is required in query parameters")
    );
  }

  try {
    const articles = await getACIArticles(airTableId); // Fetch articles using for After Care Instructions
    return res.send(
      RESTRESPONSE(true, "Articles Fetched For After Care Instructions", {
        articles: articles,
      })
    );
  } catch (error) {
    return res.status(500).send(
      RESTRESPONSE(false, "Failed to fetch articles", { error: error.message })
    );
  }
};


const GetSCRelatedArticles = async (req, res) => {
  try {
    const articles = await FetchSCRelatedArticles(); 
    return res.send(
      RESTRESPONSE(true, "Articles Fetched", {
        articles: articles,
      })
    );
  } catch (error) {
    return res.status(500).send(
      RESTRESPONSE(false, "Failed to fetch articles", { error: error.message })
    );
  }
};

const GetSCArticlesImages = async (req, res) => {
  try {
    const articles = await FetchSCArticlesImages(); 
    return res.send(
      RESTRESPONSE(true, "Articles Images Fetched", {
        articles: articles,
      })
    );
  } catch (error) {
    return res.status(500).send(
      RESTRESPONSE(false, "Failed to fetch images", { error: error.message })
    );
  }
};

/* HELPERS */
async function getKidSIteVideosArticles(airTableId) {
  const ARTICLE_PATH = `https://api.airtable.com/v0/{airTableId}/Master%20Articles?view=${encodeURI("Kid Site Videos")}`;
  const TOKEN = "patPKums8BAqkxmBZ.f0c93dd65972e6c1acb4185174d5ce154a271e900e7b761b20557f3101a94426";

  let offset = "";
  let arrArticles = [];
  let articlesFetched = 0; // Counter to track the number of fetch requests

  while (offset !== "done" && articlesFetched < 50) { // Limit to 50 fetch requests
    let articles = ARTICLE_PATH.replace(/{airTableId}/g, airTableId);
    if (offset) {
      articles += `&offset=${offset}`;
    }

    try {
      const response = await axios.get(articles, {
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json'
        }
      });

      let clientArticles = response.data;
      arrArticles.push(...clientArticles.records); // Flatten the records into a single array

      offset = clientArticles.offset || "done";
      articlesFetched++;
    } catch (error) {
      console.error(`Failed to fetch articles: ${error.message}`);
      break;
    }
  }

  console.log(`Fetched ${arrArticles.length} articles.`);
  return arrArticles;
}

async function getACIArticles(airTableId) {
  const ARTICLE_PATH = `https://api.airtable.com/v0/{airTableId}/Master%20Articles?view=${encodeURI("After Care Instructions")}`;
  const TOKEN = "patPKums8BAqkxmBZ.f0c93dd65972e6c1acb4185174d5ce154a271e900e7b761b20557f3101a94426";

  let offset = "";
  let arrArticles = [];
  let articlesFetched = 0; // Counter to track the number of fetch requests

  while (offset !== "done" && articlesFetched < 50) { // Limit to 50 fetch requests
    let articles = ARTICLE_PATH.replace(/{airTableId}/g, airTableId);
    if (offset) {
      articles += `&offset=${offset}`;
    }

    try {
      const response = await axios.get(articles, {
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json'
        }
      });

      let clientArticles = response.data;
      arrArticles.push(...clientArticles.records); // Flatten the records into a single array

      offset = clientArticles.offset || "done";
      articlesFetched++;
    } catch (error) {
      console.error(`Failed to fetch articles: ${error.message}`);
      break;
    }
  }

  console.log(`Fetched ${arrArticles.length} articles.`);
  return arrArticles;
}

async function getCurrentClientArticlesByCollection(airTableId, CollectionName) {
  const ARTICLE_PATH = `https://api.airtable.com/v0/{airTableId}/Articles?view=${encodeURI(CollectionName)}`;
  const TOKEN = "patPKums8BAqkxmBZ.f0c93dd65972e6c1acb4185174d5ce154a271e900e7b761b20557f3101a94426";

  let offset = "";
  let arrArticles = [];
  let articlesFetched = 0; // Counter to track the number of fetch requests

  while (offset !== "done" && articlesFetched < 50) { // Limit to 50 fetch requests
    let articles = ARTICLE_PATH.replace(/{airTableId}/g, airTableId);
    if (offset) {
      articles += `&offset=${offset}`;
    }

    try {
      const response = await axios.get(articles, {
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json'
        }
      });

      let clientArticles = response.data;
      arrArticles.push(...clientArticles.records); // Flatten the records into a single array

      offset = clientArticles.offset || "done";
      articlesFetched++;
    } catch (error) {
      console.error(`Failed to fetch articles: ${error.message}`);
      break;
    }
  }

  console.log(`Fetched ${arrArticles.length} articles.`);
  return arrArticles;
}

async function getCurrentClientArticles(airTableId) {
  const ARTICLE_PATH='https://api.airtable.com/v0/{airTableId}/Articles?view=Grid%20view';
  const TOKEN = "patPKums8BAqkxmBZ.f0c93dd65972e6c1acb4185174d5ce154a271e900e7b761b20557f3101a94426";
  let offset = "";
  let arrArticles = [];
  let articlesFetched = 0; // Track the number of articles fetched
  const MAX_ARTICLES = 1000; // Limit the total number of articles fetched

  while (offset !== "done" && articlesFetched < MAX_ARTICLES) {
    let articlesUrl = ARTICLE_PATH.replace(/{airTableId}/g, airTableId);
    if (offset) {
      articlesUrl += `&offset=${offset}`;
    }

    let response = await fetch(articlesUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json'
      }
    });

    let clientArticles = await response.json();
    
    if (clientArticles.records) {
      arrArticles.push(...clientArticles.records);
      articlesFetched += clientArticles.records.length;
    }

    offset = clientArticles.offset || "done";
  }

  console.log(`Fetched ${arrArticles.length} articles for Airtable ID: ${airTableId}`);
  return arrArticles;
}

const GetFileContentByType = async (req, res) => {
  const fileUrl = req.query.fileUrl; 
  const fileType = req.query.type; 

  if (!fileUrl || !fileType) { 
    return res.status(404).send(
      RESTRESPONSE(false, "File Url and File type is required in query parameters")
    );
  }

  try {
    // Use axios to fetch the file as a buffer
    const axiosResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(axiosResponse.data);

    let htmlContent;
    if (fileType === "text/html") {
      const html = buffer.toString("utf8");
      const $ = cheerio.load(html);
      htmlContent = $.html();
    } else if (fileType === "application/pdf") {
      const data = await pdfParse(buffer);
      htmlContent = `<div>${data.text.replace(/\n/g, "<br>")}</div>`;
    } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.convertToHtml({ buffer });
      htmlContent = result.value;
    } else {
      throw new Error("Unsupported file type");
    }

    return res.send(
      RESTRESPONSE(true, "File content extracted successfully", { data: htmlContent })
    );
  } catch (err) {
    return res.status(500).send(
      RESTRESPONSE(false, "Error extracting content", { error: err.message })
    );
  }
}

async function FetchSCRelatedArticles(airtableId="appodPMCS4YQxZWGl") {
  let articles = `https://api.airtable.com/v0/${airtableId}/Self%20Care%20Related%20Articles?view=${encodeURI("Grid view")}`;
  const TOKEN = "patPKums8BAqkxmBZ.f0c93dd65972e6c1acb4185174d5ce154a271e900e7b761b20557f3101a94426";

  let offset = "";
  let arrArticles = [];
  let articlesFetched = 0; // Counter to track the number of fetch requests

  while (offset !== "done" && articlesFetched < 1000) { // Limit to 100 fetch requests
    if (offset) {
      articles = `https://api.airtable.com/v0/${airtableId}/Self%20Care%20Related%20Articles?view=${encodeURI("Grid view")}`;
      articles += `&offset=${offset}`;
    }
   
    try {
      const response = await axios.get(articles, {
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json'
        }
      });

      let clientArticles = response.data;
      arrArticles.push(...clientArticles.records); // Flatten the records into a single array
      

      offset = clientArticles.offset || "done";
      articlesFetched++;
    } catch (error) {
      console.error(`Failed to fetch articles: ${error.message}`);
      break;
    }
  }

  console.log(`Fetched ${arrArticles.length} articles.`);
  return arrArticles;
}

async function FetchSCArticlesImages() {
  let ARTICLE_PATH = `https://api.airtable.com/v0/appodPMCS4YQxZWGl/Self%20Care%20Images?view=${encodeURI("Grid view")}`;
  const TOKEN = "patPKums8BAqkxmBZ.f0c93dd65972e6c1acb4185174d5ce154a271e900e7b761b20557f3101a94426";

  let offset = "";
  let arrArticles = [];
  let articlesFetched = 0; // Counter to track the number of fetch requests

  while (offset !== "done" && articlesFetched < 50) { // Limit to 50 fetch requests
    if (offset) {
      ARTICLE_PATH = `https://api.airtable.com/v0/appodPMCS4YQxZWGl/Self%20Care%20Images?view=${encodeURI("Grid view")}`;
      ARTICLE_PATH += `&offset=${offset}`;
    }

    try {
      const response = await axios.get(ARTICLE_PATH, {
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json'
        }
      });

      let clientArticles = response.data;
      arrArticles.push(...clientArticles.records); // Flatten the records into a single array

      offset = clientArticles.offset || "done";
      articlesFetched++;
    } catch (error) {
      console.error(`Failed to fetch articles: ${error.message}`);
      break;
    }
  }

  console.log(`Fetched ${arrArticles.length} articles.`);
  return arrArticles;
}

module.exports = {
  GetArticlesListByClient,
  GetArticlesListByClientCategory,
  GetArticlesListBykidSiteVideo,
  GetArticlesListByACI,
  GetFileContentByType,
  GetSCRelatedArticles,
  GetSCArticlesImages,
};
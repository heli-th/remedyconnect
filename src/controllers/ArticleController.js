const RESTRESPONSE = require("../utils/RESTRESPONSE");
const { fetchAirtableView, fetchCollectionDataWithFilters, getPublisherByPublisherName, fetchClientAccessAccount } = require("../services/AirtableService");
const { default: axios } = require("axios");
const cheerio = require("cheerio");
const mammoth = require("mammoth");

const BASE_ID = process.env.BASE_AIRTABLE_ID;

const GetArticlesListByClient = async (req, res) => {
  const baseId = req.query.airtableId;
  const useCache = req.query.useCache !== "false";
  if (!baseId)
    return res.status(400).send(RESTRESPONSE(false, "airtableId is required"));

  try {
    const articles = await fetchAirtableView(baseId, "Articles", "Grid view", useCache);
    res.send(RESTRESPONSE(true, "Articles fetched", { articles }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

const GetArticlesListByClientCategory = async (req, res) => {
  const baseId = req.query.airtableId;
  const view = req.query.collection;
  const useCache = req.query.useCache !== "false";

  if (!baseId || !view)
    return res.status(400).send(
      RESTRESPONSE(false, "airtableId and collection are required")
    );

  try {
    const articles = await fetchAirtableView(baseId, "Articles", view, useCache);
    res.send(RESTRESPONSE(true, "Articles by category fetched", { articles }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

const GetArticlesListBykidSiteVideo = async (req, res) => {
  try {
    const useCache = req.query.useCache !== "false";
    const articles = await fetchAirtableView(BASE_ID, "Master Articles", "Kid Site Videos", useCache);
    res.send(RESTRESPONSE(true, "Kid Site Videos fetched", { articles }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

const GetArticlesListByACI = async (req, res) => {
  try {
    const useCache = req.query.useCache !== "false";
    const articles = await fetchAirtableView(BASE_ID, "Master Articles", "After Care Instructions", useCache);
    res.send(RESTRESPONSE(true, "After Care Instructions fetched", { articles }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

const GetSCRelatedArticles = async (req, res) => {
  try {
    const useCache = req.query.useCache !== "false";
    const articles = await fetchAirtableView(BASE_ID, "Self Care Related Articles", "Grid view", useCache);
    res.send(RESTRESPONSE(true, "SC Related Articles fetched", { articles }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

const GetSCArticlesImages = async (req, res) => {
  try {
    const useCache = req.query.useCache !== "false";
    const articles = await fetchAirtableView(BASE_ID, "Self Care Images", "Grid view", useCache);
    res.send(RESTRESPONSE(true, "SC Article Images fetched", { articles }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

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

const getCollectionDataFromGlobalBase = async (req, res) => {
  const { base, publisherName } = req.params;
  const useCache = req.query.useCache !== "false";

  if (!base)
    return res.status(400).send(RESTRESPONSE(false, "base is required"));

  try {
    /**Check Client Access */
    const clientAccount = await fetchClientAccessAccount(base, BASE_ID, useCache);
    if (!clientAccount || clientAccount.length === 0) {
      return res.status(403).send(RESTRESPONSE(false, "No access to the base"));
    }

    /** Get publisher Id */
    const publisherData = await getPublisherByPublisherName(BASE_ID, publisherName, useCache);
    if (!publisherData || publisherData.length === 0) {
      return res.status(404).send(RESTRESPONSE(false, "Publisher not found"));
    }
    const publisherNameValue = publisherData.fields["Library Name"];
    const publisherId = publisherData.id

    /**Check client has publisher access */
    const clientHasPublisherAccess = clientAccount.some(account => {
      const allowedPublishers = account.fields["Global Publisher Direct Access"] || [];
      return allowedPublishers && allowedPublishers.includes(publisherId);
    });

    if (!clientHasPublisherAccess) {
      return res.status(403).send(RESTRESPONSE(false, "No access to the publisher"));
    }

    /**Get collection data by publisher id */
    const articles = await fetchCollectionDataWithFilters(BASE_ID, "Master Articles", "Grid view", null, null, null, publisherNameValue, useCache);
    res.send(RESTRESPONSE(true, "Articles fetched", { articles }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
}

module.exports = {
  GetArticlesListByClient,
  GetArticlesListByClientCategory,
  GetArticlesListBykidSiteVideo,
  GetArticlesListByACI,
  GetSCRelatedArticles,
  GetSCArticlesImages,
  GetFileContentByType,
  getCollectionDataFromGlobalBase
};

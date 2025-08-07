const RESTRESPONSE = require("../utils/RESTRESPONSE");
const { fetchAirtableView } = require("../services/AirtableService");

const BASE_ID = process.env.BASE_AIRTABLE_ID;

const GetArticlesListByClient = async (req, res) => {
  const baseId = req.query.airtableId;
  if (!baseId)
    return res.status(400).send(RESTRESPONSE(false, "airtableId is required"));

  try {
    const articles = await fetchAirtableView(baseId, "Articles", "Grid view");
    res.send(RESTRESPONSE(true, "Articles fetched", { articles }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

const GetArticlesListByClientCategory = async (req, res) => {
  const baseId = req.query.airtableId;
  const view = req.query.collection;
  if (!baseId || !view)
    return res.status(400).send(
      RESTRESPONSE(false, "airtableId and collection are required")
    );

  try {
    const articles = await fetchAirtableView(baseId, "Articles", view);
    res.send(RESTRESPONSE(true, "Articles by category fetched", { articles }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

const GetArticlesListBykidSiteVideo = async (req, res) => {
  try {
    const articles = await fetchAirtableView(BASE_ID, "Master Articles", "Kid Site Videos");
    res.send(RESTRESPONSE(true, "Kid Site Videos fetched", { articles }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

const GetArticlesListByACI = async (req, res) => {
  try {
    const articles = await fetchAirtableView(BASE_ID, "Master Articles", "After Care Instructions");
    res.send(RESTRESPONSE(true, "After Care Instructions fetched", { articles }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

const GetSCRelatedArticles = async (req, res) => {
  try {
    const articles = await fetchAirtableView(BASE_ID, "Self Care Related Articles", "Grid view");
    res.send(RESTRESPONSE(true, "SC Related Articles fetched", { articles }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

const GetSCArticlesImages = async (req, res) => {
  try {
    const articles = await fetchAirtableView(BASE_ID, "Self Care Images", "Grid view");
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

module.exports = {
  GetArticlesListByClient,
  GetArticlesListByClientCategory,
  GetArticlesListBykidSiteVideo,
  GetArticlesListByACI,
  GetSCRelatedArticles,
  GetSCArticlesImages,
  GetFileContentByType
};

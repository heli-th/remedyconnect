const axios = require("axios");
const { getCache, setCache } = require("../services/cacheServices");

const KidsSiteVideo = async (req, res) => {
  const { slug, language, subCategory } = req.query;
  const key = "appodPMCS4YQxZWGl";
  const table = "Master Articles";
  const view = "Kid Site Videos";
  let base = key;

  if (!key) {
    return res
      .status(400)
      .send("Missing required parameter: key for client base");
  }

  // Build cache key based on query params
  const cacheKey = `symptom-checker:${key}:${table}:${view}:${slug || ""}:${
    req.query.page || 1
  }:${req.query.pageSize || 12}:${language || "all"}:${subCategory || "all"}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    res.setHeader("Content-Type", "text/json");
    return res.send(cachedData);
  }

  const urlBase = `https://api.airtable.com/v0/${base}/${encodeURIComponent(
    table
  )}?view=${encodeURIComponent(view)}`;

  let allRecords = [];

  try {
    if (slug) {
      try {
        const filterByFormula = `{Article URL} = '${slug}'`;
        const response = await axios.get(urlBase, {
          headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
          params: {
            filterByFormula,
            maxRecords: 1,
          },
        });
        if (response.data.records && response.data.records.length > 0) {
          const record = response.data.records[0].fields;
          // Helper function to safely render HTML fields
          const safe = (val) => val || "";
          // Helper for boolean display
          const yesNo = (val) =>
            val === true ? "Yes" : val === false ? "No" : "";
          // Helper for array display
          const arr = (val) =>
            Array.isArray(val) ? val.join(", ") : val || "";

          let html = "";
          // Conditionally render Go Back button

          // console.log("Publisher:", safe(record["Publisher"]));

          html = ` <div class="remedy-articleBody">
      <section>
      <h3>${safe(record["Article Name"])}</h3>
          <div class="video-wrapper">
           <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
           <iframe src="${safe(
             record["Media Link"]
           )}" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
             
        </div>
        </div>
      </section>
      <section class="remedy-articleSection articleSummary">
        ${safe(record["Article Summary"])}
      </section>
    </div>`;

          setCache(cacheKey, `<body>${html}</body>`);

          res.setHeader("Content-Type", "text/html");
          return res.send(`<body>${html}</body>`);
        } else {
          return res.status(404).send("Article not found.");
        }
      } catch (err) {
        return res.status(500).send("Failed to load article detail.");
      }
    }

    // Parse pagination parameters from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 12;
    const offset = (page - 1) * pageSize;

    let conditions = [];

    if (language && language.toLowerCase() !== "all") {
      conditions.push(`{Language} = '${language}'`);
    }

    if (subCategory && subCategory.toLowerCase() !== "all") {
      const safeSubCategory = subCategory.replace(/'/g, "\\'");
      conditions.push(`{Sub Category} = '${safeSubCategory}'`);
    }

    let filterByFormula = "";
    if (conditions.length > 0) {
      filterByFormula = `AND(${conditions.join(", ")})`;
    }

    // Fetch all records from Airtable (could be improved for large datasets)
    let records = [];
    let offsetToken = undefined;
    do {
      const params = {
        pageSize: 100,
        ...(offsetToken && { offset: offsetToken }),
      };
      if (filterByFormula) {
        params.filterByFormula = filterByFormula;
      }
      const response = await axios.get(urlBase, {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
        params,
      });
      const data = response.data;
      if (data.records && data.records.length > 0) {
        records.push(...data.records);
      }
      offsetToken = data.offset;
    } while (offsetToken);

    // Map records to desired format (with Vimeo thumbnail)
    const mappedRecords = await Promise.all(
      records.map(async (record) => {
        const fields = record.fields;
        const mediaLink = fields["Media Link"] || "";
        let thumbnailUrl = "";

        const vimeoIdMatch = mediaLink.match(/vimeo\.com\/(?:video\/)?(\d+)/);

        if (vimeoIdMatch) {
          const vimeoId = vimeoIdMatch[1];
          try {
            const response = await axios.get(
              `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`
            );
            const vimeoData = response.data;
            thumbnailUrl =
              vimeoData.thumbnail_url_with_play_button ||
              vimeoData.thumbnail_url ||
              `${process.env.NODE_SERVER_URL}/static/images/default-video-thumbnail.png`;
          } catch (e) {
            console.error("Failed to load Vimeo thumbnail", e);
          }
        } else {
          // fallback or log
        }

        return {
          id: record.id,
          fields: {
            "Article Name": fields["Article Name"] || "",
            "Article Summary": fields["Article Summary"] || "",
            "Article URL": fields["Article URL"] || "",
            "Article HTML": fields["Article HTML"] || "",
            "Video Thumbnail":
              thumbnailUrl ||
              `${process.env.NODE_SERVER_URL}/static/images/default-video-thumbnail.png`,
          },
        };
      })
    );

    // Paginate results
    const paginatedRecords = mappedRecords.slice(offset, offset + pageSize);

    // Prepare pagination metadata
    const totalRecords = mappedRecords.length;
    const totalPages = Math.ceil(totalRecords / pageSize);

    const responsePayload = {
      page,
      pageSize,
      totalRecords,
      totalPages,
      records: paginatedRecords,
    };

    setCache(cacheKey, responsePayload);

    res.setHeader("Content-Type", "application/json");
    res.send(responsePayload);
  } catch (err) {
    res.status(500).send("Failed to load widget.");
  }
};

module.exports = {
  KidsSiteVideo,
};

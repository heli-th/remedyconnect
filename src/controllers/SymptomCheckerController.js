const axios = require("axios");
const { getRecordByAccessKey } = require("../utils/airtableAPIs");
const { getCache, setCache } = require("../services/cacheServices");
const {
  getAllowedDomains,
  getGlobalBaseAllowedDomains,
} = require("../services/AirtableService");

const symptomCheckerData = async (req, res) => {
  const origin = req.headers.origin;
  const { key, slug } = req.query;
  const table = "Articles";
  const view = "Is Your Child Sick";
  let hostname;

  try {
    hostname = new URL(origin).hostname;
  } catch {
    hostname = origin;
  }

  if (!key) {
    return res.status(400).send("Missing required parameters: key");
  }

  if (!key) {
    return res
      .status(400)
      .send("Missing required parameter: key for client base");
  }

  if (key !== "appodPMCS4YQxZWGl") {
    const record = await getRecordByAccessKey({
      base: "appodPMCS4YQxZWGl",
      table: "Client Access",
      accessKey: key,
    });
    if (record && typeof record === "object" && !Array.isArray(record)) {
      base = record.fields["AirTable Id"];
      const allowedDomains = await getAllowedDomains(base);

      // Normalize origin check
      if (
        !origin ||
        origin === "null" ||
        !allowedDomains?.some(
          (domain) =>
            domain.includes("://")
              ? domain === origin // if stored with protocol, match full origin
              : domain === hostname // if stored without protocol, match hostname
        )
      ) {
        return res
          .status(403)
          .json({ message: "CORS Error: Origin not allowed" });
      }

      displayInList = record.fields["Display Fields In List"] || []; // Title, Summary, etc.
      // Display Fields In Grid can be different from List, so we keep both
      displayInGrid = record.fields["Display Fields In Grid"] || []; //Title, Summary, etc.
    } else {
      console.log("Invalid Access Key");
    }
  } else {
    const allowedDomains = await getGlobalBaseAllowedDomains();
    // Normalize origin check
    if (
      !origin ||
      origin === "null" ||
      !allowedDomains?.some(
        (domain) =>
          domain.includes("://")
            ? domain === origin // if stored with protocol, match full origin
            : domain === hostname // if stored without protocol, match hostname
      )
    ) {
      return res
        .status(403)
        .json({ message: "CORS Error: Origin not allowed" });
    }
  }

  // Build cache key based on query params
  const cacheKey = `symptom-checker:${key}:${table}:${view}:${slug || ""}`;
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
          if (
            safe(record["Publisher"]) === "Self Care Decisions" ||
            safe(record["Publisher"]) === "Self Care Decisions Spanish"
          ) {
            html = `
                     <div class="article-detail-full">

                    <h2 class="heading">${
                      safe(record["Article Title"]) || "Untitled"
                    }</h2>
                    <main>
                        <section>
                        ${safe(record["Article Summary"])}
                        </section>

                        <section>
                        ${safe(record["Article HTML"])}
                        </section>

                        <section class="when-to-call">
                        <h3>When to Call for ${
                          safe(record["Article Title"]) || "Untitled"
                        }</h3>
                        <div class="call-grid" role="region" aria-label="When to Call for ${
                          safe(record["Article Title"]) || "Untitled"
                        }">
                             ${
                               safe(record["HTML Column 1"])
                                 ? `
                                <div class="call-box" tabindex="0" aria-labelledby="call911Title">
                                    ${safe(record["HTML Column 1"])}
                                </div>`
                                 : ""
                             }
                            ${
                              safe(record["HTML Column 2"])
                                ? `
                                <div class="call-box" tabindex="0" aria-labelledby="contact24Title">
                                    ${safe(record["HTML Column 2"])}
                                </div>`
                                : ""
                            }
                            ${
                              safe(record["HTML Column 3"])
                                ? `
                                <div class="call-box" tabindex="0" aria-labelledby="selfCareTitle">
                                    ${safe(record["HTML Column 3"])}
                                </div>`
                                : ""
                            }
                        </div>
                        </section>

                        <section>
                        ${safe(record["HTML Advice"])}

                        <p class="strong-p" style="margin-top: 24px;">Remember! Contact your doctor if you or your child develop any "Contact Your Doctor" symptoms.</p>

                        <p class="disclaimer">
                            <strong>Disclaimer:</strong> this health information is for educational purposes only. You, the reader, assume full responsibility for how you choose to use it.
                        </p>
                        <p class="disclaimer" style="font-weight: 700; margin-top: 4px;">
                            ${safe(record["Copyright"])}
                        </p>
                        <p class="disclaimer" style="font-weight: 700; margin-top: 2px;">
                            Reviewed:  ${safe(
                              record["Last Reviewed"].split("T")[0]
                            )}/Updated: ${safe(
              record["Last Updated"].split("T")[0]
            )}
                        </p>
                        </section>
                    </main>`;
          }

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
    const response = await axios.get(urlBase, {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
    });
    const data = response.data;
    if (data.records && data.records.length > 0) {
      allRecords.push(...data.records);
    }

    setCache(cacheKey, allRecords);

    res.setHeader("Content-Type", "text/json");
    res.send(allRecords);
  } catch (err) {
    res.status(500).send("Failed to load widget.");
  }
};

module.exports = {
  symptomCheckerData,
};

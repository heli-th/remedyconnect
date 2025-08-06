//https://externalcontent.remedyconnect.com base URL
const axios = require("axios");
require("dotenv").config();
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes TTL


/* Render Airtable Widget */
const Widget = async (req, res) => {
    const { isclientbase, key, table, view, displayType = "grid", slug } = req.query;
    let base;
    let displayInList = [];
    let displayInGrid = [];
    if (!key || !table || !view) {
        return res.status(400).send("Missing required parameters: base, table, or view");
    }

    // Determine if the request is for a client base or not
    const isClientBase = isclientbase === "true";
    if (isClientBase && !key) {
        return res.status(400).send("Missing required parameter: key for client base");
    }
    if (isClientBase && key !== "appodPMCS4YQxZWGl") {
        const record = await getRecordByAccessKey({
            base: "appodPMCS4YQxZWGl",
            table: "Client Access",
            accessKey: key
        });
        if (record && typeof record === 'object' && !Array.isArray(record)) {
            base = record.fields["AirTable Id"];
            displayInList = record.fields["Display Fields In List"] || []; // Title, Summary, etc.
            // Display Fields In Grid can be different from List, so we keep both
            displayInGrid = record.fields["Display Fields In Grid"] || [];//Title, Summary, etc.
        } else {
            console.log("Invalid Access Key");
        }
    }

    base = isClientBase ? base : process.env.AIRTABLE_BASE_ID;
    const urlBase = `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}?view=${encodeURIComponent(view)}`;

    // If slug is present, render detail page for that article
    if (slug) {
        try {
            const url = `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`;
            const filterByFormula = `{Article URL} = '${slug}'`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
                params: {
                    filterByFormula,
                    maxRecords: 1
                }
            });
            if (response.data.records && response.data.records.length > 0) {
                const record = response.data.records[0].fields;
                // Helper function to safely render HTML fields
                const safe = (val) => val || "";
                // Helper for boolean display
                const yesNo = (val) => val === true ? "Yes" : val === false ? "No" : "";
                // Helper for array display
                const arr = (val) => Array.isArray(val) ? val.join(", ") : (val || "");
                let html = "";
                // Conditionally render Go Back button
                const goBackBtn = displayType === "dropdown" ? "" : `<button id="go-back-btn" class="go-back-btn">&larr; Go Back</button>`;
                // console.log("Publisher:", safe(record["Publisher"]));
                if (safe(record["Publisher"]) === "Self Care Decisions") {
                    html = `
                     <div class="article-detail-full">
                     ${goBackBtn}

                    <h2 class="heading">${safe(record["Article Title"]) || "Untitled"}</h2>
                    <main>
                        <section>
                        ${safe(record["Article Summary"])}
                        </section>

                        <section>
                        ${safe(record["Article HTML"])}
                        </section>

                        <section class="when-to-call">
                        <h3>When to Call for ${safe(record["Article Title"]) || "Untitled"}</h3>
                        <div class="call-grid" role="region" aria-label="When to Call for ${safe(record["Article Title"]) || "Untitled"}">
                             ${safe(record["HTML Column 1"]) ? `
                                <div class="call-box" tabindex="0" aria-labelledby="call911Title">
                                    ${safe(record["HTML Column 1"])}
                                </div>` : ''
                            }
                            ${safe(record["HTML Column 2"]) ? `
                                <div class="call-box" tabindex="0" aria-labelledby="contact24Title">
                                    ${safe(record["HTML Column 2"])}
                                </div>` : ''
                            }
                            ${safe(record["HTML Column 3"]) ? `
                                <div class="call-box" tabindex="0" aria-labelledby="selfCareTitle">
                                    ${safe(record["HTML Column 3"])}
                                </div>` : ''
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
                            Reviewed:  ${safe(record["Last Reviewed"].split("T")[0])}/Updated: ${safe(record["Last Updated"].split("T")[0])}
                        </p>
                        </section>
                        ${goBackBtn}
                    </main>`;
                } else if (safe(record["Publisher"]) === "American Academy of Pediatrics (AAP)") {
                    // Prepare PDF/article links using plain JS conditionals
                    const englishPDF = safe(record["English PDF"]);
                    const spanishPDF = safe(record["Spanish PDF"]);
                    const articleLink = safe(record["Article Link"]);
                    let pdfLinks = '';
                    if (englishPDF) {
                        pdfLinks += `<a href="${englishPDF}" target="_blank">PDF</a> | `;
                    }
                    if (spanishPDF) {
                        pdfLinks += `<a href="${spanishPDF}" target="_blank">Spanish Version</a> | `;
                    }
                    if (articleLink) {
                        pdfLinks += `<a href="${articleLink}" target="_blank">Print or Share</a>`;
                    }
                    // Remove trailing ' | ' if present
                    pdfLinks = pdfLinks.replace(/\|\s*$/, '');

                    html = `
                     <div class="article-detail-full">
                     ${goBackBtn}

                    <h2 class="heading">${safe(record["Article Title"]) || "Untitled"}</h2>
                    <main>
                        <div class="remedy-aaplogos">
                            <a href="https://aap.org" class="remedy-aap" target="_blank">
                            <img src="https://irp.cdn-website.com/94478288/dms3rep/multi/umbrella-logo.svg"
                                alt="American Academy of Pediatrics"></a>
                            <a href="https://publications.aap.org/" class="remedy-aap" target="_blank">
                            <img src="https://irp.cdn-website.com/94478288/dms3rep/multi/patiented2032140841.svg"
                                alt="Pediatric Patient Education"></a>
                        </div>
                        <div class="remedy-pdflinks">
                            ${pdfLinks}
                        </div>
                        <section>
                        ${safe(record["Article HTML"])}
                        </section>

                        <section>
                        <p class="strong-p" style="margin-top: 24px;">Remember! Contact your doctor if you or your child develop any "Contact Your Doctor" symptoms.</p>

                        <p class="disclaimer">
                            <strong>Disclaimer:</strong> this health information is for educational purposes only. You, the reader, assume full responsibility for how you choose to use it.
                        </p>
                        <p class="disclaimer" style="font-weight: 700; margin-top: 4px;">
                            ${safe(record["Copyright"])}
                        </p>
                        <p class="disclaimer" style="font-weight: 700; margin-top: 2px;">
                            Reviewed:  ${safe(record["Last Reviewed"].split("T")[0])}/Updated: ${safe(record["Last Updated"].split("T")[0])}
                        </p>
                        </section>
                        ${goBackBtn}
                    </main>`;
                } else if (safe(record["Publisher"]) === "Remedy Medical Contributors" || safe(record["Publisher"]) === "Practice") {
                    html = `
                     <div class="article-detail-full">
                     ${goBackBtn}

                    <h2 class="heading">${safe(record["Article Title"]) || "Untitled"}</h2>
                    <main>
                        
                        <section>
                        ${safe(record["Article HTML"])}
                        </section>

                        <section>
                        <p class="disclaimer" style="font-weight: 700; margin-top: 4px;">
                            ${safe(record["Copyright"])}
                        </p>
                        <p class="disclaimer" style="font-weight: 700; margin-top: 2px;">
                            Reviewed:  ${safe(record["Last Reviewed"].split("T")[0])}/Updated: ${safe(record["Last Updated"].split("T")[0])}
                        </p>
                        </section>
                        ${goBackBtn}
                    </main>`;
                } else if (safe(record["Publisher"]) === "CDC Website") {
                    html = `
                     <div class="article-detail-full">
                     ${goBackBtn}

                    <h2 class="heading">${safe(record["Article Title"]) || "Untitled"}</h2>
                    <main>
                        
                        <section>
                        ${safe(record["Article Summary"])}
                        </section>
                        <section>
                            <a class="btn" href=" ${safe(record["Article Link"])}" target="_blank">Download Or View</a>
                        </section>

                        <section>
                        <p class="disclaimer" style="font-weight: 700; margin-top: 4px;">
                            ${safe(record["Copyright"])}
                        </p>
                        <p class="disclaimer" style="font-weight: 700; margin-top: 2px;">
                            Reviewed:  ${safe(record["Last Reviewed"].split("T")[0])}/Updated: ${safe(record["Last Updated"].split("T")[0])}
                        </p>
                        </section>
                        ${goBackBtn}
                    </main>`;
                }
                res.setHeader("Content-Type", "text/html");
                return res.send(`<body>${html}</body>`);
            } else {
                return res.status(404).send("Article not found.");
            }
        } catch (err) {
            return res.status(500).send("Failed to load article detail.");
        }
    }

    // Pagination and search
    const pageSize = parseInt(req.query.pageSize, 40) || 40;
    const page = parseInt(req.query.page, 10) || 1;
    const search = req.query.search ? req.query.search.trim().toLowerCase() : "";

    // Build cache key based on query params
    const cacheKey = `widget:${isclientbase}:${key}:${table}:${view}:${displayType}:${req.query.page || 1}:${req.query.pageSize || 40}:${req.query.search || ""}`;
    const cachedHtml = cache.get(cacheKey);
    if (cachedHtml) {
        res.setHeader("Content-Type", "text/html");
        return res.send(`<body>${cachedHtml}</body>`);
    }

    // Fetch all records with pagination support
    let allRecords = [];
    let offset = undefined;
    try {
        do {
            let url = urlBase;
            if (offset) url += `&offset=${offset}`;
            url += `&pageSize=100`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
            });

            const data = response.data;
            if (data.records && data.records.length > 0) {
                allRecords.push(...data.records);
            }
            offset = data.offset;
        } while (offset);

        // Filter by search if provided
        let filteredRecords = allRecords;
        if (search) {
            filteredRecords = allRecords.filter(record => {
                const title = (record.fields["Article Title"] || "").toLowerCase();
                const summary = (record.fields["Article Summary"] || "").toLowerCase();
                return title.includes(search) || summary.includes(search);
            });
        }

        // Pagination logic
        const totalRecords = filteredRecords.length;
        const totalPages = Math.ceil(totalRecords / pageSize);
        const paginatedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

        // Pagination controls
        let paginationHtml = "";
        if (totalPages > 1) {
            paginationHtml = `<div class="pagination">`;
            for (let i = 1; i <= totalPages; i++) {
                paginationHtml += `<button class="${i === page ? "active" : ""}" onclick="goToPage(${i})">${i}</button>`;
            }
            paginationHtml += `</div>`;
        }

        // Search box
        let searchHtml = `
            <div class="search-box">
                <input type="text" placeholder="Search articles..." aria-label="Search articles" value="${search.replace(/"/g, "&quot;")}" onkeydown="searchRecords(event)">
            </div>
        `;

        let htmlContent = "";

        if (displayType === "grid") {
            htmlContent = `
                <div class="container">
                    ${searchHtml}
                    <div class="grid-wrapper">
                        ${paginatedRecords.map(record => {
                const slug = record.fields['Article URL'] || "#";
                let cardHtml = `<a class="widget-link cardlink" href="article-details/${slug}" target="_blank"><div class="card">`;
                if (displayInGrid.includes("Title")) {
                    const title = record.fields['Article Title'] || "Untitled";

                    cardHtml += `<div class="card-title">${title}</div>`;
                }
                if (displayInGrid.includes("Summary") && record.fields['Article Summary']) {
                    cardHtml += `<div class="card-summary">${record.fields['Article Summary']}</div>`;
                }
                cardHtml += `</div></a>`;
                return cardHtml;
            }).join("")}
                    </div>
                    ${paginationHtml}
                </div>
            `;
        } else if (displayType === "dropdown") {
            htmlContent = `
                <div class="container">
                    <div class="dropdown-wrapper">
                        <select class="dropdown">
                            <option selected disabled>Select an article</option>
                            ${filteredRecords.map(record => {
                const title = record.fields['Article Title'] || "Untitled";
                const slug = record.fields['Article URL'] || "";
                return `<option value="${slug}">${title}</option>`;
            }).join("")}
                        </select>
                    </div>
                </div>
            `;
        } else {
            // Default: List
            htmlContent = `
                <div class="container">
                    ${searchHtml}
                    <ul class="responsive-list">
                        ${paginatedRecords.map(record => {
                const slug = record.fields["Article URL"] || "#";
                let listHtml = `<a class="widget-link" href="article-details/${slug}" target="_blank"><li class="list-item">`;
                if (displayInList.includes("Title")) {
                    const title = record.fields["Article Title"] || "Untitled";

                    listHtml += `<div class="card-title">${title}</div>`;
                }
                if (displayInList.includes("Summary") && record.fields["Article Summary"]) {
                    listHtml += `<div class="card-summary">${record.fields["Article Summary"]}</div>`;
                }
                listHtml += `</li></a>`;
                return listHtml;
            }).join("")}
                    </ul>
                    ${paginationHtml}
                </div>
            `;
        }

        cache.set(cacheKey, htmlContent); // Cache the HTML content

        res.setHeader("Content-Type", "text/html");
        res.send(`<body>${htmlContent}</body>`);
    } catch (err) {
        res.status(500).send("Failed to load widget.");
    }
};

// Utility function to get a record by "Access Key For Code Snippet"
async function getRecordByAccessKey({ base, table, accessKey }) {
    const cacheKey = `accessKey:${base}:${table}:${accessKey}`;
    const cachedRecord = cache.get(cacheKey);
    if (cachedRecord) {
        return cachedRecord;
    }
    const url = `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`;
    const filterByFormula = `AND({Access Key For Code Snippet} = '${accessKey}')`;
    try {
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
            params: {
                filterByFormula,
                maxRecords: 1
            }
        });
        if (response.data.records && response.data.records.length > 0) {
            cache.set(cacheKey, response.data.records[0]); // Cache the record
            return response.data.records[0];
        }
        return null;
    } catch (err) {
        console.error("Error fetching record by access key:", err);
        throw err;
    }
}


module.exports = {
    Widget,
};


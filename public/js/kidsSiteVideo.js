// const SERVER_URL = "http://localhost:3000/";
const SERVER_URL = "https://externalcontent.remedyconnect.com/";

(async () => {
  const container = document.querySelector(".kids-site-video-widget");

  const loader = document.getElementById("loader-container");
  const key = container.getAttribute("data-key");
  const externalURL = container.getAttribute("data-detailPage-url");
  const videoPerPage = container.getAttribute("data-video-per-page") || 12;
  const language = container.getAttribute("data-attr-language") || "all";
  const subCategory = container.getAttribute("data-attr-sub-category") || "all";

  if (!container || !loader) {
    return console.error("Wrong code snippet: container or loader not found.");
  }

  if (!externalURL) {
    container.innerHTML = `<pre>Please include a detail page in the existing code snippet by adding the attribute data-detailPage-url.
Example usage:
data-detailPage-url="https://yourdomain.com/YOUR-DETAIL-PAGE-URL"

Replace "YOUR-DETAIL-PAGE-URL" with the actual path to your detail page.</pre>`;
    return;
  }

  loader.classList.remove("hide");
  // Remove previous content if any
  container.innerHTML = "";

  function showContent() {
    const slug = getSlugFromUrl();
    if (slug) {
      showArticleDetail(slug);
    } else {
      loadWidgetContent();
    }
  }

  showContent();

  function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("slug")) return params.get("slug");
    const pathParts = window.location.pathname.split("/");
    // const last = pathParts[pathParts.length - 1];
    // if (last && !last.includes('.') && last !== '') return last;
    return null;
  }

  async function showArticleDetail(slug) {
    loader.classList.remove("hide");
    try {
      let detailUrl = `${SERVER_URL}api/kids-site-video?slug=${encodeURIComponent(
        slug
      )}`;
      const res = await fetch(detailUrl);
      const html = await res.text();
      container.innerHTML =
        `<div class="kids-video-content">${html}</div>` +
        `<footer style="margin-top:24px;text-align:center;">
        <small>
          Powered by <a href="https://www.remedyconnect.com" target="_blank" rel="nofollow">RemedyConnect</a>.
          Please read our <a href="https://www.remedyconnect.com/disclaimer" target="_blank" rel="nofollow">disclaimer</a>.
        </small>
      </footer>`;

      // Attach go-back handler
      container.querySelectorAll(".go-back-btn").forEach((btn) => {
        btn.onclick = () => {
          // Remove slug from URL and reload dropdown
          const params = new URLSearchParams(window.location.search);
          params.delete("slug");
          history.pushState(
            {},
            "",
            `${window.location.pathname.split("?")[0]}${
              params.toString() ? "?" + params.toString() : ""
            }`
          );
          showContent();
        };
      });

      return;
    } catch (err) {
      container.innerHTML = "Failed to load content." + err.message;
    } finally {
      loader.classList.add("hide");
      setTimeout(() => {
        loader.style.display = "none";
      }, 400);
    }
  }

  async function loadWidgetContent() {
    container.innerHTML = "";

    let pageNumber = 1;
    const params = new URLSearchParams(window.location.search);
    if (params.has("page")) pageNumber = parseInt(params.get("page"), 10) || 1;

    let allVideos = [];
    let page, pageSize, totalPages, totalRecords;
    try {
      let detailUrl = `${SERVER_URL}api/kids-site-video?page=${pageNumber}&pageSize=${videoPerPage}&language=${encodeURIComponent(
        language
      )}&subCategory=${encodeURIComponent(subCategory)}`;
      const res = await fetch(detailUrl);
      if (!res.ok) {
        container.innerHTML = "Failed to fetch data:" + res.statusText;
        loader.classList.add("hide");
        setTimeout(() => {
          loader.style.display = "none";
        }, 400);
        return;
      }
      let responseData = await res.json();
      page = responseData.page || 1;
      pageSize = responseData.pageSize || 12;
      totalPages = responseData.totalPages || 1;
      totalRecords = responseData.totalRecords || 0;
      allVideos = responseData.records || [];
      loader.classList.add("hide");
      setTimeout(() => {
        loader.style.display = "none";
      }, 400);
    } catch (err) {
      console.error("Failed to fetch articles:", err);
      allVideos = [];
    }

    if (allVideos.length === 0) {
      container.innerHTML = `<p class="no-content">No videos available at the moment.</p>`;
      return;
    }

    // Render video items
    allVideos.forEach((video) => {
      const videoElement = document.createElement("div");
      videoElement.classList.add("video-item");

      let articleHtml = video.fields["Article HTML"];
      let thumbnailWrapper = document.createElement("div");
      thumbnailWrapper.classList.add("video-thumbnail");

      const img = document.createElement("img");
      img.src = video.fields["Video Thumbnail"];
      img.alt = video.fields["Article Name"] || "Video thumbnail";
      thumbnailWrapper.appendChild(img);

      const title = document.createElement("h3");
      title.textContent = video.fields["Article Name"];

      const description = document.createElement("p");
      description.textContent = video.fields["Article Summary"];

      const link = document.createElement("a");
      link.href = `${externalURL}?slug=${video.fields["Article URL"]}`;
      link.target = "_blank";
      link.textContent = "View";
      link.classList.add("watch-video-link");

      videoElement.appendChild(thumbnailWrapper);
      videoElement.appendChild(title);
      videoElement.appendChild(description);
      videoElement.appendChild(link);

      container.appendChild(videoElement);
    });

    // Pagination

    if (totalPages > 1) {
      const pagination = document.createElement("div");
      pagination.className = "kids-site-pagination";

      // Previous button
      const prevBtn = document.createElement("button");
      prevBtn.textContent = "Previous";
      prevBtn.disabled = page <= 1;
      prevBtn.onclick = () => changePage(page - 1);
      pagination.appendChild(prevBtn);

      // Page numbers
      for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement("button");
        pageBtn.textContent = i;
        if (i === page) pageBtn.classList.add("active");
        pageBtn.onclick = () => changePage(i);
        pagination.appendChild(pageBtn);
      }

      // Next button
      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Next";
      nextBtn.disabled = page >= totalPages;
      nextBtn.onclick = () => changePage(page + 1);
      pagination.appendChild(nextBtn);

      container.appendChild(pagination);
    }

    // Helper to change page
    function changePage(newPage) {
      loader.classList.remove("hide");
      loader.style.display = "";
      // Keep other query params if needed
      const params = new URLSearchParams(window.location.search);
      params.set("page", newPage);
      window.location.search = params.toString();
    }
  }
})();

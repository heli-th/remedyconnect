// const SERVER_URL = "http://localhost:3000/";
const SERVER_URL = "https://externalcontent.remedyconnect.com/";

(async () => {
  const container = document.querySelector(".kids-site-video-widget");
  const loader = document.getElementById("loader-container");
  const key = container.getAttribute("data-key");
  const externalURL = container.getAttribute("data-detailPage-url");

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
      container.innerHTML = "Failed to load content.";
    } finally {
      loader.classList.add("hide");
      setTimeout(() => {
        loader.style.display = "none";
      }, 400);
    }
  }

  async function loadWidgetContent() {
    container.innerHTML = "";

    let allVideos = [];
    try {
      let detailUrl = `${SERVER_URL}api/kids-site-video`;
      const res = await fetch(detailUrl);
      allVideos = await res.json();
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

    allVideos.forEach(async (video) => {
      const videoElement = document.createElement("div");
      videoElement.classList.add("video-item");

      articleHtml = video.fields["Article HTML"];
      let thumbnailWrapper = document.createElement("div");
      thumbnailWrapper.classList.add("video-thumbnail");

      const match = articleHtml.match(/src=['"]([^'"]+)['"]/);
      if (match && match[1]) {
        const vimeoIdMatch = match[1].match(/vimeo\.com\/(?:video\/)?(\d+)/);

        if (vimeoIdMatch) {
          const vimeoId = vimeoIdMatch[1];
          try {
            const response = await fetch(
              `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`
            );
            const data = await response.json();
            const thumbnailUrl =
              data.thumbnail_url_with_play_button ||
              data.thumbnail_url ||
              `${SERVER_URL}static/images/default-video-thumbnail.png`; // Set your default image path here

            const img = document.createElement("img");
            img.src = thumbnailUrl;
            img.alt = video.fields["Article Name"] || "Video thumbnail";
            thumbnailWrapper.appendChild(img);
          } catch (e) {
            console.error("Failed to load Vimeo thumbnail", e);
          }
        } else {
          console.warn("Invalid Vimeo URL:", vimeoUrl);
        }
      }

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
  }
})();

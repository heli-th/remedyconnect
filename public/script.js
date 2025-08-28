(async () => {
    const container = document.querySelector(".code-snippet-widget");
    const loader = document.getElementById("loader-overlay");
    if (container && (container.getAttribute('data-display') === 'list' || container.getAttribute('data-display') === 'grid')) {

        if (!container || !loader) return;

        // Show loader overlay
        loader.classList.remove("hide");

        // Set your widget configuration here
        const isclientbase = container.getAttribute("data-isclientbase");
        const key = container.getAttribute("data-key");
        const table = container.getAttribute("data-table");
        const view = container.getAttribute("data-view");
        const displayType = container.getAttribute("data-display") || "list";

        if (!key || !table || !view) {
            container.innerHTML = "Missing data attributes: data-key, data-table, or data-view.";
            return;
        }

        // Replace process.env.NODE_SERVER_URL with a hardcoded value or window.NODE_SERVER_URL
        // Example: let serverUrl = window.NODE_SERVER_URL || "https://your-server-url.com";
        let serverUrl = window.NODE_SERVER_URL || "https://externalcontent.remedyconnect.com";

        // Build the URL using window.location
        let url = `${serverUrl}/api/code/code-widget?isclientbase=${encodeURIComponent(isclientbase)}&key=${encodeURIComponent(key)}&table=${encodeURIComponent(table)}&view=${encodeURIComponent(view)}&displayType=${encodeURIComponent(displayType)}`;
        // Append search and page params from current URL if present
        const params = new URLSearchParams(window.location.search);
        if (params.has('search')) {
            url += `&search=${encodeURIComponent(params.get('search'))}`;
        }
        if (params.has('page')) {
            url += `&page=${encodeURIComponent(params.get('page'))}`;
        }

        let lastWidgetHtml = "";

        async function loadWidget() {
            loader.classList.remove("hide");
            try {
                const res = await fetch(url);
                const html = await res.text();
                lastWidgetHtml = html;
                container.innerHTML = html;
                enableSinglePageLinks();
            } catch (err) {
                console.error("Failed to load widget:", err);
                container.innerHTML = "Failed to load content.";
            } finally {
                loader.classList.add("hide");
                setTimeout(() => {
                    loader.style.display = "none";
                }, 400);
            }
        }

        // Helper: get slug from URL (either ?slug=... or /slug at end)
        function getSlugFromUrl() {
            const params = new URLSearchParams(window.location.search);
            if (params.has('slug')) return params.get('slug');
            const pathParts = window.location.pathname.split('/');
            //const last = pathParts[pathParts.length - 1];
            // crude check: if not empty and not .html/.js/.css, treat as slug
            //if (last && !last.includes('.') && last !== '') return last;
            return null;
        }

        // On load: check for slug in URL
        function isOnDetailPage() {
            return !!getSlugFromUrl();
        }

        // Only loadOrShow once, and don't call loadWidget if on detail page
        async function loadOrShow() {
            if (isOnDetailPage()) {
                await showArticleDetail(getSlugFromUrl(), { pushState: false });
            } else {
                await loadWidget();
            }
        }

        // Modified showArticleDetail to optionally push state
        async function showArticleDetail(slug, opts = { pushState: true }) {
            if (opts.pushState) {
                const params = new URLSearchParams(window.location.search);
                params.set('slug', slug);
                history.pushState({ slug }, '', `${window.location.pathname.split('?')[0]}?${params.toString()}`);
            }
            loader.classList.remove("hide");
            try {
                // Try to fetch detail from backend (if supported)
                let detailUrl = `${serverUrl}/api/code/code-widget?isclientbase=${encodeURIComponent(isclientbase)}&key=${encodeURIComponent(key)}&table=${encodeURIComponent(table)}&view=${encodeURIComponent(view)}&displayType=${encodeURIComponent(displayType)}&slug=${encodeURIComponent(slug)}`;
                const res = await fetch(detailUrl);
                const html = await res.text();
                // If backend returns a detail view, use it. Otherwise, fallback to client-side extraction.
                if (html.includes('id="go-back-btn"') || html.includes('class="go-back-btn"')) {
                    container.innerHTML = html + `<footer style="margin-top:2em;text-align:center;">
                        <small>
                            Powered by <a href="https://www.remedyconnect.com" target="_blank" rel="nofollow">RemedyConnect</a>.
                            Please read our <a href="https://www.remedyconnect.com/disclaimer" target="_blank" rel="nofollow">disclaimer</a>.
                        </small>
                    </footer>`;
                } else {
                    // Fallback: extract from lastWidgetHtml
                    showDetailFromHtml(slug);
                    return;
                }
                // Attach go-back handler
                container.querySelectorAll('.go-back-btn').forEach(btn => {
                    btn.onclick = () => restoreWidget();
                });
            } catch (err) {
                showDetailFromHtml(slug);
            } finally {
                loader.classList.add("hide");
            }
        }

        function showDetailFromHtml(slug) {
            // Fallback: extract article from lastWidgetHtml
            const parser = new DOMParser();
            const doc = parser.parseFromString(lastWidgetHtml, "text/html");
            let found = null;
            doc.querySelectorAll('.widget-link').forEach(link => {
                if ((link.getAttribute('data-slug') || link.getAttribute('href').split('/').pop()) === slug) {
                    found = link;
                }
            });
            if (!found) {
                container.innerHTML = `<div>Article not found.</div><button class="go-back-btn" id="go-back-btn">&larr; Go Back</button>`;
                container.querySelectorAll('.go-back-btn').forEach(btn => {
                    btn.onclick = () => restoreWidget();
                });
                return;
            }
            const title = found.querySelector('.card-title')?.textContent || "Untitled";
            const summary = found.querySelector('.card-summary')?.textContent || "";
            container.innerHTML = `
            <div class="article-detail">
                <button class="go-back-btn" id="go-back-btn" style="margin-bottom:1em;">&larr; Go Back</button>
                <h2>${title}</h2>
                <div>${summary}</div>
            </div>
        `;
            document.querySelectorAll('.go-back-btn').forEach(btn => {
                btn.onclick = () => restoreWidget();
            });
        }

        function restoreWidget(opts = { pushState: true }) {
            if (opts.pushState) {
                // Remove slug from URL
                const params = new URLSearchParams(window.location.search);
                params.delete('slug');
                history.pushState({}, '', `${window.location.pathname.split('?')[0]}${params.toString() ? '?' + params.toString() : ''}`);
            }
            // Instead of restoring lastWidgetHtml, reload the widget
            loadWidget();
        }

        // Listen for browser navigation (back/forward)
        window.addEventListener('popstate', (event) => {
            const slug = getSlugFromUrl();
            if (slug) {
                showArticleDetail(slug, { pushState: false });
            } else {
                restoreWidget({ pushState: false });
            }
        });

        // Patch go-back button to use restoreWidget with pushState
        function enableSinglePageLinks() {
            container.querySelectorAll('.widget-link').forEach(link => {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    const slug = this.getAttribute('data-slug') || this.getAttribute('href').split('/').pop();
                    showArticleDetail(slug);
                });
            });
            container.querySelectorAll('.go-back-btn').forEach(btn => {
                btn.onclick = () => restoreWidget();
            });
        }

        // Initial load
        await loadOrShow();

        // Expose for pagination/search
        window.goToPage = function (page) {
            const params = new URLSearchParams(window.location.search);
            params.set('page', page);
            // If on detail page, remove slug and go to list view for that page
            if (isOnDetailPage()) {
                params.delete('slug');
                history.pushState({}, '', `${window.location.pathname.split('?')[0]}?${params.toString()}`);
                loadWidget();
            } else {
                window.location.search = params.toString();
            }
        }
        window.searchRecords = function (e) {
            if (e.key === 'Enter') {
                const params = new URLSearchParams(window.location.search);
                params.set('search', e.target.value);
                params.set('page', 1);
                // If on detail page, remove slug and go to list view for that search
                if (isOnDetailPage()) {
                    params.delete('slug');
                    history.pushState({}, '', `${window.location.pathname.split('?')[0]}?${params.toString()}`);
                    loadWidget();
                } else {
                    window.location.search = params.toString();
                }
            }
        }
    } else if (container && container.getAttribute('data-display') === 'dropdown') {
        // If it's a dropdown widget, we handle it separately
        // --- BEGIN MODIFIED DROPDOWN LOGIC ---
        document.querySelectorAll('.code-snippet-widget').forEach(async (container) => {
            const loader = document.getElementById("loader-overlay");
            if (!container || !loader) return;

            loader.classList.remove("hide");

            const isclientbase = container.getAttribute("data-isclientbase");
            const key = container.getAttribute("data-key");
            const table = container.getAttribute("data-table");
            const view = container.getAttribute("data-view");
            const displayType = container.getAttribute("data-display") || "dropdown";
            const detailPageBaseUrl = container.getAttribute("data-detailPageBaseUrl");
           // console.log("Detail Page Base URL:", container);
            if (!detailPageBaseUrl) {
                container.innerHTML = `<pre>Please include a detail page in the existing code snippet by adding the attribute data-detailPageBaseUrl.
Example usage:
data-detailPageBaseUrl="https://yourdomain.com/YOUR-DETAIL-PAGE-URL"

Replace "YOUR-DETAIL-PAGE-URL" with the actual path to your detail page.</pre>`;
                return;
            }
            if (!key || !table || !view) {
                container.innerHTML = "Missing data attributes: data-key, data-table, or data-view.";
                return;
            }

            let serverUrl = window.NODE_SERVER_URL || "https://externalcontent.remedyconnect.com/"; // Replace with your server URL
            let url = `${serverUrl}/api/code/code-widget?isclientbase=${encodeURIComponent(isclientbase)}&key=${encodeURIComponent(key)}&table=${encodeURIComponent(table)}&view=${encodeURIComponent(view)}&displayType=${encodeURIComponent(displayType)}`;

            // Helper: get slug from URL
            function getSlugFromUrl() {
                const params = new URLSearchParams(window.location.search);
                if (params.has('slug')) return params.get('slug');
                const pathParts = window.location.pathname.split('/');
                // const last = pathParts[pathParts.length - 1];
                // if (last && !last.includes('.') && last !== '') return last;
                return null;
            }

            // Show article detail in the widget
            async function showArticleDetail(slug) {
                loader.classList.remove("hide");
                try {
                    let detailUrl = `${serverUrl}/api/code/code-widget?isclientbase=${encodeURIComponent(isclientbase)}&key=${encodeURIComponent(key)}&table=${encodeURIComponent(table)}&view=${encodeURIComponent(view)}&displayType=${encodeURIComponent(displayType)}&slug=${encodeURIComponent(slug)}`;
                    const res = await fetch(detailUrl);
                    const html = await res.text();
                    container.innerHTML = html;
                    // Attach go-back handler
                    container.querySelectorAll('.go-back-btn').forEach(btn => {
                        btn.onclick = () => {
                            // Remove slug from URL and reload dropdown
                            const params = new URLSearchParams(window.location.search);
                            params.delete('slug');
                            history.pushState({}, '', `${window.location.pathname.split('?')[0]}${params.toString() ? '?' + params.toString() : ''}`);
                            loadDropdown();
                        };
                    });
                } catch (err) {
                    container.innerHTML = "Failed to load content.";
                } finally {
                    loader.classList.add("hide");
                    setTimeout(() => {
                        loader.style.display = "none";
                    }, 400);
                }
            }

            // Load dropdown list
            async function loadDropdown() {
                loader.classList.remove("hide");
                try {
                    const res = await fetch(url);
                    const html = await res.text();
                    container.innerHTML = html;

                    // Add change handler to dropdown
                    const select = container.querySelector('.remedy-dropdown');
                    if (select && detailPageBaseUrl) {
                        select.addEventListener('change', function () {
                            const slug = this.value;
                            if (slug && slug !== "" && slug !== "Select an article") {
                                // Redirect to detail page with ?slug=...
                                window.top.location.href = detailPageBaseUrl.replace(/[\?&]$/, '') + '?slug=' + encodeURIComponent(slug);
                            }
                        });
                    }
                } catch (err) {
                    container.innerHTML = "Failed to load dropdown.";
                } finally {
                    loader.classList.add("hide");
                    setTimeout(() => {
                        loader.style.display = "none";
                    }, 400);
                }
            }

            // On load: if slug present, show detail, else show dropdown
            const slug = getSlugFromUrl();
            if (slug) {
                await showArticleDetail(slug);
            } else {
                await loadDropdown();
            }

            // Listen for browser navigation (back/forward)
            window.addEventListener('popstate', () => {
                const slug = getSlugFromUrl();
                if (slug) {
                    showArticleDetail(slug);
                } else {
                    loadDropdown();
                }
            });
        });
        // --- END MODIFIED DROPDOWN LOGIC ---
    }

})();




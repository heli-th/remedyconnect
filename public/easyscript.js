(async () => {
    const container = document.querySelector(".code-snippet-widget");
    const loader = document.getElementById("loader-overlay");

    // Utility: Show/hide loader
    function showLoader() {
        loader.classList.remove("hide");
        loader.style.display = "";
    }
    function hideLoader() {
        loader.classList.add("hide");
        setTimeout(() => { loader.style.display = "none"; }, 400);
    }

    // Utility: Get search, page, slug, and view params from URL
    function getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            search: params.get('search') || "",
            page: params.get('page') || "",
            slug: params.get('slug') || "",
            view: params.get('view') || ""
        };
    }

    // Utility: Update URL params
    function updateUrlParams(newParams) {
        const params = new URLSearchParams(window.location.search);
        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null) params.delete(key);
            else params.set(key, value);
        });
        history.pushState({}, '', `${window.location.pathname.split('?')[0]}${params.toString() ? '?' + params.toString() : ''}`);
    }

    // Main widget logic
    if (container && ["list", "grid", "easy"].includes(container.getAttribute('data-display'))) {
        if (!container || !loader) return;

        showLoader();
        const categoryList = container.getAttribute("data-list");
        const categories = categoryList.split(",");
        const isclientbase = container.getAttribute("data-isclientbase");
        const key = container.getAttribute("data-key");
        const table = container.getAttribute("data-table");
        let view = container.getAttribute("data-view");
        let displayType = container.getAttribute("data-display") || "list";
        // --- NEW: override view from URL if present ---
        const urlParams = getUrlParams();
        if (urlParams.view) {
            view = urlParams.view;
            container.setAttribute('data-view', view);
            container.setAttribute('data-display', 'list');
            displayType = "grid";
        }
        if (!key || !table || !view) {
            container.innerHTML = "Missing data attributes: data-key, data-table, or data-view.";
            return;
        }
        let serverUrl = window.NODE_SERVER_URL || "https://externalcontent.remedyconnect.com";
        let lastWidgetHtml = "";
        const listBackBtn = "<button class=\"go-back-btn\" id=\"go-backlist-btn\">&larr; Go Back</button>";
        let listItems = "";
        categories.forEach(item => {
            listItems += `<a class="show-widget" data-view="${item}"><div class="card"><div class="card-title navlink">${item}</div></div></a>`;
        });
        const listHtml = `<h1 class="rcTitle">Medical Library</h1><div class="grid-wrapper">${listItems}</div>`;
        let showEasyBackButton = false;

        async function loadWidget(showButton) {
            showLoader();
            try {
                let url = `${serverUrl}/api/code/code-widget?isclientbase=${encodeURIComponent(isclientbase)}&key=${encodeURIComponent(key)}&table=${encodeURIComponent(table)}&view=${encodeURIComponent(view)}&displayType=${encodeURIComponent(displayType)}`;
                const params = getUrlParams();
                if (params.search) url += `&search=${encodeURIComponent(params.search)}`;
                if (params.page) url += `&page=${encodeURIComponent(params.page)}`;
                const res = await fetch(url);
                const html = await res.text();
                let htmlWithButton = html;
                if (showButton) htmlWithButton = listBackBtn + `<h1 class="rcTitle">${container.getAttribute("data-view")}</h1>` + html;
                lastWidgetHtml = htmlWithButton;
                container.innerHTML = htmlWithButton;
                enableSinglePageLinks();
            } catch (err) {
                container.innerHTML = "Failed to load content.";
            } finally {
                hideLoader();
            }
            document.querySelectorAll('.go-back-btn').forEach(btn => {
                btn.onclick = () => restoreWidgetList();
            });
        }

        async function loadWidgetList() {
            showLoader();
            try {
                lastWidgetHtml = listHtml;
                container.innerHTML = listHtml;
                enableListLinks();
            } catch (err) {
                container.innerHTML = "Failed to load content.";
            } finally {
                hideLoader();
            }
        }

        async function loadWidgetSpecific(thisView) {
            // --- NEW: set view param in URL ---
            updateUrlParams({ view: thisView, slug: null, page: 1 });
            container.setAttribute('data-display', 'list');
            container.setAttribute('data-view', thisView);
            view = thisView;
            displayType = "grid";
            await loadOrShow();
        }

        function getSlugFromUrl() {
            return getUrlParams().slug;
        }
        function isOnDetailPage() {
            return !!getSlugFromUrl();
        }

        async function loadOrShow() {
            // --- NEW: check for view param in URL ---
            const params = getUrlParams();
            if (isOnDetailPage()) {
                await showArticleDetail(getSlugFromUrl(), { pushState: false });
            } else if (params.view) {
                // If view param is present, load that category's articles
                await loadWidget(true);
            } else if (container.getAttribute("data-display") == "easy") {
                showEasyBackButton = true;
                await loadWidgetList();
            } else {
                await loadWidget(showEasyBackButton);
            }
        }

        async function showArticleDetail(slug, opts = { pushState: true }) {
            if (opts.pushState) {
                updateUrlParams({ slug });
            }
            showLoader();
            try {
                let detailUrl = `${serverUrl}/api/code/code-widget?isclientbase=${encodeURIComponent(isclientbase)}&key=${encodeURIComponent(key)}&table=${encodeURIComponent(table)}&view=${encodeURIComponent(view)}&displayType=${encodeURIComponent(displayType)}&slug=${encodeURIComponent(slug)}`;
                const params = getUrlParams();
                if (params.search) detailUrl += `&search=${encodeURIComponent(params.search)}`;
                if (params.page) detailUrl += `&page=${encodeURIComponent(params.page)}`;
                const res = await fetch(detailUrl);
                const html = await res.text();
                if (html.includes('id="go-back-btn"') || html.includes('class="go-back-btn"')) {
                    container.innerHTML = html;
                } else {
                    showDetailFromHtml(slug);
                    return;
                }
                container.querySelectorAll('.go-back-btn').forEach(btn => {
                    btn.onclick = () => restoreWidget();
                });
            } catch (err) {
                showDetailFromHtml(slug);
            } finally {
                hideLoader();
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
                updateUrlParams({ slug: null });
            }
            loadWidget(showEasyBackButton);
        }
        function restoreWidgetList() {
            // --- NEW: remove view param from URL ---
            updateUrlParams({ view: null, slug: null, page: 1 });
            container.setAttribute("data-display", "easy");
            displayType = "easy";
            loadOrShow();
        }

        window.addEventListener('popstate', (event) => {
            const slug = getSlugFromUrl();
            if (slug) {
                showArticleDetail(slug, { pushState: false });
            } else {
                restoreWidget({ pushState: false });
            }
        });

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
        function enableListLinks() {
            container.querySelectorAll('.show-widget').forEach(link => {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    const view = this.getAttribute('data-view') || this.getAttribute('href').split('/').pop();
                    loadWidgetSpecific(view);
                });
            });
            container.querySelectorAll('.go-backlist-btn').forEach(btn => {
                btn.onclick = () => restoreWidgetList();
            });
        }

        // Initial load
        await loadOrShow();

        // Pagination/search
        window.goToPage = function (page) {
            updateUrlParams({ page });
            if (isOnDetailPage()) {
                updateUrlParams({ slug: null });
                loadWidget(showEasyBackButton);
            } else {
                loadWidget(showEasyBackButton);
            }
        }
        window.searchRecords = function (e) {
            if (e.key === 'Enter') {
                updateUrlParams({ search: e.target.value, page: 1 });
                if (isOnDetailPage()) {
                    updateUrlParams({ slug: null });
                    loadWidget(showEasyBackButton);
                } else {
                    loadWidget(showEasyBackButton);
                }
            }
        }
    } else if (container && container.getAttribute('data-display') === 'dropdown') {
        // --- BEGIN MODIFIED DROPDOWN LOGIC ---
        document.querySelectorAll('.code-snippet-widget').forEach(async (container) => {
            const loader = document.getElementById("loader-overlay");
            if (!container || !loader) return;

            showLoader();

            const isclientbase = container.getAttribute("data-isclientbase");
            const key = container.getAttribute("data-key");
            const table = container.getAttribute("data-table");
            const view = container.getAttribute("data-view");
            const displayType = container.getAttribute("data-display") || "dropdown";
            const detailPageBaseUrl = container.getAttribute("data-detailPageBaseUrl");
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

            let serverUrl = window.NODE_SERVER_URL || "https://externalcontent.remedyconnect.com/";
            let url = `${serverUrl}/api/code/code-widget?isclientbase=${encodeURIComponent(isclientbase)}&key=${encodeURIComponent(key)}&table=${encodeURIComponent(table)}&view=${encodeURIComponent(view)}&displayType=${encodeURIComponent(displayType)}`;

            function getSlugFromUrl() {
                return getUrlParams().slug;
            }

            async function showArticleDetail(slug) {
                showLoader();
                try {
                    let detailUrl = `${serverUrl}/api/code/code-widget?isclientbase=${encodeURIComponent(isclientbase)}&key=${encodeURIComponent(key)}&table=${encodeURIComponent(table)}&view=${encodeURIComponent(view)}&displayType=${encodeURIComponent(displayType)}&slug=${encodeURIComponent(slug)}`;
                    const params = getUrlParams();
                    if (params.search) detailUrl += `&search=${encodeURIComponent(params.search)}`;
                    if (params.page) detailUrl += `&page=${encodeURIComponent(params.page)}`;
                    const res = await fetch(detailUrl);
                    const html = await res.text();
                    container.innerHTML = html;
                    container.querySelectorAll('.go-back-btn').forEach(btn => {
                        btn.onclick = () => {
                            updateUrlParams({ slug: null });
                            loadDropdown();
                        };
                    });
                } catch (err) {
                    container.innerHTML = "Failed to load content.";
                } finally {
                    hideLoader();
                }
            }

            async function loadDropdown() {
                showLoader();
                try {
                    let dropdownUrl = url;
                    const params = getUrlParams();
                    if (params.search) dropdownUrl += `&search=${encodeURIComponent(params.search)}`;
                    if (params.page) dropdownUrl += `&page=${encodeURIComponent(params.page)}`;
                    const res = await fetch(dropdownUrl);
                    const html = await res.text();
                    container.innerHTML = html;

                    // Add change handler to dropdown
                    const select = container.querySelector('.dropdown');
                    if (select && detailPageBaseUrl) {
                        select.addEventListener('change', function () {
                            const slug = this.value;
                            if (slug && slug !== "" && slug !== "Select an article") {
                                window.location.href = detailPageBaseUrl.replace(/[\?&]$/, '') + '?slug=' + encodeURIComponent(slug);
                            }
                        });
                    }

                    // Add search input handler for dropdown mode
                    const searchInput = container.querySelector('.dropdown-search');
                    if (searchInput) {
                        searchInput.addEventListener('keydown', function (e) {
                            if (e.key === 'Enter') {
                                updateUrlParams({ search: e.target.value, page: 1 });
                                loadDropdown();
                            }
                        });
                    }
                } catch (err) {
                    container.innerHTML = "Failed to load dropdown.";
                } finally {
                    hideLoader();
                }
            }

            const slug = getSlugFromUrl();
            if (slug) {
                await showArticleDetail(slug);
            } else {
                await loadDropdown();
            }

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


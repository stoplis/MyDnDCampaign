(function () {
    const ITEMS = window.FAST_CRAFTING_ITEMS || [];
    const CATEGORIES = ["All", "Gear", "Weapons"];
    const TOKEN_TERMS = [
        "Bonus Action", "Utilize action", "Attack action", "Bright Light", "Dim Light",
        "Difficult Terrain", "Grappled", "Incapacitated", "Restrained", "Prone",
        "Speed", "Advantage", "Disadvantage", "Strength", "Dexterity", "Acrobatics",
        "Athletics", "Sleight of Hand"
    ];
    const TOKEN_RE = new RegExp(
        "\\b(?:\\d+d\\d+(?:\\s*[+\\-]\\s*\\d+)?|DC\\s*\\d+|\\d+\\s*(?:feet|foot|ft\\.?|minutes?|hours?|pounds?|lb\\.)|" +
        TOKEN_TERMS
            .sort((a, b) => b.length - a.length)
            .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"))
            .join("|") +
        ")\\b",
        "gi"
    );

    let activeFilter = "All";
    let searchTerm = "";

    const filtersEl = document.getElementById("filters");
    const searchEl = document.getElementById("search");
    const gridEl = document.getElementById("grid");
    const detailEl = document.getElementById("detail");
    const detailPanel = document.getElementById("detail-panel");

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[ch]));
    }

    function formatText(value) {
        return escapeHtml(value).replace(TOKEN_RE, '<span class="text-token">$&</span>');
    }

    function categorize(item) {
        return item.type.includes("Weapon") ? "Weapons" : "Gear";
    }

    function itemMeta(item) {
        return [item.cost, item.weight && item.weight !== "—" ? item.weight : "", item.damage, item.properties].filter(Boolean);
    }

    function filteredItems() {
        return ITEMS.filter((item) => {
            if (activeFilter !== "All" && categorize(item) !== activeFilter) return false;
            if (!searchTerm) return true;
            const haystack = `${item.name} ${item.type} ${item.damage || ""} ${item.properties || ""} ${item.desc}`.toLowerCase();
            return haystack.includes(searchTerm.toLowerCase());
        });
    }

    function renderFilters() {
        filtersEl.innerHTML = CATEGORIES.map((cat) =>
            `<button class="filter-btn${activeFilter === cat ? " active" : ""}" data-filter="${cat}" type="button">${cat}</button>`
        ).join("");
    }

    function renderGrid() {
        const items = filteredItems();
        gridEl.innerHTML = "";
        if (!items.length) {
            gridEl.innerHTML = '<div class="no-results">No craftable items match your filters.</div>';
            return;
        }
        items.forEach((item) => {
            const card = document.createElement("button");
            card.className = "item-card";
            card.type = "button";
            card.innerHTML = `
                <span class="item-kicker">${categorize(item)}</span>
                <span class="item-name">${escapeHtml(item.name)}</span>
                <span class="item-meta">${itemMeta(item).map((meta) => `<span class="item-chip">${escapeHtml(meta)}</span>`).join("")}</span>
            `;
            card.addEventListener("click", () => openDetail(item));
            gridEl.appendChild(card);
        });
    }

    function openDetail(item) {
        detailPanel.innerHTML = `
            <div class="detail-top">
                <div>
                    <h2 class="detail-name">${escapeHtml(item.name)}</h2>
                    <div class="detail-type">${escapeHtml(item.type)}</div>
                </div>
                <button class="detail-close" id="detail-close" type="button" aria-label="Close">&times;</button>
            </div>
            <div class="detail-meta">${itemMeta(item).map((meta) => `<span class="detail-chip">${escapeHtml(meta)}</span>`).join("")}</div>
            <div class="detail-body"><p>${formatText(item.desc)}</p></div>
        `;
        detailEl.classList.add("active");
        detailEl.setAttribute("aria-hidden", "false");
        document.body.classList.add("detail-open");
        document.getElementById("detail-close").addEventListener("click", closeDetail);
    }

    function closeDetail() {
        detailEl.classList.remove("active");
        detailEl.setAttribute("aria-hidden", "true");
        document.body.classList.remove("detail-open");
    }

    filtersEl.addEventListener("click", (event) => {
        const btn = event.target.closest(".filter-btn");
        if (!btn) return;
        activeFilter = btn.dataset.filter;
        renderFilters();
        renderGrid();
    });

    searchEl.addEventListener("input", (event) => {
        searchTerm = event.target.value.trim();
        renderGrid();
    });

    detailEl.addEventListener("click", (event) => {
        if (event.target === detailEl) closeDetail();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeDetail();
    });

    renderFilters();
    renderGrid();
})();

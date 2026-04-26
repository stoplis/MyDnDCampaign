(function () {
    const ITEMS = window.MERCHANT_ITEMS || [];
    const RARITY_ORDER = ["Common", "Uncommon", "Rare", "Very Rare"];
    const RARITY_CLASS = {
        "Common": "rarity-common",
        "Uncommon": "rarity-uncommon",
        "Rare": "rarity-rare",
        "Very Rare": "rarity-very-rare"
    };

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

    function rarityClass(rarity) {
        return RARITY_CLASS[rarity] || "";
    }

    function rarityChipClass(rarity) {
        return `rarity-${String(rarity).toLowerCase().replace(/\s+/g, "-")}-chip`;
    }

    function stripTags(value) {
        return String(value || "").replace(/<[^>]+>/g, "");
    }

    function formatText(text) {
        return String(text || "").split("\n\n").map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`).join("");
    }

    function filteredItems() {
        return ITEMS.filter((item) => {
            if (activeFilter !== "All" && item.rarity !== activeFilter) return false;
            if (!searchTerm) return true;
            const haystack = [
                item.name,
                item.type,
                item.rarity,
                item.intendedFor || "",
                item.flavour || "",
                stripTags(item.mechanics)
            ].join(" ").toLowerCase();
            return haystack.includes(searchTerm.toLowerCase());
        }).sort((a, b) =>
            RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) ||
            a.name.localeCompare(b.name)
        );
    }

    function renderFilters() {
        filtersEl.innerHTML = ["All", ...RARITY_ORDER].map((filter) =>
            `<button class="filter-btn${activeFilter === filter ? " active" : ""}" data-filter="${filter}" type="button">${filter}</button>`
        ).join("");
    }

    function renderGrid() {
        const items = filteredItems();
        gridEl.innerHTML = "";
        if (!items.length) {
            gridEl.innerHTML = '<div class="no-results">No magic items match your filters.</div>';
            return;
        }
        items.forEach((item) => {
            const card = document.createElement("button");
            card.className = "item-card";
            card.type = "button";
            card.innerHTML = `
                <span class="item-kicker ${rarityClass(item.rarity)}">${escapeHtml(item.rarity)}</span>
                <span class="item-name">${escapeHtml(item.name)}</span>
                <span class="item-meta">
                    <span class="item-chip">${escapeHtml(item.type)}</span>
                    ${item.attunement ? '<span class="item-chip">Attunement</span>' : ""}
                    ${item.intendedFor ? `<span class="item-chip item-for">For ${escapeHtml(item.intendedFor)}</span>` : ""}
                </span>
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
            <div class="detail-meta">
                <span class="detail-chip ${rarityClass(item.rarity)} ${rarityChipClass(item.rarity)}">${escapeHtml(item.rarity)}</span>
                ${item.attunement ? '<span class="detail-chip">Requires attunement</span>' : ""}
            </div>
            ${item.intendedFor ? `<div class="detail-for"><span class="detail-for-label">Recommended for</span> ${escapeHtml(item.intendedFor)}</div>` : ""}
            ${item.flavour ? `<div class="detail-flavour">${escapeHtml(item.flavour)}</div>` : ""}
            <div class="detail-body">${formatText(item.mechanics)}</div>
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

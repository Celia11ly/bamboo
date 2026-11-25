/* Bamboo Digital / 元生竹乐 — Interactive Application Logic */
(function () {
  "use strict";

  const state = {
    lang: localStorage.getItem("bamboo_lang") || "en",
    timelineIdx: 10, // Default to latest 2024 Beverly Hills milestone
    serviceIdx: 0,
    portfolioFilter: "all",
    selectedServices: new Set()
  };

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function getDict() {
    return window.BAMBOO_I18N[state.lang] || window.BAMBOO_I18N.en;
  }

  function resolveKey(obj, path) {
    return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
  }

  function showToast(msg) {
    const toast = $("#toast");
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  /* ------------------------------------------------------------------
     Bilingual Rendering Engine
     ------------------------------------------------------------------ */
  function applyTranslations() {
    const d = getDict();
    document.documentElement.lang = state.lang === "zh" ? "zh" : "en";
    document.title = d.meta.title;
    const metaDesc = $('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", d.meta.description);

    // Static data-i18n text bindings
    $$("[data-i18n]").forEach((el) => {
      const val = resolveKey(d, el.getAttribute("data-i18n"));
      if (typeof val === "string") el.textContent = val;
    });

    // Language toggle buttons
    $$(".lang-btn").forEach((btn) => {
      const active = btn.dataset.lang === state.lang;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    // Form placeholders & select options
    $("#fName").placeholder = d.contact.form.namePh;
    $("#fCompany").placeholder = d.contact.form.companyPh;
    $("#fEmail").placeholder = d.contact.form.emailPh;
    $("#fMessage").placeholder = d.contact.form.messagePh;

    const marketSelect = $("#fMarket");
    const prevIdx = marketSelect.selectedIndex >= 0 ? marketSelect.selectedIndex : 0;
    marketSelect.innerHTML = d.contact.form.markets
      .map((m, i) => `<option value="${i}">${m}</option>`)
      .join("");
    marketSelect.selectedIndex = Math.min(prevIdx, d.contact.form.markets.length - 1);

    renderCredentials(d);
    renderTimeline(d);
    renderServices(d);
    renderFormula(d);
    renderStudio(d);
    renderHosts(d);
    renderCases(d);
    renderPortfolio(d);
    renderPackages(d);
    renderOffices(d);
    renderServiceChips(d);
  }

  /* ------------------------------------------------------------------
     Dynamic Section Renderers
     ------------------------------------------------------------------ */
  function renderCredentials(d) {
    $("#credentialsGrid").innerHTML = d.credentials.items
      .map(
        (item) => `
        <article class="credential-card">
          <div>
            <span class="cred-tag">${item.tag}</span>
            <h3>${item.title}</h3>
            <p>${item.desc}</p>
          </div>
          <div class="cred-pills">
            ${item.highlights.map((h) => `<span class="cred-pill">${h}</span>`).join("")}
          </div>
        </article>`
      )
      .join("");
  }

  function renderTimeline(d) {
    const milestones = d.journey.milestones;
    const track = $("#timelineTrack");
    track.innerHTML = milestones
      .map(
        (m, idx) => `
        <button type="button" class="timeline-node ${idx === state.timelineIdx ? "active" : ""}" role="tab" aria-selected="${idx === state.timelineIdx}" data-tl-idx="${idx}">
          <span class="timeline-year">${m.year}</span>
          <span class="timeline-dot" aria-hidden="true"></span>
        </button>`
      )
      .join("");

    const active = milestones[state.timelineIdx];
    $("#tlYear").textContent = active.year;
    $("#tlTag").textContent = active.tag;
    $("#tlTitle").textContent = active.title;
    $("#tlDesc").textContent = active.desc;

    $$("[data-tl-idx]", track).forEach((btn) => {
      btn.addEventListener("click", () => {
        state.timelineIdx = Number(btn.dataset.tlIdx);
        renderTimeline(getDict());
      });
    });
  }

  function renderServices(d) {
    const tabs = d.services.tabs;
    const tabsWrap = $("#servicesTabs");
    tabsWrap.innerHTML = tabs
      .map(
        (t, idx) => `
        <button type="button" class="service-tab-btn ${idx === state.serviceIdx ? "active" : ""}" role="tab" aria-selected="${idx === state.serviceIdx}" data-svc-idx="${idx}">
          <span class="tab-num">${t.num}</span>
          <span>${t.short}</span>
        </button>`
      )
      .join("");

    const active = tabs[state.serviceIdx];
    $("#servicePanel").innerHTML = `
      <div class="service-panel-body">
        <h3>${active.title}</h3>
        <p class="service-lead">${active.lead}</p>
        <div class="service-bullets">
          ${active.bullets
            .map(
              (b) => `
            <div class="service-bullet">
              <h4>${b.h}</h4>
              <p>${b.p}</p>
            </div>`
            )
            .join("")}
        </div>
      </div>
      <div class="service-panel-visual">
        <img src="${active.img}" alt="${active.imgCaption}" loading="lazy">
        <div class="service-stat-badge">
          <div>
            <div class="service-stat-val">${active.statVal}</div>
            <div class="service-stat-label">${active.statLabel}</div>
          </div>
          <span style="font-size: 0.72rem; color: var(--ink-light-subtle); max-width: 170px; text-align: right;">${active.imgCaption}</span>
        </div>
      </div>
    `;

    $$("[data-svc-idx]", tabsWrap).forEach((btn) => {
      btn.addEventListener("click", () => {
        state.serviceIdx = Number(btn.dataset.svcIdx);
        renderServices(getDict());
      });
    });
  }

  function renderFormula(d) {
    $("#formulaGrid").innerHTML = d.formula.cards
      .map(
        (c) => `
        <article class="formula-card">
          <div class="formula-num">${c.num}</div>
          <h4>${c.title}</h4>
          <p>${c.desc}</p>
        </article>`
      )
      .join("");
  }

  function renderStudio(d) {
    $("#studioStats").innerHTML = d.studio.stats
      .map(
        (s) => `
        <div class="studio-stat-card">
          <div class="studio-stat-num">${s.prefix || ""}${Number(s.val).toLocaleString()}${s.suffix || ""}</div>
          <div class="studio-stat-txt">${s.label}</div>
        </div>`
      )
      .join("");

    const gal = $("#studioGallery");
    gal.innerHTML = d.studio.gallery
      .map(
        (g, idx) => `
        <button type="button" class="bento-item" data-lightbox-idx="${idx}" aria-label="${g.title}">
          <img src="${g.img}" alt="${g.title}" loading="lazy">
          <div class="bento-overlay">
            <h4>${g.title}</h4>
            <p>${g.cap}</p>
          </div>
        </button>`
      )
      .join("");

    $$("[data-lightbox-idx]", gal).forEach((btn) => {
      btn.addEventListener("click", () => openLightbox(Number(btn.dataset.lightboxIdx)));
    });
  }

  function renderHosts(d) {
    $("#hostsGrid").innerHTML = d.studio.hosts.cards
      .map(
        (h) => `
        <article class="host-card">
          <div class="host-media">
            <img src="${h.img}" alt="${h.title}" loading="lazy">
            <span class="host-tag">${h.tag}</span>
          </div>
          <div class="host-body">
            <h4>${h.title}</h4>
            <p>${h.desc}</p>
          </div>
        </article>`
      )
      .join("");
  }

  function renderPackages(d) {
    const wrap = $("#packagesGrid");
    wrap.innerHTML = d.packages.items
      .map(
        (pkg, idx) => `
        <article class="package-card ${pkg.highlight ? "featured" : ""}">
          <div>
            <span class="package-badge">${pkg.badge}</span>
            <h3>${pkg.name}</h3>
            <p class="package-desc">${pkg.desc}</p>
            <ul class="package-list">
              ${pkg.features.map((f) => `<li>${f}</li>`).join("")}
            </ul>
          </div>
          <button type="button" class="btn ${pkg.highlight ? "btn-gold" : "btn-outline-light"}" style="width: 100%;" data-pkg-idx="${idx}">
            ${d.packages.cta} →
          </button>
        </article>`
      )
      .join("");

    $$("[data-pkg-idx]", wrap).forEach((btn) => {
      btn.addEventListener("click", () => {
        const pkg = d.packages.items[Number(btn.dataset.pkgIdx)];
        state.selectedServices.clear();
        pkg.chips.forEach((c) => state.selectedServices.add(c));
        renderServiceChips(getDict());
        $("#contact").scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  function renderCases(d) {
    const wrap = $("#featuredCases");
    wrap.innerHTML = d.cases.featured
      .map(
        (c, idx) => `
        <article class="case-card">
          <div class="case-media">
            <img src="${c.img}" alt="${c.brand}" loading="lazy">
            <span class="case-badge">${d.cases.featuredBadge}</span>
          </div>
          <div class="case-body">
            <div class="case-cat">${c.category}</div>
            <h3>${c.brand}</h3>
            <p class="case-headline">${c.headline}</p>
            <p class="case-summary">${c.summary}</p>
            <div class="case-metrics">
              ${c.metrics
                .map(
                  (m) => `
                <div>
                  <div class="case-metric-val">${m.val}</div>
                  <div class="case-metric-label">${m.label}</div>
                </div>`
                )
                .join("")}
            </div>
            <div>
              <button type="button" class="btn btn-dark btn-sm" data-case-idx="${idx}">
                ${d.cases.viewDetails} →
              </button>
            </div>
          </div>
        </article>`
      )
      .join("");

    $$("[data-case-idx]", wrap).forEach((btn) => {
      btn.addEventListener("click", () => openCaseModal(Number(btn.dataset.caseIdx)));
    });
  }

  function renderPortfolio(d) {
    const filterWrap = $("#portfolioFilters");
    const keys = ["all", "beauty", "pets", "tech"];
    filterWrap.innerHTML = keys
      .map(
        (k) => `
        <button type="button" class="filter-btn ${state.portfolioFilter === k ? "active" : ""}" data-filter="${k}">
          ${d.cases.filters[k]}
        </button>`
      )
      .join("");

    $$("[data-filter]", filterWrap).forEach((btn) => {
      btn.addEventListener("click", () => {
        state.portfolioFilter = btn.dataset.filter;
        renderPortfolio(getDict());
      });
    });

    const items =
      state.portfolioFilter === "all"
        ? d.cases.portfolio
        : d.cases.portfolio.filter((p) => p.sector === state.portfolioFilter);

    $("#portfolioGrid").innerHTML = items
      .map(
        (p) => `
        <article class="portfolio-card">
          <div class="portfolio-img-wrap">
            <img src="${p.img}" alt="${p.brand}" loading="lazy">
          </div>
          <div class="portfolio-body">
            <span class="portfolio-sector">${p.sectorLabel}</span>
            <h4>${p.brand}</h4>
            <div class="portfolio-stats">
              <span class="p-stat">${p.stat1}</span>
              <span class="p-stat">${p.stat2}</span>
            </div>
            <p>${p.desc}</p>
          </div>
        </article>`
      )
      .join("");
  }

  function renderOffices(d) {
    const wrap = $("#officesStack");
    wrap.innerHTML = d.contact.offices
      .map(
        (o, idx) => `
        <article class="office-card">
          <div class="office-region">${o.region}</div>
          <h3>${o.city}</h3>
          <p class="office-addr">${o.address}</p>
          <p class="office-note">${o.note}</p>
          <button type="button" class="btn btn-outline-light btn-sm" data-copy-office="${idx}">
            ${o.copy}
          </button>
        </article>`
      )
      .join("");

    $$("[data-copy-office]", wrap).forEach((btn) => {
      btn.addEventListener("click", async () => {
        const addr = d.contact.offices[Number(btn.dataset.copyOffice)].address;
        try {
          await navigator.clipboard.writeText(addr);
        } catch (_) {
          // Fallback for restricted clipboard contexts
        }
        showToast(d.contact.form.copied);
      });
    });
  }

  function renderServiceChips(d) {
    const wrap = $("#serviceChips");
    wrap.innerHTML = d.contact.form.services
      .map(
        (label, idx) => `
        <button type="button" class="service-chip ${state.selectedServices.has(idx) ? "selected" : ""}" data-chip-idx="${idx}" aria-pressed="${state.selectedServices.has(idx)}">
          ${label}
        </button>`
      )
      .join("");

    $$("[data-chip-idx]", wrap).forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.chipIdx);
        if (state.selectedServices.has(idx)) {
          state.selectedServices.delete(idx);
        } else {
          state.selectedServices.add(idx);
        }
        renderServiceChips(getDict());
      });
    });
  }

  /* ------------------------------------------------------------------
     Modals (Native <dialog> + Backdrop Light-Dismiss Fallback)
     ------------------------------------------------------------------ */
  function wireBackdropDismiss(dialog) {
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
  }

  function openCaseModal(idx) {
    const c = getDict().cases.featured[idx];
    const dialog = $("#caseDialog");
    $("#caseDialogScope").textContent = c.modal.scope;
    $("#caseDialogTitle").textContent = `${c.brand} — ${c.headline}`;
    $("#caseDialogChallenge").textContent = c.modal.challenge;
    $("#caseDialogList").innerHTML = c.modal.execution.map((item) => `<li>${item}</li>`).join("");
    const img = $("#caseDialogImg");
    img.src = c.modal.secondaryImg;
    img.alt = c.brand;
    dialog.showModal();
  }

  function openLightbox(idx) {
    const g = getDict().studio.gallery[idx];
    const dialog = $("#lightboxDialog");
    $("#lightboxTitle").textContent = g.title;
    $("#lightboxCap").textContent = g.cap;
    const img = $("#lightboxImg");
    img.src = g.img;
    img.alt = g.title;
    dialog.showModal();
  }

  /* ------------------------------------------------------------------
     Initialization & Event Listeners
     ------------------------------------------------------------------ */
  function init() {
    applyTranslations();

    // Language switcher
    $$(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (state.lang === btn.dataset.lang) return;
        state.lang = btn.dataset.lang;
        localStorage.setItem("bamboo_lang", state.lang);
        applyTranslations();
      });
    });

    // Timeline arrows
    $("#tlPrev").addEventListener("click", () => {
      const len = getDict().journey.milestones.length;
      state.timelineIdx = (state.timelineIdx - 1 + len) % len;
      renderTimeline(getDict());
    });
    $("#tlNext").addEventListener("click", () => {
      const len = getDict().journey.milestones.length;
      state.timelineIdx = (state.timelineIdx + 1) % len;
      renderTimeline(getDict());
    });

    // Mobile drawer
    const menuToggle = $("#menuToggle");
    const navLinks = $("#navLinks");
    menuToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
    $$("a", navLinks).forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });

    // Header scroll state & progress hairline
    const header = $("#siteHeader");
    const progress = $("#scrollProgress");
    function onScroll() {
      const y = window.scrollY;
      header.classList.toggle("scrolled", y > 28);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const pct = maxScroll > 0 ? Math.min(100, (y / maxScroll) * 100) : 0;
      progress.style.width = `${pct}%`;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Scroll reveal observer
    const reveals = $$(".reveal");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
      );
      reveals.forEach((el) => io.observe(el));
    } else {
      reveals.forEach((el) => el.classList.add("is-visible"));
    }

    // Dialog close & light dismiss
    const caseDialog = $("#caseDialog");
    const lightboxDialog = $("#lightboxDialog");
    $("#closeCaseDialog").addEventListener("click", () => caseDialog.close());
    $("#closeLightbox").addEventListener("click", () => lightboxDialog.close());
    wireBackdropDismiss(caseDialog);
    wireBackdropDismiss(lightboxDialog);

    // Inquiry form submission
    const form = $("#inquiryForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      form.style.display = "none";
      $("#formSuccess").classList.add("visible");
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();

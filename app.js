/* BAMBOO — Interactive Application Logic */
(function () {
  "use strict";

  const SUPPORTED_LANGS = ["en", "ja", "fr", "zh"];
  const savedLang = localStorage.getItem("bamboo_lang");

  const state = {
    lang: SUPPORTED_LANGS.includes(savedLang) ? savedLang : "en",
    heroSlideIdx: 0,
    heroTimer: null,
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
    document.documentElement.lang = state.lang;
    document.title = d.meta.title;
    const metaDesc = $('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", d.meta.description);

    // Static data-i18n text bindings
    $$("[data-i18n]").forEach((el) => {
      const val = resolveKey(d, el.getAttribute("data-i18n"));
      if (typeof val === "string") el.textContent = val;
    });

    // Language dropdown sync
    const langSelect = $("#langSelect");
    if (langSelect) langSelect.value = state.lang;

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

    renderHeroCarousel(d);
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
  function renderHeroCarousel(d) {
    const slides = d.hero.slides;
    const slidesWrap = $("#heroSlides");
    const dotsWrap = $("#heroDots");

    if (!slidesWrap.children.length) {
      slidesWrap.innerHTML = slides
        .map(
          (s, idx) => `
          <div class="hero-slide ${idx === state.heroSlideIdx ? "active" : ""}">
            <img src="${s.img}" alt="${s.caption}" ${idx === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>
          </div>`
        )
        .join("");

      dotsWrap.innerHTML = slides
        .map(
          (_, idx) => `
          <button type="button" class="hero-dot ${idx === state.heroSlideIdx ? "active" : ""}" data-hero-dot="${idx}" aria-label="Slide ${idx + 1}"></button>`
        )
        .join("");

      $$("[data-hero-dot]", dotsWrap).forEach((dot) => {
        dot.addEventListener("click", () => {
          goHeroSlide(Number(dot.dataset.heroDot));
        });
      });
    }

    updateHeroSlideUI(d);
  }

  function updateHeroSlideUI(d) {
    const slides = d.hero.slides;
    const current = slides[state.heroSlideIdx];
    $$(".hero-slide").forEach((el, idx) => {
      el.classList.toggle("active", idx === state.heroSlideIdx);
    });
    $$(".hero-dot").forEach((el, idx) => {
      el.classList.toggle("active", idx === state.heroSlideIdx);
      el.setAttribute("aria-selected", String(idx === state.heroSlideIdx));
    });
    $("#heroSlideBadge").textContent = `● ${current.badge}`;
    $("#heroSlideCaption").textContent = current.caption;
  }

  function goHeroSlide(idx) {
    const len = getDict().hero.slides.length;
    state.heroSlideIdx = (idx + len) % len;
    updateHeroSlideUI(getDict());
  }

  function startHeroAutoplay() {
    stopHeroAutoplay();
    state.heroTimer = setInterval(() => goHeroSlide(state.heroSlideIdx + 1), 4800);
  }

  function stopHeroAutoplay() {
    if (state.heroTimer) {
      clearInterval(state.heroTimer);
      state.heroTimer = null;
    }
  }

  function renderCredentials(d) {
    const item = d.credentials.item;
    $("#credentialsGrid").innerHTML = `
      <div class="sample-media-grid">
        <div class="sample-photo">
          <img src="${item.img}" alt="${item.title}" loading="lazy">
        </div>
        <div class="sample-photo">
          <img src="${item.img2}" alt="${item.title}" loading="lazy">
        </div>
        <div class="sample-photo">
          <img src="assets/images/la-wilshire-building.jpg" alt="6420 Wilshire Blvd" loading="lazy">
        </div>
      </div>
      <div class="sample-copy">
        <span class="cred-tag" style="display:inline-block;font-size:0.7rem;font-weight:700;letter-spacing:0.14em;color:var(--gold);margin-bottom:12px;">${item.tag}</span>
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
        <div class="sample-pillars">
          ${item.highlights
            .map(
              (h) => `
            <div class="sample-pillar">
              <h4>${h.h}</h4>
              <p>${h.p}</p>
            </div>`
            )
            .join("")}
        </div>
      </div>
    `;
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
    if (state.serviceIdx >= tabs.length) state.serviceIdx = 0;
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
        <ul class="service-list-clean">
          ${active.bullets.map((b) => `<li>${b}</li>`).join("")}
        </ul>
        <div class="service-inline-stat">
          <span class="service-stat-val">${active.statVal}</span>
          <span class="service-stat-label">${active.statLabel}</span>
        </div>
      </div>
      <div class="service-gallery">
        ${active.gallery
          .map(
            (g) => `
          <div class="service-photo-card">
            <img src="${g.img}" alt="${g.cap}" loading="lazy">
            <div class="service-photo-cap">${g.cap}</div>
          </div>`
          )
          .join("")}
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
    $("#formulaTimeline").innerHTML = d.formula.timeline
      .map(
        (step) => `
        <div class="ft-step">
          <span class="ft-time">${step.time}</span>
          <h4>${step.title}</h4>
          <p>${step.desc}</p>
        </div>`
      )
      .join("");

    $("#formulaGrid").innerHTML = d.formula.cards
      .map(
        (c) => `
        <article class="formula-card">
          <div class="formula-media">
            <img src="${c.img}" alt="${c.title}" loading="lazy">
            <div class="formula-media-top">
              <span class="formula-num">${c.num}</span>
              <span class="formula-tag">${c.tag}</span>
            </div>
            <div class="formula-hook">${c.hook}</div>
          </div>
          <div class="formula-body">
            <h4>${c.title}</h4>
            <p>${c.desc}</p>
          </div>
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

    // Hero carousel controls & hover pause
    $("#heroPrev").addEventListener("click", () => {
      goHeroSlide(state.heroSlideIdx - 1);
      startHeroAutoplay();
    });
    $("#heroNext").addEventListener("click", () => {
      goHeroSlide(state.heroSlideIdx + 1);
      startHeroAutoplay();
    });
    const carousel = $("#heroCarousel");
    carousel.addEventListener("mouseenter", stopHeroAutoplay);
    carousel.addEventListener("mouseleave", startHeroAutoplay);
    startHeroAutoplay();

    // 4-Language dropdown switcher
    const langSelect = $("#langSelect");
    if (langSelect) {
      langSelect.addEventListener("change", (e) => {
        const nextLang = e.target.value;
        if (!SUPPORTED_LANGS.includes(nextLang) || state.lang === nextLang) return;
        state.lang = nextLang;
        localStorage.setItem("bamboo_lang", state.lang);
        applyTranslations();
      });
    }

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

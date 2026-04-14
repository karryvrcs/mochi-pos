(function () {
  const root = document.documentElement;
  const storageKey = "pos-site-lang";
  const deviceKey = "pos-site-device";
  const META_ZH =
    "摆摊记账使用教程：首次设置、下单、订单、商品管理与经营统计。";
  const META_EN =
    "Mochi POS documentation: setup, checkout, orders, product management, and business statistics.";

  /** @type {"zh" | "en"} */
  let currentLang = "en";
  /** @type {"iphone" | "ipad"} */
  let currentDevice = "ipad";

  function applyDocDevice() {
    const isIpad = currentDevice === "ipad";
    document.querySelectorAll(".doc-screenshot-frame").forEach((el) => {
      el.classList.toggle("is-ipad", isIpad);
      el.classList.toggle("is-iphone", !isIpad);
    });
    document.querySelectorAll(".doc-device-switch .device-btn").forEach((btn) => {
      const d = btn.getAttribute("data-device");
      const on = d === currentDevice;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function setDevice(device) {
    currentDevice = device === "ipad" ? "ipad" : "iphone";
    applyDocDevice();
    try {
      localStorage.setItem(deviceKey, currentDevice);
    } catch (_) {}
  }

  /** @type {(() => void) | null} */
  let tocScrollCleanup = null;

  /**
   * 浅色目录：h2 为一级，其下的 h3 嵌套在子列表中；锚点兼容 GitHub Pages。
   */
  function buildToc(article) {
    const tocNav = document.getElementById("docToc");
    const tocList = document.getElementById("docTocList");
    if (!tocNav || !tocList) return;
    tocList.innerHTML = "";
    const headings = article.querySelectorAll("h2, h3");
    if (headings.length === 0) {
      tocNav.hidden = true;
      return;
    }
    tocNav.hidden = false;

    let pendingH2Li = null;
    let currentSubOl = null;

    headings.forEach((h, idx) => {
      const id = `doc-toc-${idx}`;
      if (!h.id) h.id = id;

      const a = document.createElement("a");
      a.href = `#${h.id}`;
      a.textContent = h.textContent.trim();

      if (h.tagName === "H2") {
        const li = document.createElement("li");
        li.className = "doc-toc-item doc-toc-item--h2";
        li.appendChild(a);
        tocList.appendChild(li);
        pendingH2Li = li;
        currentSubOl = null;
      } else {
        if (pendingH2Li && !currentSubOl) {
          currentSubOl = document.createElement("ol");
          currentSubOl.className = "doc-toc-sub";
          pendingH2Li.appendChild(currentSubOl);
        }
        const li = document.createElement("li");
        li.className = "doc-toc-item doc-toc-item--h3";
        li.appendChild(a);
        if (currentSubOl) {
          currentSubOl.appendChild(li);
        } else {
          tocList.appendChild(li);
        }
      }
    });
  }

  function setupTocScrollSpy(article) {
    if (tocScrollCleanup) {
      tocScrollCleanup();
      tocScrollCleanup = null;
    }
    const tocNav = document.getElementById("docToc");
    if (!tocNav) return;
    const links = tocNav.querySelectorAll("a[href^='#']");
    const headings = article.querySelectorAll("h2, h3");
    if (headings.length === 0 || links.length === 0) return;

    function headerOffset() {
      const h = getComputedStyle(document.documentElement)
        .getPropertyValue("--header-h")
        .trim();
      return parseFloat(h) || 64;
    }

    /** 与 .doc-prose h2/h3 的 scroll-margin-top（header + 0.75rem）一致，避免锚点滚动后目录仍高亮上一节 */
    function docScrollBandPx() {
      const rem =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      return headerOffset() + 0.75 * rem;
    }

    function updateActive() {
      const band = docScrollBandPx();
      let currentId = headings[0].id;
      headings.forEach((h) => {
        const rect = h.getBoundingClientRect();
        if (rect.top <= band) currentId = h.id;
      });
      links.forEach((a) => {
        const id = a.getAttribute("href").slice(1);
        a.classList.toggle("is-active", id === currentId);
      });
    }

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive, { passive: true });

    tocScrollCleanup = () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }

  async function loadDoc() {
    const path =
      currentLang === "en" ? "docs/guide.en.md" : "docs/guide.zh.md";
    const loading = document.getElementById("docLoading");
    const content = document.getElementById("docContent");
    const errEl = document.getElementById("docError");
    const parser =
      typeof marked !== "undefined" && typeof marked.parse === "function"
        ? (md) => marked.parse(md)
        : typeof window !== "undefined" &&
            window.marked &&
            typeof window.marked.parse === "function"
          ? (md) => window.marked.parse(md)
          : null;

    const globalDev = document.getElementById("docGlobalDevice");

    if (!content || !parser) {
      if (errEl) errEl.hidden = false;
      if (loading) loading.hidden = true;
      if (globalDev) globalDev.hidden = true;
      return;
    }

    if (loading) loading.hidden = false;
    if (errEl) errEl.hidden = true;
    content.hidden = true;
    if (globalDev) globalDev.hidden = true;
    const tocNav = document.getElementById("docToc");
    if (tocNav) tocNav.hidden = true;

    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(String(res.status));
      const md = await res.text();
      content.innerHTML = parser(md);
      content.hidden = false;
      if (loading) loading.hidden = true;
      if (globalDev) globalDev.hidden = false;
      buildToc(content);
      setupTocScrollSpy(content);
      applyDocDevice();
    } catch (_) {
      if (loading) loading.hidden = true;
      if (errEl) errEl.hidden = false;
      if (globalDev) globalDev.hidden = true;
    }
  }

  function setLang(lang) {
    const isEn = lang === "en";
    currentLang = isEn ? "en" : "zh";
    root.classList.remove("lang-zh", "lang-en");
    root.classList.add(isEn ? "lang-en" : "lang-zh");
    root.lang = isEn ? "en" : "zh-CN";

    document.title = isEn
      ? "Documentation · Mochi POS"
      : "使用教程 · 摆摊记账";
    const meta = document.getElementById("metaDesc");
    if (meta) meta.setAttribute("content", isEn ? META_EN : META_ZH);

    try {
      localStorage.setItem(storageKey, currentLang);
    } catch (_) {}

    loadDoc();
  }

  let initial = "en";
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "en" || saved === "zh") initial = saved;
  } catch (_) {}

  try {
    const d = localStorage.getItem(deviceKey);
    if (d === "ipad" || d === "iphone") currentDevice = d;
  } catch (_) {}

  setLang(initial);

  const toggle = document.getElementById("langToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = root.classList.contains("lang-en") ? "zh" : "en";
      setLang(next);
    });
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const revealEls = document.querySelectorAll(".reveal");
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
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  document.querySelectorAll("#docGlobalDevice .doc-device-switch .device-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = btn.getAttribute("data-device");
      if (d === "iphone" || d === "ipad") setDevice(d);
    });
  });
})();

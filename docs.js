(function () {
  const root = document.documentElement;
  const storageKey = "pos-site-lang";
  const deviceKey = "pos-site-device";
  const META_ZH =
    "摆摊记账使用教程：快速上手、下单结账、订单与经营数据统计。";
  const META_EN =
    "Mochi POS user guide: getting started, checkout, orders, and analytics.";

  /** @type {"zh" | "en"} */
  let currentLang = "en";
  /** @type {"iphone" | "ipad"} */
  let currentDevice = "ipad";

  /** @param {string} md */
  function applyDeviceToMarkdown(md) {
    const prefix = currentDevice === "iphone" ? "iphone" : "ipad";
    if (currentLang === "en") {
      return md.replace(/doc_images\/ipad_en_/g, `doc_images/${prefix}_en_`);
    }
    return md.replace(/doc_images\/ipad_cn_/g, `doc_images/${prefix}_cn_`);
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
  }

  function syncDocDeviceBodyClass() {
    const b = document.body;
    if (!b) return;
    b.classList.remove("doc-device-ipad", "doc-device-iphone");
    b.classList.add(
      currentDevice === "ipad" ? "doc-device-ipad" : "doc-device-iphone"
    );
  }

  function setDevice(device) {
    currentDevice = device === "ipad" ? "ipad" : "iphone";
    syncDocDeviceBodyClass();
    document.querySelectorAll(".doc-device-btn").forEach((btn) => {
      const d = btn.getAttribute("data-device");
      const on = d === currentDevice;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    const label =
      currentLang === "en"
        ? "Screenshot device: iPhone or iPad / Mac"
        : "截图预览设备：iPhone 或 iPad / Mac";
    document.querySelectorAll(".doc-device-switch").forEach((sw) => {
      sw.setAttribute("aria-label", label);
    });
    try {
      localStorage.setItem(deviceKey, currentDevice);
    } catch (_) {}
    renderMarkdown();
  }

  /** @type {string | null} */
  let rawMarkdown = null;

  let tocScrollCleanup = null;

  function teardownTocScrollSpy() {
    if (typeof tocScrollCleanup === "function") {
      tocScrollCleanup();
      tocScrollCleanup = null;
    }
  }

  /** @param {HTMLElement} host */
  function buildTOC(host) {
    const toc = document.getElementById("docToc");
    const list = document.getElementById("docTocList");
    if (!toc || !list) return;

    list.innerHTML = "";
    const headings = host.querySelectorAll("h2, h3");
    if (!headings.length) {
      toc.hidden = true;
      teardownTocScrollSpy();
      return;
    }

    toc.hidden = false;
    headings.forEach((el, i) => {
      const id = "doc-h-" + i;
      el.id = id;
      const li = document.createElement("li");
      li.className =
        el.tagName === "H2" ? "doc-toc-item doc-toc-h2" : "doc-toc-item doc-toc-h3";
      const a = document.createElement("a");
      a.href = "#" + id;
      a.textContent = el.textContent.trim();
      li.appendChild(a);
      list.appendChild(li);
    });

    teardownTocScrollSpy();
    tocScrollCleanup = setupTocScrollSpy(host);
  }

  /** @param {HTMLElement} host */
  function setupTocScrollSpy(host) {
    const links = document.querySelectorAll("#docTocList a");
    const headings = [...host.querySelectorAll("h2, h3")];
    if (!links.length || !headings.length) return function () {};

    const headerOffset =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--header-h")
      ) || 64;
    const margin = 20;

    function updateActive() {
      const y = window.scrollY + headerOffset + margin;
      let active = 0;
      for (let i = headings.length - 1; i >= 0; i--) {
        const top =
          headings[i].getBoundingClientRect().top + window.scrollY;
        if (top <= y + 1) {
          active = i;
          break;
        }
      }
      links.forEach((a, i) => {
        a.classList.toggle("is-active", i === active);
      });
    }

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateActive();
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateActive();

    return function () {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }

  function renderMarkdown() {
    const host = document.getElementById("docMarkdown");
    if (!host || !rawMarkdown || typeof marked === "undefined" || !marked.parse)
      return;
    const md = applyDeviceToMarkdown(rawMarkdown);
    host.innerHTML = marked.parse(md);
    buildTOC(host);
  }

  function getEmbeddedMarkdown() {
    const id = currentLang === "en" ? "doc-md-fallback-en" : "doc-md-fallback";
    const el = document.getElementById(id);
    const t = el && el.textContent;
    return t && t.trim() ? t.trim() : null;
  }

  async function loadMarkdown() {
    const host = document.getElementById("docMarkdown");
    if (!host) return;

    const langAtStart = currentLang;
    const file =
      langAtStart === "en" ? "docs/user-guide.en.md" : "docs/user-guide.md";

    let md = null;
    try {
      const url = new URL(file, window.location.href);
      const res = await fetch(url.href, { cache: "no-store" });
      if (res.ok) md = await res.text();
    } catch (_) {
      /* file:// 或离线等场景下 fetch 不可用 */
    }

    if (langAtStart !== currentLang) return;

    if (!md) md = getEmbeddedMarkdown();

    if (langAtStart !== currentLang) return;

    if (md) {
      rawMarkdown = md.trim();
      if (typeof marked !== "undefined" && marked.parse) {
        renderMarkdown();
      }
      return;
    }

    const errZh =
      "无法加载文档内容。请刷新页面或检查 docs/user-guide.md / user-guide.en.md 是否存在。";
    const errEn =
      "Could not load the guide. Refresh the page or ensure the docs files are present.";
    host.innerHTML =
      '<p class="doc-error">' +
      errZh +
      '<br /><span class="doc-error-en">' +
      errEn +
      "</span></p>";
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
      loadMarkdown();
    });
  }

  document.querySelectorAll(".doc-device-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = btn.getAttribute("data-device");
      if (d === "iphone" || d === "ipad") setDevice(d);
    });
  });

  const script = document.createElement("script");
  script.src =
    "https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js";
  script.async = true;
  script.onload = () => {
    loadMarkdown();
  };
  script.onerror = () => {
    const host = document.getElementById("docMarkdown");
    if (host)
      host.innerHTML =
        '<p class="doc-error">无法加载 Markdown 渲染库，请检查网络后刷新页面。</p>';
  };
  document.head.appendChild(script);

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  setDevice(currentDevice);
})();

(function () {
  const root = document.documentElement;
  const storageKey = "pos-site-lang";
  const deviceKey = "pos-site-device";
  const META_ZH =
    "摆摊记账使用教程：首次设置、下单、订单与经营统计。";
  const META_EN =
    "Mochi POS documentation: setup, checkout, orders, and business statistics.";

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

  function bindDocDeviceButtons(container) {
    container.querySelectorAll(".doc-device-switch .device-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const d = btn.getAttribute("data-device");
        if (d === "iphone" || d === "ipad") setDevice(d);
      });
    });
  }

  /**
   * 浅色侧栏目录：从正文 h2/h3 生成锚点，兼容 GitHub Pages 静态部署（相对路径）。
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
    headings.forEach((h, idx) => {
      const id = `doc-toc-${idx}`;
      if (!h.id) h.id = id;
      const li = document.createElement("li");
      li.className =
        h.tagName === "H3" ? "doc-toc-item doc-toc-item--sub" : "doc-toc-item";
      const a = document.createElement("a");
      a.href = `#${h.id}`;
      a.textContent = h.textContent.trim();
      li.appendChild(a);
      tocList.appendChild(li);
    });
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

    if (!content || !parser) {
      if (errEl) errEl.hidden = false;
      if (loading) loading.hidden = true;
      return;
    }

    if (loading) loading.hidden = false;
    if (errEl) errEl.hidden = true;
    content.hidden = true;
    const tocNav = document.getElementById("docToc");
    if (tocNav) tocNav.hidden = true;

    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(String(res.status));
      const md = await res.text();
      content.innerHTML = parser(md);
      content.hidden = false;
      if (loading) loading.hidden = true;
      buildToc(content);
      applyDocDevice();
      bindDocDeviceButtons(content);
    } catch (_) {
      if (loading) loading.hidden = true;
      if (errEl) errEl.hidden = false;
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
})();

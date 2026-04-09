(function () {
  const root = document.documentElement;
  const storageKey = "pos-site-lang";
  const deviceKey = "pos-site-device";
  const META_ZH =
    "摆摊记账是面向零售、餐饮与摊位的离线收银与经营管理工具。";
  const META_EN =
    "Mochi POS is an offline-first point-of-sale and business management app for shops, dining, and stalls.";

  /** @type {"zh" | "en"} */
  let currentLang = "zh";
  /** @type {"iphone" | "ipad"} */
  let currentDevice = "ipad";

  function mediaBase() {
    const langFolder = currentLang === "en" ? "English" : "Chinesesim";
    const deviceFolder =
      currentDevice === "ipad" ? "iPad  13" : "iPhones  6.9";
    return `images/${langFolder}/${deviceFolder}`;
  }

  function refreshMedia() {
    const base = mediaBase();
    const hero = document.getElementById("heroShot");
    if (hero) hero.src = `${base}/01.jpg`;

    document.querySelectorAll(".shot-img[data-file]").forEach((img) => {
      const n = img.getAttribute("data-file");
      if (n) img.src = `${base}/${n}.jpg`;
    });

    const isIpad = currentDevice === "ipad";
    document.querySelectorAll(".device-btn").forEach((btn) => {
      const d = btn.getAttribute("data-device");
      const on = d === currentDevice;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    document.querySelectorAll("#heroVisual, #introShots").forEach((el) => {
      el.classList.toggle("is-ipad", isIpad);
      el.classList.toggle("is-iphone", !isIpad);
    });

    const aria =
      currentLang === "en"
        ? "Preview device: iPad or iPhone"
        : "选择预览设备：iPad 或 iPhone";
    document.querySelectorAll(".device-switch").forEach((sw) => {
      sw.setAttribute("aria-label", aria);
    });
  }

  function setLang(lang) {
    const isEn = lang === "en";
    currentLang = isEn ? "en" : "zh";
    root.classList.remove("lang-zh", "lang-en");
    root.classList.add(isEn ? "lang-en" : "lang-zh");
    root.lang = isEn ? "en" : "zh-CN";

    document.title = isEn ? "Mochi POS" : "摆摊记账";
    const meta = document.getElementById("metaDesc");
    if (meta) meta.setAttribute("content", isEn ? META_EN : META_ZH);

    refreshMedia();

    try {
      localStorage.setItem(storageKey, currentLang);
    } catch (_) {}
  }

  function setDevice(device) {
    currentDevice = device === "ipad" ? "ipad" : "iphone";
    refreshMedia();
    try {
      localStorage.setItem(deviceKey, currentDevice);
    } catch (_) {}
  }

  let initial = "zh";
  let hadStored = false;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "en" || saved === "zh") {
      initial = saved;
      hadStored = true;
    }
  } catch (_) {}

  const browserPrefersEn =
    typeof navigator !== "undefined" &&
    navigator.language &&
    !String(navigator.language).toLowerCase().startsWith("zh");
  if (!hadStored && browserPrefersEn) initial = "en";

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

  document.querySelectorAll(".device-btn[data-device]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = btn.getAttribute("data-device");
      if (d === "iphone" || d === "ipad") setDevice(d);
    });
  });

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

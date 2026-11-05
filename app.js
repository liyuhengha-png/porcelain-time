(function () {
  const $ = (id) => document.getElementById(id);
  const homeEl = $("home");
  const resultEl = $("result");
  const monthEl = $("month");
  const dayEl = $("day");
  const veil = $("transition");
  const toast = $("toast");
  const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  let locale = "zh-CN";
  let current = null;
  let toastTimer = 0;

  const t = (k, p) => (window.eazoI18n ? window.eazoI18n.t(k, p) : k);
  const isZh = () => locale.indexOf("zh") === 0;
  const txt = (o, base) => (isZh() ? o[base + "Zh"] : o[base + "En"]);
  const pad = (n) => String(n).padStart(2, "0");

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
  }

  function fillMonths() {
    const keep = Number(monthEl.value) || 6;
    monthEl.replaceChildren();
    for (let m = 1; m <= 12; m++) {
      monthEl.add(new Option(t("months." + m), m));
    }
    monthEl.value = String(keep);
  }

  function fillDays() {
    const keep = Number(dayEl.value) || 18;
    const max = DAYS[Number(monthEl.value) - 1];
    dayEl.replaceChildren();
    for (let d = 1; d <= max; d++) {
      dayEl.add(new Option(t("units.day", { n: pad(d) }), d));
    }
    dayEl.value = String(Math.min(keep, max));
  }

  function renderResult() {
    if (!current) return;
    const { m, d, match } = current;
    const w = match.work;

    $("birthday-display").textContent = pad(m) + "." + pad(d);
    $("art-name").textContent = txt(w, "name");
    $("art-name-en").textContent = isZh() ? w.nameEn : w.nameZh;
    $("art-period").textContent = txt(w, "dynasty") + "\n" + txt(w, "date");
    $("art-kiln").textContent = txt(w, "kiln") + "\n" + txt(w, "museum");
    $("art-period").style.whiteSpace = "pre-line";
    $("art-kiln").style.whiteSpace = "pre-line";
    $("art-story").textContent = txt(w, "story");
    $("art-craft").textContent = txt(w, "craft");
    $("art-mark").textContent = (isZh() ? "瓷器 · " : "PORCELAIN · ") + txt(w, "dynasty");
    $("art-foot-left").textContent = isZh() ? "藏品影像 · " + w.museumZh : "COLLECTION IMAGE · " + w.museumEn.toUpperCase();
    $("chapter").textContent = t("result.chapter");
    $("connection-label").textContent = t("result.connection");

    const tag = t("tag." + match.mode);
    $("connection-tag").textContent = tag;

    let body;
    if (match.mode === "exact") {
      body = t("conn.exact", { event: isZh() ? match.event.zh : match.event.en, name: isZh() ? w.nameZh : w.nameEn, period: txt(w, "date") });
    } else if (match.mode === "near") {
      body = t("conn.near", { days: match.days, event: isZh() ? match.event.zh : match.event.en });
    } else {
      body = t("conn.thematic", {
        name: isZh() ? w.nameZh : w.nameEn, season: isZh() ? match.seasonZh : match.seasonEn,
        motif: txt(w, "motif"), period: txt(w, "date")
      });
    }
    $("connection-text").textContent = body;
    $("picture-note").textContent = t("note", { credit: w.credit });

    const img = $("art-image");
    img.classList.remove("is-missing");
    img.onerror = () => {
      img.classList.add("is-missing");
      $("art-stage").classList.add("no-image");
    };
    img.alt = txt(w, "name") + " · " + txt(w, "dynasty");
    img.src = w.image;
  }

  function showResult(m, d, { animate = true, push = true } = {}) {
    current = { m, d, match: window.matchBirthday(m, d) };
    monthEl.value = String(m);
    fillDays();
    dayEl.value = String(d);
    renderResult();
    const swap = () => {
      homeEl.hidden = true;
      resultEl.hidden = false;
      window.scrollTo(0, 0);
    };
    if (animate) {
      veil.hidden = false;
      setTimeout(swap, 330);
      setTimeout(() => { veil.hidden = true; }, 820);
    } else {
      swap();
    }
    if (push) {
      try { history.replaceState(null, "", "#/" + pad(m) + "-" + pad(d)); } catch (e) {}
    }
  }

  function goHome() {
    resultEl.hidden = true;
    homeEl.hidden = false;
    if (window.fitHome) setTimeout(fitHome, 0);
    window.scrollTo(0, 0);
    try { history.replaceState(null, "", location.pathname); } catch (e) {}
    monthEl.focus({ preventScroll: true });
  }

  function readHash() {
    const m = /#\/(\d{2})-(\d{2})/.exec(location.hash || "");
    if (!m) return null;
    const mm = Number(m[1]);
    const dd = Number(m[2]);
    if (mm < 1 || mm > 12 || dd < 1 || dd > DAYS[mm - 1]) return null;
    return { m: mm, d: dd };
  }

  function bind() {
    monthEl.addEventListener("change", fillDays);
    $("birthday-form").addEventListener("submit", (e) => {
      e.preventDefault();
      showResult(Number(monthEl.value), Number(dayEl.value));
    });
    $("again").addEventListener("click", goHome);
    $("brand-home").addEventListener("click", goHome);
    window.addEventListener("hashchange", () => {
      const h = readHash();
      if (h && (!current || current.m !== h.m || current.d !== h.d)) showResult(h.m, h.d, { animate: false, push: false });
    });
  }

  async function boot() {
    if (window.eazoI18n) {
      await window.eazoI18n.ready;
      locale = window.eazoI18n.getLocale();
    }
    fillMonths();
    fillDays();
    bind();
    if (window.ShareCard) window.ShareCard.init(() => current, {
      isZh, t, showToast, pad
    });

    const h = readHash();
    if (h) showResult(h.m, h.d, { animate: false, push: false });

    window.addEventListener("eazo:localechange", () => {
      locale = window.eazoI18n.getLocale();
      fillMonths();
      fillDays();
      if (current && !resultEl.hidden) renderResult();
      if (window.ShareCard) window.ShareCard.refreshLabels();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

/* Fit the home screen to the viewport below any host chrome. */
function fitHome(){
  var home = document.querySelector('.home');
  if (!home || home.hidden) return;
  var top = home.getBoundingClientRect().top + (window.scrollY || 0);
  document.documentElement.style.setProperty('--home-h', Math.round(window.innerHeight - top) + 'px');
}
window.addEventListener('resize', fitHome);
window.addEventListener('orientationchange', function(){ setTimeout(fitHome, 120); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHome);
fitHome();
setTimeout(fitHome, 80);
setTimeout(fitHome, 500);
if (typeof window.render === 'function') { var _r = window.render; }

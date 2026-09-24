/* Shared behaviour of the text pages (home, challenges, about, request):
   language and theme toggles. Text in both languages sits in the HTML as
   .t-en / .t-zh elements; CSS shows the one that matches <html lang>. */

(function () {
  const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
  const root = document.documentElement;

  const urlLang = new URL(location.href).searchParams.get("lang");
  let lang = (urlLang || get("tw-lang")) === "zh" ? "zh" : "en";
  const theme = get("tw-theme");
  if (theme === "light" || theme === "dark") root.dataset.theme = theme;

  function applyLang() {
    root.lang = lang === "zh" ? "zh-Hant" : "en";
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    const title = document.querySelector(`meta[name="title-${lang}"]`);
    if (title) document.title = title.content;
    document.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
      lang = b.dataset.lang; set("tw-lang", lang); applyLang();
    }));
    const toggle = document.getElementById("theme-toggle");
    if (toggle) toggle.addEventListener("click", () => {
      const dark = getComputedStyle(root).getPropertyValue("color-scheme").trim() === "dark";
      root.dataset.theme = dark ? "light" : "dark";
      set("tw-theme", root.dataset.theme);
    });
    applyLang();
  });

  window.twLang = () => lang;
})();

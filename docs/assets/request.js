/* Request form: sends the request in the background to a form service, which emails the author.
   The page stays on this site; visitors need no account.

   To switch it on, create a free form at one of these services and fill in FORM:
   - Formspree (https://formspree.io): provider "formspree", endpoint "https://formspree.io/f/<form id>"
   - Web3Forms (https://web3forms.com): provider "web3forms", accessKey "<access key>"
   Both keys are meant to be public (they only allow sending to your own address). */
const FORM = { provider: "", endpoint: "", accessKey: "" };

const TEXT = {
  en: {
    off: "Online requests are not switched on yet. In the meantime, please email barton.chen.energy@gmail.com.",
    invalid: "Please describe the scenario, give a valid email address and tick the consent box.",
    sending: "Sending…", sent: "Thank you. Your request has been sent; you will get an email when the results are online.",
    failed: "Sending failed. Please try again later, or email barton.chen.energy@gmail.com.",
    none: "no cap", base: "today's system",
  },
  zh: {
    off: "線上申請尚未開放。在此之前，請寄信至 barton.chen.energy@gmail.com。",
    invalid: "請描述情境、填寫有效的電子郵件，並勾選同意。",
    sending: "送出中……", sent: "謝謝！申請已送出；結果上線時會以電子郵件通知您。",
    failed: "送出失敗，請稍後再試，或寄信至 barton.chen.energy@gmail.com。",
    none: "不設上限", base: "現有系統",
  },
};
const t = (k) => TEXT[(window.twLang && window.twLang()) || "en"][k];
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Sandbox levers passed in the URL (the same query string as sandbox.html).
const LEVERS = ["add_solar_GW", "add_onwind_GW", "add_offwind_GW", "add_battery_GW", "add_ccgt_GW", "nuclear_restart",
  "add_nuclear_new_GW", "coal_retire_frac", "co2_cap_frac", "demand_scale", "gas_price_mult", "coal_price_mult", "line_rating"];

function scenarioFromUrl() {
  const q = new URL(location.href).searchParams;
  const levers = {};
  for (const k of LEVERS) {
    if (!q.has(k)) continue;
    const raw = q.get(k).slice(0, 100);
    if (k === "nuclear_restart") levers[k] = raw.split(",").filter(Boolean);
    else if (k === "co2_cap_frac" && raw === "none") levers[k] = null;
    else if (Number.isFinite(Number(raw))) levers[k] = Number(raw);
  }
  return levers;
}

function showScenario(levers) {
  const keys = Object.keys(levers);
  if (!keys.length) return;
  $("scenario-box").hidden = false;
  $("scenario-list").innerHTML = keys.map((k) => `<li><code>${esc(k)}</code> = ${esc(
    Array.isArray(levers[k]) ? levers[k].join(", ") : levers[k] === null ? t("none") : levers[k])}</li>`).join("");
  const q = new URLSearchParams(keys.map((k) => [k, Array.isArray(levers[k]) ? levers[k].join(",") : levers[k] === null ? "none" : String(levers[k])]));
  $("scenario-link").href = `sandbox.html?${q}`;
}

function status(kind, text) {
  $("f-status").innerHTML = `<div class="status ${kind}"><span class="icon" aria-hidden="true">${kind === "good" ? "✓" : "!"}</span><span>${esc(text)}</span></div>`;
}

async function submit(e, levers) {
  e.preventDefault();
  const configured = FORM.provider === "formspree" ? Boolean(FORM.endpoint) : FORM.provider === "web3forms" ? Boolean(FORM.accessKey) : false;
  if (!configured) { status("warning", t("off")); return; }
  const question = $("f-question").value.trim(), email = $("f-email").value.trim();
  if (!question || !$("f-email").checkValidity() || !email || !$("f-consent").checked) { status("warning", t("invalid")); return; }
  if ($("f-website").value) { status("good", t("sent")); return; } // bot filled the trap field

  const payload = {
    subject: "Taiwan energy system model: simulation request",
    question, email, name: $("f-name").value.trim(), organisation: $("f-org").value.trim(),
    scenario: JSON.stringify({ base: "today", levers }), sandbox_link: new URL($("scenario-link").href, location.href).href,
    page_language: document.documentElement.lang,
  };
  const button = $("f-submit");
  button.disabled = true;
  status("warning", t("sending"));
  try {
    let res;
    if (FORM.provider === "formspree") {
      res = await fetch(FORM.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
                                         body: JSON.stringify({ ...payload, _replyto: email }) });
    } else {
      res = await fetch("https://api.web3forms.com/submit", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
                                                              body: JSON.stringify({ ...payload, access_key: FORM.accessKey, from_name: "Taiwan energy system model" }) });
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    status("good", t("sent"));
    $("request-form").reset();
  } catch {
    status("critical", t("failed"));
  } finally {
    button.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const levers = scenarioFromUrl();
  showScenario(levers);
  $("request-form").addEventListener("submit", (e) => submit(e, levers));
  document.addEventListener("langchange", () => showScenario(levers));
});

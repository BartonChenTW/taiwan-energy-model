# Simulation requests: collecting them automatically

Status: **design only, not built** (2026-09-24). The request page (`docs/request.html`, `docs/assets/request.js`) exists, but it sends nothing yet, because `FORM` in `request.js` is empty.

## Goal

A visitor asks for a scenario on the website. The request ends up as a file in a GitHub repository, without the visitor needing a GitHub account or seeing GitHub, and without anyone copying emails by hand. Later, the same entry point can feed automatic solving (sandbox Phase 2, `pypsa_tw/sandbox/PHASE2_LIVE_SOLVING.md`).

## Options

| Option | Visitor needs | Where requests end up | Effort | Verdict |
| --- | --- | --- | --- | --- |
| A. GitHub issue link | GitHub account; sees GitHub | Public issue | Enable issues | No: public, and needs an account |
| B. Web3Forms / Formspree | Nothing | Your mailbox | 2 min: get a key, set `FORM` | Good **interim** step; no GitHub file |
| C. Form service → email → Zapier/Make → GitHub | Nothing | Repo file | Third party reads your mailbox; free plans are limited | Fragile, not recommended |
| **D. Cloudflare Worker → GitHub API** | Nothing | **File in a private repo**, plus GitHub's email notification | About 1 h once | **Recommended** |

## Recommended: form → Cloudflare Worker → private GitHub repo

```text
docs/request.html ──POST JSON──▶ Cloudflare Worker (free plan) ──GitHub REST API──▶ private repo pypsa-tw-requests
                                  1. checks the origin (CORS)                          requests/2026-09-24T1830Z_ab12cd.json
                                  2. verifies Cloudflare Turnstile (spam)             (GitHub notifies you by email)
                                  3. validates and trims the fields
                                  4. writes one JSON file per request
```

**Why this design:**
- **Private repo.** Requests contain people's email addresses. The model repo (`BartonChenTW/pypsa-earth`) and the website are public, so requests must never be written there.
- **The token stays secret.** A static GitHub Pages site cannot hold secrets. The Worker holds the GitHub token as an encrypted secret; the website only knows the Worker's URL.
- **Free.** Cloudflare Workers' free plan allows 100,000 requests a day, and Turnstile is free. That's far more than needed. Check current limits when setting up.
- **No email middleman.** GitHub's notification for new commits and files, or a watch on the repo, is the alert.

### Request file format

`requests/<UTC timestamp>_<6-character id>.json`:

```json
{
  "id": "ab12cd",
  "received": "2026-09-24T18:30:12Z",
  "status": "new",
  "question": "Offshore wind +12 GW and Maanshan restarted, with 2018 weather",
  "email": "someone@example.org",
  "name": "",
  "organisation": "",
  "scenario": {"base": "today", "levers": {"add_offwind_GW": 12, "nuclear_restart": ["maanshan"]}},
  "sandbox_link": "https://bartonchentw.github.io/pypsa-earth/sandbox.html?add_offwind_GW=12&nuclear_restart=maanshan",
  "page_language": "en"
}
```

`scenario` uses the sandbox spec format (`pypsa_tw/sandbox/levers.py`), so it can be passed straight to `run_scenario.py`.

### Worker code (sketch, to review before deploying)

```js
// worker.js — Cloudflare Worker: receive a simulation request and store it in a private GitHub repo.
// Secrets (wrangler secret put ...): GITHUB_TOKEN, TURNSTILE_SECRET
// Vars (wrangler.toml [vars]):       REPO = "BartonChenTW/pypsa-tw-requests", ALLOWED_ORIGIN = "https://bartonchentw.github.io"

const MAX = { question: 4000, email: 200, name: 200, organisation: 200 };

export default {
  async fetch(request, env) {
    const cors = { "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN, "Access-Control-Allow-Methods": "POST, OPTIONS",
                   "Access-Control-Allow-Headers": "Content-Type" };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST" || request.headers.get("Origin") !== env.ALLOWED_ORIGIN)
      return new Response("Forbidden", { status: 403, headers: cors });

    let body;
    try { body = await request.json(); } catch { return new Response("Bad JSON", { status: 400, headers: cors }); }
    if (body.website) return Response.json({ ok: true }, { headers: cors }); // honeypot field filled: a bot

    // Spam check: Cloudflare Turnstile token from the form.
    const ts = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: body.turnstile || "",
                                  remoteip: request.headers.get("CF-Connecting-IP") || "" }),
    }).then((r) => r.json());
    if (!ts.success) return new Response("Spam check failed", { status: 400, headers: cors });

    const clip = (v, n) => String(v ?? "").trim().slice(0, n);
    const email = clip(body.email, MAX.email);
    const question = clip(body.question, MAX.question);
    if (!question || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return new Response("Missing fields", { status: 400, headers: cors });
    let scenario = null;
    try { scenario = JSON.parse(body.scenario || "null"); } catch { /* keep null */ }

    const now = new Date();
    const id = crypto.randomUUID().slice(0, 6);
    const record = {
      id, received: now.toISOString(), status: "new", question, email,
      name: clip(body.name, MAX.name), organisation: clip(body.organisation, MAX.organisation),
      scenario, sandbox_link: clip(body.sandbox_link, 1000), page_language: clip(body.page_language, 10),
    };
    const path = `requests/${now.toISOString().replace(/[-:]/g, "").slice(0, 13)}Z_${id}.json`;

    // GitHub REST API: create a file (PUT /repos/{owner}/{repo}/contents/{path}).
    const gh = await fetch(`https://api.github.com/repos/${env.REPO}/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json",
                 "User-Agent": "pypsa-tw-requests-worker", "X-GitHub-Api-Version": "2022-11-28" },
      body: JSON.stringify({ message: `New request ${id}`,
                             content: btoa(unescape(encodeURIComponent(JSON.stringify(record, null, 2)))) }),
    });
    if (!gh.ok) return new Response("Could not store the request", { status: 502, headers: cors });
    return Response.json({ ok: true, id }, { headers: cors });
  },
};
```

**Things to check when building it:**
- **Rate limiting:** add a Cloudflare rate-limiting rule on the Worker route (e.g. 5 requests per IP per 10 min).
- **CORS:** the Worker rejects any `Origin` other than the site. Plain `curl` calls with no Origin header are rejected too.
- **Encoding:** the UTF-8 encoding of Chinese text in `btoa(...)` must be tested with a Chinese request.

### Website changes (`docs/assets/request.js`, `docs/request.html`)

- **Settings:** add `FORM.provider = "worker"` with `FORM.endpoint = "https://<worker>.<account>.workers.dev"`.
- **Posting:** send the same payload as now, plus the Turnstile token.
- **Turnstile widget:** add it to `request.html`. It needs a `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js">` and a `<div class="cf-turnstile" data-sitekey="...">`. The site key is public; the secret goes into the Worker.
- **Consent text:** update it: "sent to the author and stored in a private repository".

## Set-up steps (for later)

1. **Private repo:** create `BartonChenTW/pypsa-tw-requests`, private, with a README and an empty `requests/` folder. Watch it with "All activity" to get emails.
2. **GitHub token:** Settings → Developer settings → Fine-grained tokens. Repository access: only `pypsa-tw-requests`. Permissions: **Contents: Read and write**, nothing else. Set an expiry and put a reminder in your calendar.
3. **Cloudflare:** create a free account.
   - Create Turnstile: add the site `bartonchentw.github.io`, and note the site key and secret key.
   - Create a Worker: with `npx wrangler init` and deploy with `npx wrangler deploy`, or paste `worker.js` into the dashboard editor.
   - `wrangler secret put GITHUB_TOKEN` and `wrangler secret put TURNSTILE_SECRET`.
   - Set the vars `REPO` and `ALLOWED_ORIGIN`.
4. **Website:** set `FORM` and the Turnstile site key, commit and push.
5. **Test:**
   - Send one English and one Chinese request.
   - Check the JSON file in the private repo and the GitHub email.
   - Check that a request from another origin is rejected.

Keep the Worker code in the public repo under `pypsa_tw/requests_worker/` (no secrets in it) so it is versioned.

## Handling a request

1. **Read it:** open the new file in `pypsa-tw-requests/requests/`.
2. **Solve it:** if `scenario` is set:
   ```powershell
   & .\.venv\python.exe pypsa_tw\sandbox\run_scenario.py --levers '<levers JSON from the file>'
   ```
   Otherwise, turn the question into levers.
3. **Publish:** run `python pypsa_tw/viewer/export_dashboard_data.py`, then commit and push the website.
4. **Close it:** set `"status": "done"` and add `"result_link"` in the request file, then reply to the requester by email with the sandbox link.

Later (sandbox Phase 2), a scheduled job can run steps 2–4 for new files automatically, still solving one request at a time, off the shared workstation.

## Interim option until then

Web3Forms (option B) is quick:
- Get an access key at https://web3forms.com with the contact address barton.chen.energy@gmail.com, then set `FORM = { provider: "web3forms", accessKey: "<key>" }` in `docs/assets/request.js`. The key is safe to publish.
- Requests then arrive by email. The request file can be created by hand, in the same format as above, so nothing needs to change when the Worker replaces it.

## Privacy notes

- Only what the form asks for is stored: question, email, and optional name and organisation.
- Requests stay in the private repo. Published results carry no names or emails; `request.html` already says so.
- Delete request files once they are answered and no longer needed.

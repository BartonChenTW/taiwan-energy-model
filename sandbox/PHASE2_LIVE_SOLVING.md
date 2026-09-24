# Sandbox Phase 2: live solving (design, not built)

Phase 1 is static. The page shows the nearest of a grid of pre-computed scenarios (`batch.py`). Phase 2 would let a visitor solve exactly the settings they chose. This note describes how. Nothing here is implemented.

## What stays the same

- **Spec, validation and hash:** `levers.normalise` and `levers.spec_hash`. The service imports the same module, so the website, the batch and the API cannot drift apart.
- **Solving:** `run_scenario.run(spec)`, with HiGHS only. The Gurobi licence does not cover a web service.
- **Output format:** the case JSON of `export_dashboard_data.export_case`, plus `sandbox_metrics`. The page renders it exactly as it renders a pre-computed scenario.

## Architecture

```text
browser ──POST /scenarios {spec}──▶ API (FastAPI) ──enqueue──▶ queue ──▶ worker(s)
   ▲                                   │                                   │
   └──GET /scenarios/{hash} (poll)─────┘◀──────── status, case JSON ◀──────┘
                                        cache: object store keyed by spec hash
```

**API** (FastAPI, stateless):

| Endpoint | Does |
| --- | --- |
| `GET /levers` | Returns lever ranges, defaults and descriptions, as in `docs/data/sandbox/index.json`. |
| `POST /scenarios` | Body `{"base": "today", "levers": {...}}`. Validates with `normalise`; a 422 carries its error message. Computes the hash. If cached: `200 {hash, status: "done", case_url}`. If queued or running: `202 {hash, status}`. Otherwise enqueues: `202 {hash, status: "queued", position}`. |
| `GET /scenarios/{hash}` | Returns `{status: queued/running/done/failed, position, started, error?, case_url?}`. |

- Rate limiting and a queue-length cap: reject with 429 when the queue is full.
- No free-form input reaches the solver. Only validated lever values do, and base names come from `levers.BASES`.

**Queue:** Redis with RQ, or a SQLite table for a single-machine start.
- The job key is the spec hash. Posting the same spec while it is queued or running returns the existing job instead of adding a second one.

**Worker:** one process per CPU core it may use.
- Each job calls `run_scenario.run(spec)`, then exports the case JSON and metrics for that one scenario. This means refactoring `export_sandbox` so it can export a single hash.
- Per-job limits:
  - Wall time: HiGHS `time_limit` (e.g. 120 s) plus a hard process timeout (e.g. 180 s). Today a solve takes 20–35 s on this workstation.
  - Memory: container or cgroup limit (e.g. 3 GB). The LP has about 164k variables; the peak memory of one solve is still to measure.
  - Threads: 1 (HiGHS `threads: 1`), so jobs on the same host do not compete.
  - On failure (infeasible, time-out, out of memory): store `status: failed` with the reason, and cache the failure briefly so a retry storm doesn't re-solve it.

**Cache:** an object store, or a directory on a small volume. Entries are keyed by hash: `<hash>/case.json`, `<hash>/spec.json`, and optionally `<hash>/network.nc`.
- About 300 KB of JSON per scenario, 2–3 MB with the network.
- Identical specs are never solved twice. The cache stays valid until `SPEC_VERSION`, the base networks or the code change; the version string becomes part of the key.

## Hosting

- **Not on the shared workstation** (DDM06479). A small VM or container service, e.g. 2 vCPU and 4 GB, is enough for one or two concurrent solves.
- **The image contains:**
  - the conda environment from `envs/*.lock.yaml`;
  - `scripts/` and `pypsa_tw/sandbox/`;
  - the base inputs: the prepared network (0.9 MB), the solved base (2.3 MB), the costs CSV and the two config files.
- No Snakemake and no data bundles are needed.
- **Front end:** it stays on GitHub Pages. The API sends CORS headers for `bartonchentw.github.io` only.
- **Load estimate:** one solve takes about 30 CPU-seconds. With a 1-core worker, 100 new scenarios a day are under an hour of CPU; cached scenarios are free.

## Front-end flow

1. The levers show the nearest pre-computed scenario immediately (as in Phase 1).
2. If the settings are not an exact match, a "Solve these settings" button appears. It posts the spec and shows the queue position, or "solving (~30 s)".
3. The page polls `GET /scenarios/{hash}` every 3 s. When the status is `done`, it fetches `case_url` and renders it with the same code. The URL already carries the levers, so a shared link re-requests the same hash, which is then a cache hit.
4. On failure, the page shows the reason and keeps the nearest pre-computed scenario on screen.

## Open questions

- Who hosts it, and who pays. Does it need a login, or is it public with rate limits?
- Whether to keep solved networks or only the JSON, which is enough for the page.
- Whether expansion mode (the optimiser chooses capacities) should become a lever. Solves would take longer and results would be harder to read.
- The model's limits (6 buses, one weather year) apply to every live result as well; the caveat stays on the page.

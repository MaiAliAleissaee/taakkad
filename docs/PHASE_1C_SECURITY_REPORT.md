# Phase 1C publication dependency fix — 24 November 2026

Scope: dependency publication blocker only. No model training, benchmark rerun, paid inference, redesign, staff credential/role, schema, record, privacy or deployment-setting changes. The learned artifact remains byte-identical to commit `7aa31e0`; historical detection metrics are not re-evaluated or inflated.

## Verified advisories and minimal updates

Installed versions and paths were verified with `bun why`, the original and regenerated text lockfiles, installed package manifests, the npm advisory audit and upstream advisory metadata. The fixed versions were checked against available releases rather than guessed.

| Package before → after | Advisory IDs | Actual affected path |
|---|---|---|
| source-map-js 1.2.1 → **1.2.2** | GHSA-68fv-2mgg-jv7q | `@tailwindcss/vite → @tailwindcss/node → source-map-js`; also `vite → postcss → source-map-js` |
| js-yaml 4.3.0 → **4.3.2** | GHSA-5p4m-2wfm-xmqj (CVE-2026-59870); GHSA-2883-xcg3-v3hh | `@tanstack/react-start → @tanstack/start-plugin-core → xmlbuilder2 → js-yaml`; ESLint also used the shared old copy |
| Seroval 1.6.8 → **1.6.11** | GHSA-f86p-h4j2-7qgj; GHSA-9wx9-5pv9-3349 | Router/Start/plugin → router-core/start-client/server/plugin-core → Seroval |
| Zod 3.25.76 → **4.6.7** | GHSA-mrhx-c7xc-m3w5 (CVE-2023-54404) | App schemas directly import Zod; framework already used a patched 4.6.7 copy |
| Nanoid 3.3.16 → **3.3.18** | GHSA-2v37-7h3g-55p8 | `vite → postcss → nanoid`; Vite is included through production-package peer paths |
| Vite 8.1.5 → **8.1.6** | GHSA-9jrq-w75r-8gcw; GHSA-rq7h-c2jc-7f22; GHSA-698v-4r3x-3vcv; GHSA-r825-w8mm-5pxw; GHSA-587h-7wmj-h5pm | Direct dev Vite plus peers of production Tailwind/router/Start tooling |

The first four packages resolved the original production-scanner findings. A broader `bun audit --production` then found Vite/Nanoid through peer paths not included by that scanner, so two additional minimal patches were applied before the **single** final regression run. Other framework, React, AI, database and UI dependency versions were not upgraded. Picomatch versions already present in the old lockfile were relinked/deduplicated by installation, not upgraded to a new release. Duplicate YAML/Zod copies were deduplicated.

Exact security-version pins live in `package.json` overrides; Zod and Vite declarations match the intended versions. Existing overrides were preserved. Zod 4.6.7 was already installed in the framework, avoiding an unnecessary downgrade to the first patched 4.6.6 release.

### Zod compatibility and actual mitigation

The `zod/v3` parser shipped inside newer Zod packages was inspected and still traverses oversized constrained arrays. It was **not** used as a version-only workaround. Application imports now resolve to the patched modern default API. Existing schema, login, tracking, approval, alert and privacy tests passed without changing their validation policies. Two offline evaluation-script record constructors received only the required second schema argument (`z.record(z.string(), z.string())`); neither script was executed, and no labels, thresholds or evaluation results changed.

Five retained dependency regression tests cover oversized constrained-array early rejection without element traversal, empty YAML-merge budgeting, indexed-source-map offset rejection with ordinary mapping preserved, attacker-supplied typed-array constructor safety and safe RegExp script serialization. No destructive attack payload or large-memory stress test was run against the live app.

## Actual checks

- Targeted compatibility: **56 tests**, then **38 tests**, passed; schema/auth/approval/privacy/URL/ML and five new parser/serializer regression checks included.
- One final whole-suite run: **282 tests / 25 files PASS**; 09:15 UTC. No repeated full suite or detection benchmark.
- Automated sandbox build signal: **build OK** after installation; no manual builds or restarts. Production packaging is performed by the managed publishing deployment; its serving result must be verified separately below rather than inferred from a scheduled request.
- Final `bun audit --production --json`: **`{}` — no reported advisories**, including peer/build paths.
- Fresh production dependency scanner: **no known vulnerabilities among 59 production dependencies**.
- Quick backend/public-surface scan: one pre-existing informational public-registry finding only; no critical/warning findings. It was not modified or ignored. No persisted dependency findings existed to close; raw advisories were resolved by installed package updates, not suppression.
- Actual preview: English desktop 1091×754 and Arabic mobile 390×844 learned warning/ordinal 65; channel remains unverified, optional paid AI/metadata off, no target request/input persistence, reload clearing, signed-out staff denial and no browser errors/overflow.
- Trained JSON artifact SHA256 unchanged; all original model code, public/private records and staff credentials untouched. Zero paid service calls.

## Development-only advisories retained outside this publication fix

The **all-dependency** audit is not clean. These remain in development-only tool chains and do not appear in the final production audit. They were neither silently dismissed nor upgraded beyond the requested publication scope. Keep test/editor/development servers private and do not process untrusted glob/YAML/source inputs with development tools. A separate development-tooling update is an available follow-up; this is not a claim of whole-repository security certification.

- `@vitest/mocker 4.1.11` via dev `vitest`: GHSA-qxg6-89mg-rqv8, GHSA-xp26-3454-mjgp. Mitigation: do not expose mock-registration servers; patch Vitest/mocker to 4.1.12 in a separate tested update.
- `brace-expansion 1.1.16` via ESLint/minimatch and dev `5.0.8`: GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895, GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p, GHSA-q2hr-2g5m-vwhr. Mitigation: trusted/bounded glob inputs; separately update compatible v1 to 1.1.21 and v5 to 5.0.12.
- Old `esbuild 0.18.20` through dev Drizzle tooling's `@esbuild-kit/esm-loader → @esbuild-kit/core-utils`: GHSA-67mh-4wv8-2f99. Mitigation: never expose its development server; separately update the loader/tooling to a compatible esbuild >=0.25 release. Current main esbuild 0.25.12 is not the vulnerable copy.
- `launch-editor 2.14.1` via managed devtools-bundler-core: GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-587h-7wmj-h5pm. Mitigation: keep editor endpoints private; patch editor tooling to >2.14.1 in a separate change. Publishing does not expose the Vite/editor server.
- Dev `minimatch 10.2.6` (vulnerable range >=7,<11.0.1): GHSA-g3hv-75wg-m249. Exact parent path is in the JSON evidence. Mitigation: trusted/bounded globs and a separately tested parent/tooling upgrade; do not blindly replace a major API.

Full advisory IDs, ranges, installed paths and lockfile delta are retained in the companion JSON evidence. These development-only issues are not represented as resolved or as public runtime exposures. No deep code scan or production-readiness certification was requested/performed in this scoped dependency fix.

## Publication and delivery

Production checks and one final regression are clear. Publication and actual production Arabic/English inference verification are pending; a scheduled deployment alone is not success evidence. Once verified, this section and roadmap are updated without retraining or repeating the accuracy evaluation.

Changed files: `package.json`, `bun.lock`, two offline record-schema compatibility lines, `src/test/dependency-security.test.ts`, roadmap and this report/evidence. Final handoff documentation may add a post-publication status note. Commit IDs are supplied externally after saving; GitHub branch settings/visibility are not changed.
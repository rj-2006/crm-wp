# Team Collaboration & Merge-Freedom Checklist

Two-person model: **Person A (Build)** owns Part 1, **Person B (QA)** owns Part 2.
The system is wired so the two rarely touch overlapping files. This checklist is the contract.

---

## 1. Directory Ownership (the core of conflict-freedom)

| Path | Owner | Notes |
|---|---|---|
| `apps/api/src/` (auth, users, contacts, leads, tags, templates, prisma, config, common) | **A** | All feature code |
| `apps/api/src/reports/` | **B** | QA's feature (M5) |
| `apps/api/src/main.ts`, `app.module.ts`, `app.controller.ts` | **A** | Bootstrap / DI registrations |
| `apps/api/prisma/schema.prisma` + migrations | **A** | Schema changes need a heads-up thread |
| `apps/api/test/**` (unit, integration, e2e) | **B** | ALL test code |
| `test/mocks/*` (mock Meta provider, mock queue) | **B** | Only lives under `test/`, never `src/` |
| `.github/workflows/**` (CI) | **B** | CI is QA infrastructure |
| `apps/api/jest*` config + test-related npm scripts | **B** | |
| `docs/` | **B** | Architecture, API, README, handover |
| `infra/` (docker, deploy, staging) | **B** | Env provisioning |
| `packages/shared-types/src/` | **A & B** | Shared — see Touchpoint T3 |
| `.env.example`, `docker-compose.yml`, `package.json` | **A & B** | Shared — see Touchpoints |

**Rule 0:** If a file is not in "Shared", you are the *only* person allowed to create or modify it. Enforce via PR self-review (does my diff touch the other person's directories?).

---

## 2. Shared Touchpoints — Exact Protocols

### T1 — `apps/api/package.json`
Dependency changes ALWAYS conflict.
- Protocol: **install deps on your own branch; never edit package.json directly in a merge**.
- Copy the exact dependency lines into a commit message: `deps: +bcrypt@5` so the merge is a 2-second manual combine.
- Prefer dev-deps for test tools (`jest-mock`, `supertest`, mock providers) — these go in B's branch naturally.

### T2 — `.env.example`
- Protocol: additive-only, alphabetical grouping. Never reorder existing lines.
- Any new env var (A or B) appends at its group; missing values are filled by the other partner at first run.

### T3 — `packages/shared-types/src/` (the CONTRACT)
This is where both of you work. The entire conflict-avoidance strategy depends on it.
- **Freeze a contract version before any feature work.** Commit `contracts/v1` DTOs/enums first.
- Changes require a **contract-review PR**: A opens it, B approves (or vice versa). No silent shape changes.
- Once frozen, both build against it; drift is a contract violation, not a code issue.
- Never edit an existing DTO inline without a review — add a `v2` or review, never break.

### T4 — `apps/api/src/main.ts` / `app.module.ts`
- A owns registration. B never adds imports here — B's modules (e.g. reports) are registered by A on request, or B files the change as a PR that A reviews. Only one modifies app.module.ts per merge cycle to keep trivial diffs.

### T5 — `prisma/schema.prisma`
- A changes schema; B *consumes* it. B must never push schema edits (they'd orphan migrations).
- New columns needed by B's tests → request via a ticket-like PR comment, A implements + migrates, B writes the test after.

---

## 3. Branch Strategy (zero-merge on shared files)

No shared-feature branches. Every piece of work is a vertical pair:

```
┌─ feature/auth (A)     ┐
│ test/auth    (B)      ├─ both branch from develop
├─ feature/contacts (A) ┐
│ test/contacts (B)     ├─ both branch from develop
└                        ┘
```

Merge sequence (only ONE merge at a time, in this order):
1. A merges `feature/X` → `develop`
2. B rebases `test/X` onto the new `develop`, merges → `develop`
3. Repeat for next vertical

Because the source files are disjoint, rebasing is always trivial; the contract stays frozen so nothing reshapes mid-flight.

---

## 4. Daily Workflow

**A** — pull develop → pick next contract item → implement → unit-check → PR (size < ~400 lines) → merge.
**B** — pull develop → write test cases from contract → build CI/test-db/mocks → run A's merged features → report failures with failing test + payload → iterate.
**Both** — merge develop into your local branch at least daily.

Loosely: both rebase every morning; whoever finishes a vertical first merges it the same day.

---

## 5. Definition of Done (both must be true)

- [ ] A's feature passes local unit check
- [ ] B's matching test suite is GREEN against that feature
- [ ] Contract (T3) unchanged or formally reviewed
- [ ] CI pipeline green on `develop`
- [ ] No file in the other person's directory was touched
- [ ] B documented anything observable (env var, endpoint, behavior) in `docs/`

---

## 6. Communication rituals (keep them small)

- **Morning check-in (5 min):** contract frozen? any shape change coming? merge queue clear?
- **Per-feature handshake:** A says "shipped `feature/contacts`"; B says "test green" or attaches failing test.
- **One shared channel** for contract + schema change requests. Keep it written (Slack thread / GitHub issue) since the meeting is recorded and docs are evaluated.

---

## 7. The one thing that WILL conflict (be honest about it)

`app.module.ts` and `package.json` will occasionally line-merge the wrong way. The fix is 2 minutes and known:
- Resolve by keeping **both** imports/deps (never delete the other's line).
- Stash both changes, apply one, apply other, verify `npm run build`.

No feature logic ever sits at a merge conflict point, because logic lives in owned subdirectories.

---

# 8. Milestone-Based Division of Work (from the handbook §28)

The whole project mapped to the booklet's 8 milestones, split across the two people so they stay parallel and conflict-free.

## Legend
- **A = Build** (own Part 1: product code in `apps/api/src/`)
- **B = QA** (own Part 2: all tests, CI, mocks, reporting, docs, delivery)
- **Both** = shared touchpoints (see Protocols T1–T5)

---

## M1 — Foundations — ✅ DONE (by build, prior session)
Requirement analysis, provider research (Meta Cloud API chosen), architecture/stack decided (NestJS + Prisma + Postgres + Redis + BullMQ), DB schema drafted + applied.

| A | B |
|---|---|
| _(already done)_ | _(no action — wait for contract)_ |

---

## M2 — Core CRM *(currently here)*
Auth, contact/lead management, tagging/segmentation.

| A (Build) | B (QA) |
|---|---|
| JWT login + global guards + RBAC | Contract freeze in `shared-types` (auth + contacts DTOs) |
| Users module | Test DB + CI pipeline scaffold |
| Contacts CRUD (company-scoped) | Auth tests (valid/invalid creds, bad-token rejection) |
| Leads + Tags attach/detach | Contacts/leads/tags CRUD tests (tenant isolation: company A can't touch B) |
| Segmentation (tag + consent filters) | Segmentation filter tests + consent-enforcement tests |

**Parallel:** yes — B builds test harness against the frozen contract while A implements.

---

## M3 — Messaging Integration
WhatsApp adapter, individual message send, webhook receiver, message history.

| A (Build) | B (QA) |
|---|---|
| `whatsapp-provider.interface` + Meta Cloud provider | Mock Meta provider under `test/mocks/` |
| 1:1 templated send endpoint | API tests for send endpoint (valid/invalid template, rate-limited) |
| Webhook receiver (verify + process) | Webhook tests: malformed payloads, signature verification, dedupe |
| Message history per contact | Message-history read tests |

**Parallel:** yes — B's mock provider works from the interface contract before A ships the real adapter.

---

## M4 — Bulk Campaigns
Queue/worker layer, campaign creation & launch, rate limiting, retry logic.

| A (Build) | B (QA) |
|---|---|
| BullMQ queue registration | **Queue/retry tests** (the brief's #1 priority) |
| Campaign CRUD + launch endpoint | Campaign launch e2e (valid segment, empty segment) |
| Rate limiter / throttling in workers | Rate-limit + backoff tests |
| Retry with bounded backoff | **Consent-enforcement tests** (opted-out never receives send) |

**Parallel:** yes — B specs the queue tests from the queue design doc while A builds it.

---

## M5 — Reporting
Campaign and delivery reporting dashboards.

| A (Build) | B (QA) |
|---|---|
| _(none — feature owned by B)_ | Reporting endpoints (`/reports/campaigns`) |
| — | Aggregation queries (delivered/read/failed counts, delivery rate) |
| — | Report read tests + dashboard acceptance data |

**Parallel:** yes — B builds reports against the tables A's schema already provides; needs A only for data shape sign-off.

---

## M6 — Hardening
Security review, consent-enforcement checks, validation/error-handling pass.

| A (Build) | B (QA) |
|---|---|
| Fix findings B raises | **Security tests**: auth bypass, tenant-isolation exploits |
| Hook activity/audit logging where B flags gaps | **Validation tests**: phone format, email, consent states |
| Error-handling polish (distinct provider errors, §10) | Error-path API tests (input sent/read/webhook failures) |

**Sequential-ish:** B audits and reports; A fixes. Runs alongside ongoing tests.

---

## M7 — Testing & UAT
Full test pass per Section 24, client/user acceptance testing, bug-fix cycle.

| A (Build) | B (QA) |
|---|---|
| Bug fixes from B's findings | Run **all 10 Section 24 layers** (unit, integration, API, UI, validation, security, performance, cross-browser, mobile, UAT) |
| — | Performance test on queue/workers |
| — | UAT session with client, capture acceptance |

**Sequential:** this milestone is B-led; A is on bug-fix duty. Overflow risk if M2–M6 stayed un-green.

---

## M8 — Deployment & Handover
Production deployment, documentation finalised, demo & presentation.

| A (Build) | B (QA) |
|---|---|
| Final build + smoke test on staging | Staging deploy, webhook reachability check |
| Code freeze support | All 8 docs (§29): README, architecture, DB, API, integration, test report, deploy, user/admin |
| Deliver demo with B | Final delivery checklist (§34) → demo + presentation |

**Both:** shared final gate. Conflicts only on `app.module.ts`/`package.json`, handled per §7.

---

## Milestone Dependency Map (who waits on whom)

```
M1 ✅ → M2 ──┬──→ M3 → M4 → M6 → M7 → M8
             └────→ M5 (B) ───────────┘   (B can run M5 parallel to M3/M4)
```

- **A's chain:** M2 → M3 → M4 (build order is fixed; each builds on the last)
- **B's chain:** M2 tests → M3 tests → M4 tests, **+ M5 independently**, then M6 audit, M7 full pass, M8 delivery
- **Coupling to flag:** e2e tests only run against real endpoints, so B's deepest coverage lands just after A merges each milestone — but B's harness, mocks, contract, CI, and reports don't wait on anyone.
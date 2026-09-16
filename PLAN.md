# Moonlight Cherry — Project Plan

Status: **Draft v1 — for review and refinement.** Nothing below has been built yet. This document reflects decisions made together so far, plus a set of remaining open questions at the end.

---

## 1. Product Definition

Moonlight Cherry is a premium anime image/GIF sharing platform and community: a dark, minimal, tech-inspired gallery experience built around anime artwork, fan art, official art, wallpapers, and GIFs, with real accounts, uploads, tagging, characters, series, collections, community interaction, moderation, and administration.

It is a multi-page production application (Next.js), not a landing page or single dashboard. Artwork is always the primary visual element; UI recedes.

**Brand identity:** cherry tree + crescent moon motif, geometric/premium mark. Black/white base, deep crimson/red accent, subtle gradients, restrained glass/blur effects, clean type, smooth-but-cheap-to-render animation.

---

## 2. User Types & Permissions

### Roles

| Role | Who | Notes |
|---|---|---|
| **Anonymous** | Not signed in | Can browse SFW-only public pages |
| **User** | Default authenticated role | Full baseline member features |
| **Trusted Uploader** | Promoted by Admin/Mod (manually for v1) | Perks below |
| **Moderator** | Staff | Moderation queue, reports, content actions |
| **Administrator** | Staff | Full site management short of owner-only actions |
| **Owner** | Platform owner(s) | Full control, including managing Admins |

### Trusted Uploader perks (proposed)

- Tag / character / series **suggestions auto-approve** instead of entering the review queue.
- Higher upload rate limits.
- Small profile badge.
- Uploads still auto-publish + post-moderate like everyone else (we did **not** choose trust-tiered pre-moderation — see §12), so this role is about reducing metadata-review friction, not publication gating.

### Permission matrix (proposed — confirm in review)

| Action | Anon | User | Trusted | Mod | Admin | Owner |
|---|---|---|---|---|---|---|
| Browse SFW | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Browse NSFW (if opted in) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upload | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comment / like / favorite / follow / message | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Suggest tag/character/series | ❌ | ✅ (queued) | ✅ (auto-approved) | ✅ | ✅ | ✅ |
| Create/edit/merge tag/character/series directly | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Review reports / moderation queue | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Remove content, warn/mute/timeout/restrict users | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Suspend / ban users | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Moderate/ban a Moderator | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage roles (promote/demote) up to Moderator | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage Administrators | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Site settings / feature flags / upload limits | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Danger-zone settings (infra-level, e.g. storage thresholds, purge policy) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

All of the above must be enforced **server-side** on every API route/server action — never inferred from client state.

---

## 3. Authentication

- **OAuth only at launch: Discord + Google.** No password storage, no reset flows, no credential-stuffing surface.
- Session strategy: server-side sessions (DB-backed, e.g. via `next-auth`/Auth.js with a Postgres adapter) rather than pure stateless JWTs, so we can revoke sessions instantly on ban/suspend.
- `/auth/callback` handles the OAuth redirect for both providers.
- Account merge: if a user signs in with Google after previously using Discord (same verified email), we should decide whether to auto-link or keep separate accounts — **flagged in Open Decisions (§20)**.
- New-account defaults: `nsfw_enabled = false`, role = `User`.

**Implemented (Phase 8):** since Discord/Google don't provide a username and every account needs a working `/u/[username]` from the moment it exists, `auth.ts`'s `events.createUser` auto-generates one (slugified display name, numeric suffix on collision) at account creation. Existing pre-Phase-8 accounts were backfilled once. Editable afterward from `/settings`.

---

## 4. NSFW / Access Control

- **Self-attestation model.** Users explicitly opt in to NSFW in `/settings` (age confirmation + toggle). No third-party ID verification in v1.
- Enforcement is **server-side, centralized**: a single data-access layer (e.g. one `getMediaVisibleTo(viewer)` query builder) applies the NSFW filter (`WHERE nsfw = false OR (viewer.authenticated AND viewer.nsfw_enabled)`) and is the *only* path every surface uses to fetch media — homepage, gallery, search, tags, characters, series, profiles, collections, sitemap, RSS/API. No page is allowed to write its own ad hoc query against the Media table for list views.
- **Open Graph / link previews are always anonymous crawlers.** NSFW media must never emit the real image as its OG/Twitter-card image — use a static branded placeholder image instead, and the linked page itself must gate the real content behind the same server-side auth+opt-in check.
- NSFW pages get `noindex` (meta + `X-Robots-Tag` header) and are excluded from `sitemap.xml`.
- **Absolute prohibition, enforced structurally, not just by policy:** no content depicting minors (real or fictional) in a sexual context. This needs, at minimum:
  - A clear, explicit ToS/upload-agreement clause with zero ambiguity.
  - Automated perceptual-hash screening of uploads against known CSAM hash sets (e.g. via Thorn Safer, or NCMEC's hash-matching APIs) before anything is stored/served, not just after report.
  - Mandatory escalation path + legal reporting obligation (e.g. NCMEC CyberTip in the US) when applicable.
  - This is a compliance/legal area — **flagged explicitly in §20**, recommend you loop in whatever legal counsel/compliance resource you have before NSFW goes live, independent of anything I can architect.
- Age gate copy/UX (interstitial vs. inline settings toggle) — to be designed in the UI/UX phase.

**Implemented (Phase 5):** the shared layer is `src/lib/media/query.ts` — `getViewerContext()` + `visibleMediaWhere()`, used by every list (homepage, `/gallery`, `/api/media`) and by `getVisibleMediaById()` for the detail page. Verified directly: an anonymous/non-opted-in viewer gets 404 on a direct NSFW media URL and never sees it in any list; a viewer with `nsfwEnabled: true` sees it in both.

**Implemented (Phase 8):** the opt-in toggle itself now exists on `/settings`, closing the gap noted above — the checkbox is explicit ("I am 18 or older and want to see NSFW content"), off by default, and the page states plainly that opting out (or staying anonymous) means never seeing it regardless. Age-gate interstitial copy/UX beyond a plain settings checkbox is still open, per the line above.

---

## 5. Media Architecture

### Supported formats
JPG/JPEG, PNG, WEBP, AVIF, GIF (upload). Delivery formats generated by the pipeline (below).

### Upload limits (v1, admin-configurable later)
- Images: **20MB** max.
- GIFs: **50MB** max.
- Dimension caps: to be set as part of pipeline validation (e.g. max 8000px on the long edge) — reasonable default, adjustable via `/admin/settings` without a redeploy.
- These are *starting* values stored as `SiteSetting` rows, not hardcoded constants, so they can change without a deploy.

### Variants generated per image
- `thumbnail` (~300px, for grid/masonry cards)
- `small` (~600px)
- `medium` (~1200px, for in-page viewing)
- `original` (validated/optimized, re-encoded to strip EXIF, capped to the dimension limit)
- Formats: serve WebP/AVIF where the browser supports it (via `<picture>`/`srcset`), fall back to the original format.

### GIF handling
GIFs are large and expensive to serve raw at scale, so:
- Generate a **static poster frame** (first/representative frame, WebP) for use in feed/grid thumbnails — grids never autoplay full GIFs.
- Generate a **lightweight animated preview** (small animated WebP or short muted MP4/WebM loop) for hover/card preview.
- Full-view page plays the true animated asset (re-encoded/optimized GIF, or animated WebP if noticeably smaller with no visible quality loss) with the original available for download.
- This keeps the masonry grid smooth (per the performance requirement) instead of dozens of full-size animated GIFs decoding simultaneously in-browser.

### Storage
- **Local disk**, structured by content hash/ID (avoids directory bloat, enables dedup-by-hash later), served through Caddy.
- Storage-usage monitoring: a scheduled job tracks disk usage and raises an admin alert (and can auto-throttle new uploads) past configurable thresholds (e.g. warn at 80%, block new uploads at 90%) — thresholds live in `/admin/settings`.
- The storage access layer is written behind a small internal interface (`putFile`, `getFile`, `deleteFile`, `getUrl`) even though the only implementation for now is local disk — this costs nothing extra today and avoids a rewrite if object storage (MinIO/S3-compatible) is ever adopted later. This is *not* a scope change or infra addition now, just an implementation-hygiene note.

---

## 6. Upload / Processing Pipeline

1. Client-side pre-checks (type/size) for fast feedback — **never trusted**, server re-validates everything.
2. Server-side validation: MIME sniffing (not just extension), file size, dimension bounds, corrupt-file rejection.
3. CSAM perceptual-hash screening (see §4) — blocks storage/publication on match, flags for mandatory human + legal review.
4. Store original (post EXIF-strip) via the storage interface.
5. Enqueue background job: generate thumbnail/small/medium variants (+ GIF poster/preview per §5).
6. Media row created with `status = published` (auto-publish policy, §12) once the async pipeline completes; a transient `status = processing` state is shown to the uploader in the meantime.
7. Automated moderation signals (e.g. perceptual-hash flags, later: ML NSFW classifier as a *report-prioritization* signal, not a gate) attach to the media for the moderation queue's attention — they don't block publication by themselves except CSAM (step 3).
8. Trending/ranking score recomputation picks the new item up on the next scheduled pass.

### Async processing
Given the existing stack (Docker Compose, Postgres, no Redis), background jobs run via a **Postgres-native job queue** (e.g. `pg-boss` or `graphile-worker`) rather than adding Redis/BullMQ — this avoids a new stateful service while still giving us reliable async processing, retries, and scheduled/cron-style jobs (storage scans, trending recompute, soft-delete purge). **Flagged in §20** in case you'd rather add Redis for a more conventional queue.

### Implemented (Phase 4)

The pipeline above (steps 1–6) is live: `src/lib/media/validate.ts` (magic-byte sniffing via `file-type`, size/dimension checks against live `SiteSetting` values), `src/lib/media/storage.ts` (content-addressed local disk storage, sharded by hash prefix, plus a real disk-headroom check that blocks uploads past the configured threshold), `src/lib/media/process.ts` (variant generation via `sharp` — thumbnail/small/medium for static images, poster/animated-preview/animated-medium for GIFs), and `pg-boss` as the job queue with a standalone worker process (`scripts/worker.ts`, `npm run worker`) — a separate process from the web server, matching the planned architecture. `/upload` and `/i/[id]` are minimally real (functional end-to-end, not styled/complete — full metadata selection and the polished media page are Phases 9 and 6 respectively).

**Step 3 (CSAM screening) is explicitly NOT implemented.** `src/lib/media/csam-screen.ts` is a clearly-labeled stub that lets every upload through and logs a loud warning every time it's called. This remains open item §20.3 — a real provider (Thorn Safer, NCMEC hash-matching, etc.) must be evaluated and wired in before this platform handles real, public uploads. Do not treat the current pipeline as safe for that.

### Implemented (Phase 9)

`/upload` is now the full flow: live file preview before submitting, title/description, the NSFW checkbox (which needs zero extra plumbing — Phase 5's visibility layer already gates on `Media.nsfw`, verified again here), real upload progress via `XMLHttpRequest` (`fetch` doesn't expose upload progress), and the same tag/character/series/category fields as Phase 7's post-upload editor. Rather than duplicate that logic, the find-or-create/sync code was pulled out to `src/lib/taxonomy/sync.ts`, shared by both the upload route (no permission check needed — you're creating your own media) and the post-upload edit action (which does check ownership/role). Verified end-to-end with a real multi-field upload (title, description, tags, character, series, category) and separately confirmed the NSFW checkbox correctly hides the item from anonymous viewers with no additional code.

---

## 7. Database Architecture

Relational, PostgreSQL. **Implemented** as of Phase 3 — see `prisma/schema.prisma` for the authoritative, current shape (41 tables). Still refinable as real usage patterns emerge; what follows is the design intent behind that schema, not a duplicate source of truth.

Cascade behavior first pass: content-authoring relations (`Media.uploaderId`, `Comment.authorId`, `Message.senderId`, `Report.reporterId`, `ModerationAction.actorId`, `AuditLog.actorId`, tag/character/series suggestion submitters) are nullable with `onDelete: SetNull`, so hard-deleting a user preserves the content/history instead of cascading destruction through it. Pure ownership/activity records with no standalone meaning (`Like`, `Favorite`, `Follow`, `CommentLike`, `Block`, `Session`, `Account`, `Collection` + its items) cascade-delete with the user. Categories seeded from the initial list; `SiteSetting` seeded with the approved upload-limit/storage-threshold/retention defaults from §5/§7 so they're admin-editable from day one instead of hardcoded.

### Core entities
- `User`, `Account` (OAuth identities), `Session`
- `Role`, `Permission` (or a simpler enum-based role on `User` + a permission-matrix table if we need finer granularity later — start with an enum for v1 given only 6 roles)
- `Media`, `MediaVariant` (one row per generated size/format), `MediaMetadata` (EXIF-stripped technical data, dimensions, etc.)
- `Category`, `MediaCategory` (many-to-many, per §20 decision on multi-category)
- `Tag`, `MediaTag`, `TagSuggestion` (pending user submissions)
- `Character`, `MediaCharacter`, `CharacterSuggestion`
- `Series`, `MediaSeries`, `SeriesSuggestion`
- `Collection`, `CollectionMedia`
- `Like`, `Favorite`
- `ViewEvent` (raw log, deduped/aggregated into a denormalized `Media.viewCount` by a background job — see §9) rather than incrementing a counter on every request
- `Follow`
- `Comment`, `CommentLike`
- `Notification`
- `Conversation`, `ConversationParticipant`, `Message`, `Block`
- `Report`, `ModerationAction`, `AuditLog`
- `UserXP`, `UserLevel`, `Achievement`, `Badge`, `UserBadge` — **schema reserved now, logic deferred** (§11)
- `SiteSetting` (admin-configurable values: upload limits, storage thresholds, rate limits, feature flags)

### Cross-cutting patterns
- **Soft delete** (`deletedAt`) on `User`, `Media`, `Comment`, `Message`, `Collection`. A scheduled purge job hard-deletes rows (and files, for Media) past a retention window (default 30 days) that's admin-configurable. All list/detail queries filter `deletedAt IS NULL` at the same shared data-access layer used for NSFW filtering.
- **Audit logging**: every moderation action, role change, and destructive admin action writes an `AuditLog` row (actor, action, target, reason, timestamp) — never silently mutate.
- **Indexes**: composite indexes on the hot query paths — `(nsfw, deletedAt, createdAt)` for feeds, `(nsfw, deletedAt, category)` for category pages, GIN indexes on `tsvector` search columns and on tag/character/series join tables' foreign keys.
- **Denormalized counters** (`likeCount`, `viewCount`, `favoriteCount`, `commentCount` on `Media`) updated via background jobs/triggers rather than computed with `COUNT()` on every page load — keeps gallery/search queries cheap.

---

## 8. Search

- **PostgreSQL-only for v1**: `tsvector` full-text columns (title, description, tags, character/series names) + `pg_trgm` for fuzzy/typo-tolerant matching + standard B-tree/GIN indexes for structured filters (category, tags, character, series, uploader, NSFW eligibility, date, sort).
- Filters: newest, oldest, most liked, most viewed, trending, category, tag(s), character, series, uploader, NSFW-eligible-only.
- Revisit a dedicated engine (Meilisearch/Typesense) only if query volume or relevance quality genuinely outgrows Postgres — designed so the search API's internal contract doesn't leak Postgres-specific query shape into the frontend, keeping a future swap contained to the backend.

**Implemented (Phase 7), simpler than the target above:** `/search` uses plain `ILIKE` (Prisma `contains`, case-insensitive) against `Media.title`, uploader name/username, and `Tag`/`Character`/`Series` names — no `tsvector` columns or `pg_trgm` indexes yet. Correct results at today's scale, but a full table scan per query rather than an indexed lookup. Add `pg_trgm` + GIN indexes (or the full `tsvector` approach above) before this matters for real traffic — noted here rather than silently left as a surprise later. Category/tag/character/series/sort filtering all work today via `/gallery`'s query params (Phase 5) and the taxonomy detail pages (this phase); `/search` itself doesn't yet expose those as combinable filters in one UI — right now it's a single query box across all entity types.

---

## 9. Community Features

### Comments
Single-level replies (comment → replies, no infinite nesting) to keep threads readable and UI simple — flag if you want deeper nesting. Mentions (`@username`), likes, timestamps, report action, moderation (edit/remove by mod, own-delete by author).

**Implemented (Phase 11):** `src/lib/comments/` — posting, single-level replies (replying to a reply attaches to its original thread rather than erroring or nesting deeper, verified directly), `@username` mentions (linkified, and each mention fires a notification), comment likes, and own-delete. Mod-level remove-others'-comments waits for the moderation UI (Phase 15) — author-only delete is real today. **Reporting** (`src/lib/moderation/actions.ts`) is real for media (and the same action already supports comment/user/message target types, just not wired to a button on those surfaces yet) — writes a real `Report` row; nothing reviews it yet (Phase 15/16).

### Following
`Follow` relationship powers: notifications on new upload from followed users (opt-out-able), and creator discovery. **Full activity feed is deferred** alongside gamification (§11) — the relationship and its notification hook ship in the core community phase, but a dedicated `/dashboard` "activity feed" aggregation view is a later-phase feature.

**Implemented (Phase 11):** the notification hook itself. `src/lib/media/process.ts` fans out a `NEW_UPLOAD` notification to every follower once a media item publishes — verified through the real pipeline (upload → worker → publish → follower notified), not simulated. `FOLLOW` notifications fire on follow (not unfollow). Also fixed a real bug found while wiring the `LIKE` notification: **uploaders could like their own media** — blocked now (`src/lib/media/actions.ts`), both for trending-fairness and because a self-notification made no sense to suppress silently.

### Notifications
Likes, comments, replies, mentions, new followers, moderation events (your content was removed/warned), system announcements. **Polling-based** delivery for v1 (client polls an unread-count/list endpoint on an interval + on navigation) rather than WebSockets — matches the modest-infra constraint and avoids a new stateful realtime service.

**Implemented (Phase 12).** Real `/notifications` and a header bell polling `/api/notifications/unread-count` every 30s. Notification payloads store only stable ids (actorId/mediaId/commentId) — Phase 11's first pass also snapshotted an `actorName` into the payload, which was a mistake caught and fixed before this phase built on it: a snapshotted name goes stale the moment someone changes their username (which had already happened once in this project by Phase 12), so display data is always resolved live from current `User`/`Media` rows instead. Mark-all-read fires from a `useEffect` in a small client component mounted on the page, specifically *not* as a side effect of the Server Component's render — Next prefetches `<Link>`s on hover/viewport, which would otherwise mark notifications read before anyone actually saw them. `MODERATION` and `SYSTEM` types remain wired in the schema/enum with nothing generating them yet — those wait on Phase 15 (moderation actions) and an admin announcements feature that doesn't exist.

### Views
Counted via a `ViewEvent` log deduped per (user-or-anon-session, media, rolling 24h window) rather than incrementing on every request, aggregated into `Media.viewCount` by a background job — prevents refresh-spam view inflation and keeps the write path cheap.

**Implemented (Phase 6):** dedup happens synchronously per-request against `ViewEvent` (not yet a separate aggregation job — at current scale a direct dedup-check-then-increment in `src/lib/media/views.ts` is simpler and correct; revisit if `ViewEvent` volume ever makes that check expensive) rather than a periodic background job. Anonymous dedup uses a random id in an httpOnly cookie (`mc_anon`, 1-year expiry) set by `/api/media/[id]/view`, a Route Handler triggered by a small client-side beacon on page load (Server Components can't set cookies, so this couldn't be done in the page itself). Self-views by the uploader don't count. **Likes and favorites** (`src/lib/media/actions.ts`) are real Server Actions with optimistic UI, verified end-to-end including the DB-level compound-unique key names. **Full-size viewing** is a click-to-open lightbox on `/i/[id]` (Escape or backdrop-click to close); download uses the real `ORIGINAL` variant. Comments are still Phase 11 — not touched here.

### Messaging

The original brief left "real-time from the start, or something simpler for v1" as an open question and it was never explicitly revisited on its own — **Phase 13 resolved it by applying the same answer already given for notifications**: polling, not WebSockets, for the same modest-infra reasoning.

**Implemented (Phase 13).** `/messages` (conversation list, unread indicator) and `/messages/[id]` (real 1:1 conversations — the schema's `ConversationParticipant` is many-to-many so group chats are possible later without a migration, but v1 only ever creates 2-participant conversations). The open conversation polls `/api/messages/[id]` every 4s for new messages; sending is a Server Action, not the poll response, so your own messages appear immediately rather than waiting for the next tick. "Emojis" needed no dedicated feature — a plain text input already accepts them natively via the OS/browser emoji keyboard, so building a custom picker would've been unnecessary complexity for something already covered. **Blocking** is bidirectional-checked (either party blocking the other cuts off sending in both directions) and enforced in the Server Action itself, not just hidden in the UI — verified directly rather than assumed. A "Message" button on `/u/[username]` starts or resumes a conversation. Reporting reuses Phase 11's `submitReport` with the `USER` target type from the conversation header.

---

## 10. Collections

Name, description, cover image (defaults to first/most-recent item if unset), public/private visibility, media count, add/remove media. Private collections are excluded from profile pages, search, and sitemaps for other viewers (owner-only visibility check at the same shared data-access layer as NSFW filtering).

**Implemented (Phase 10).** `/dashboard/collections` (create/edit/delete, both visibilities) and the public `/collections/[id]` view. "Save to collection" lives on `/i/[id]` itself — a dropdown of your own collections with checkboxes, plus inline creation. Cover image is always derived from the most-recently-added item's thumbnail (no explicit override field — simplification, not a limitation anyone's hit yet). Collection visibility and per-item NSFW visibility are enforced as two separate checks: a public collection can contain NSFW items that still individually stay hidden from an ineligible viewer, verified directly rather than assumed. Public collections now show on `/u/[username]`; private ones don't, verified against a real public/private pair. Also added `/dashboard/uploads` and `/dashboard/favorites` in the same pass — pure reuse of infrastructure that already existed (Phase 6/9), not worth a separate phase, and leaving them stubbed next to a newly-real `/dashboard/collections` would've been an odd gap. `/dashboard/history` stays stubbed — "history" isn't defined anywhere yet (recently viewed? edit history?) and deserves its own decision, not a guess.

---

## 11. Gamification

**Deferred to a later development phase**, per your decision. For v1:
- Reserve the schema (`UserXP`, `UserLevel`, `Achievement`, `Badge`, `UserBadge`) so no painful migration is needed later.
- Build **no** XP-earning logic, leaderboard UI, or badge UI yet.
- **Trending/ranking, however, is core to the homepage and ships in v1** (it's a discovery feature, not a gamification reward system) — see below.

### Trending algorithm (v1, needed for homepage §"Trending media")
Time-decayed score, recomputed periodically by a background job (not on every request):

```
score = (likeCount * w_like + favoriteCount * w_fav + commentCount * w_comment) / (age_in_hours + 2) ^ gravity
```

Anti-abuse baseline:
- View/like/favorite events rate-limited per user/IP.
- Views deduped per user per media per 24h window (§9).
- Minimum account age or trust level required for an engagement to count toward *trending* weight (still counts as a real like/favorite for the user, just not for ranking) — blunts brand-new throwaway-account brigading.
- Anomalous velocity (e.g. huge like spike from a narrow IP range) flags the media for moderator review rather than silently boosting it.
- Exact weights/gravity are tuning parameters, not architecture — start conservative and adjust from real data.

**Implemented (Phase 5):** `src/lib/media/trending.ts` computes exactly this formula (starting weights: like=1, favorite=2, comment=3, gravity=1.5 — still just a starting point per §20.10) via a raw SQL bulk update; `scripts/worker.ts` schedules it every 5 minutes via `pg-boss`, plus once on worker boot. The anti-abuse baseline above (rate limits, view dedup, trust-gated weighting, anomaly detection) is **not implemented** — there's no abuse to guard against yet since there's no real traffic, but this needs to land before the trending list is exposed to real users at scale, not left for "later" indefinitely.

---

## 12. Moderation

- **Auto-publish + post-moderation.** Uploads go live immediately after the processing pipeline (CSAM screening still gates at upload time, per §4/§6); community reports and moderator review handle everything else after the fact.
- Report targets: Media, Comment, User, Message. Categories: illegal/prohibited content, harassment, spam, copyright, incorrect metadata, other.
- Moderation queue (`/admin/moderation`, `/admin/reports`) surfaces: open reports, CSAM/hash-flagged uploads (highest priority, likely auto-escalated + auto-hidden pending review rather than staying live), high-velocity/anomalous trending flags.
- Moderator actions: approve, reject, remove, edit metadata, warn, mute, timeout, restrict, suspend, ban — scoped by the permission matrix (§2: Mods cannot act on Admin/Owner accounts).
- Every action writes an `AuditLog` + a `ModerationAction` row visible in the target user's moderation history (for Admin/Owner review) and usable as evidence in appeals.
- Tag/Character/Series moderation: user suggestions queue (auto-approved for Trusted Uploader+), Mod+ can create/edit/merge/rename directly, with merges reassigning all `Media*` join rows and redirecting the old page.

**Deliberate simplification (Phase 7):** tag/character/series creation is currently **direct for every authenticated user**, not queued — when an uploader tags their own media with a new name, the `Tag`/`Character`/`Series` row is created immediately (find-or-create by slug via `src/lib/taxonomy/actions.ts`), not routed through `TagSuggestion`/`CharacterSuggestion`/`SeriesSuggestion`. Those tables stay in the schema, reserved, but building the queued-pending path now would create suggestions nothing can ever approve, since the admin moderation queue doesn't exist until Phase 16 — a stuck queue is arguably more "fake" than direct creation. **Still not revisited** — Phase 15/16 below covers user/media moderation and the admin panel shell, not the tag/character/series suggestion queue, which remains open.

**Implemented (Phase 15/16, combined):** a `ModerationStatus` enum (`ACTIVE, WARNED, MUTED, TIMED_OUT, RESTRICTED, SUSPENDED, BANNED`) on `User`, with `moderationUntil`/`moderationReason` alongside it. Time-boxed restrictions expire automatically **at read time** (`src/lib/admin/moderationStatus.ts`) — no cron job: `isActiveRestriction()` compares `moderationUntil` against `Date.now()` on every check, so a lifted timeout just stops blocking the moment it's in the past, with no janitor process needed. Enforcement is direct at each affected boundary rather than one central gate: `auth.ts`'s `signIn` callback blocks `BANNED`/active-`SUSPENDED` accounts from establishing a session at all; `src/lib/comments/actions.ts` and `src/lib/messaging/actions.ts` block posting for `MUTED`/`TIMED_OUT`/`SUSPENDED`/`BANNED`; `src/app/api/upload/route.ts` blocks uploading for `RESTRICTED`/`SUSPENDED`/`BANNED`. `BAN`/`SUSPEND` also immediately deletes every one of the target's `Session` rows (kicked out mid-session, not just blocked on next login) — verified directly: banning a user with an active session token turns their very next request to a protected route into a redirect, not merely a future login failure.

A 5-tier role rank (`USER < TRUSTED_UPLOADER < MODERATOR < ADMINISTRATOR < OWNER`, `src/lib/admin/permissions.ts`) backs `canModerateRole`/`canAssignRole`: a moderator can never act on, or promote someone to, a role at or above their own. Verified directly by calling the admin server actions as a plain `USER` session (bypassing the UI entirely, straight RSC-action calls) and confirming a clean `{ok:false}` permission rejection rather than a silent no-op or a crash.

The admin panel itself lives at `/admin` (role-gated layout, `src/app/admin/layout.tsx`) with three working sections rather than a single combined one: `/admin/users` (search, role change, and the full moderation-status/reason/duration control, `src/components/admin/AdminUserActions.tsx`), `/admin/media` (remove/restore/feature/hard-delete, `AdminMediaActions.tsx`), and `/admin/reports` (resolve/reject the report queue, `ReportActions.tsx`). The dashboard (`/admin`) shows real counts (users, 7-day signups, media, published, open reports) and live disk usage — no placeholder widgets. Every mutating action writes both a `ModerationAction` row (user actions use the dedicated `targetUserId` field; media/report actions use the generic `targetType`/`targetId` pair — both columns exist on the same table by design, not a bug, since a single moderator action log needs to point at different kinds of targets) and an `AuditLog` row, and `applyUserModeration` fires a real `MODERATION` notification to the affected user. `/admin/tags`, `/admin/characters`, `/admin/series`, `/admin/analytics`, and `/admin/settings` are not built yet — this pass covered user/media/report moderation only, not the full §13 route list.

Verified end-to-end against the real dev database rather than assumed: admin pages return 200 for an `ADMINISTRATOR` session and a 307 redirect for both a plain `USER` session and an anonymous request; `changeUserRole` and `applyUserModeration` were exercised directly via the Next.js server-action RPC protocol (not just code review) for role changes, `WARN`, `RESTRICTED` (confirmed blocks uploading with a 403), and `BANNED` (confirmed session deletion); `moderateMedia`'s `REMOVE` action was confirmed to actually drop the media from the public `/i/[id]` route (the same shared visibility layer from Phase 5) and `RESTORE` brings it back; a `MUTED` status was confirmed to block comment posting. All test users/media were real pre-existing accounts (`daddy`/`ADMINISTRATOR`, `white-snepai`/`USER`); all synthetic test data (a scratch report, temporary sessions, and the resulting `ModerationAction`/`AuditLog`/`Notification` rows from verification) was deleted afterward, and both real accounts were left in their original `ACTIVE`/unchanged-role state.

---

## 13. Admin Panel

A full application, not a handful of buttons — matches the routes already scoped in the brief (`/admin`, `/admin/users`, `/admin/media`, `/admin/reports`, `/admin/tags`, `/admin/characters`, `/admin/series`, `/admin/moderation`, `/admin/analytics`, `/admin/settings`).

- **Dashboard**: user/upload stats, uploads/day, storage usage (tied to §5's monitoring job), recent activity, popular tags/categories, moderation queue size, open reports, system status (job queue health, disk headroom).
- **Users**: search, view, role changes (permission-matrix enforced), ban/suspend/timeout/mute/restrict, delete (soft, §7), warnings, moderation history, activity log.
- **Media**: search, approve/reject/delete, edit metadata, bulk actions, feature content (powers homepage "Featured"), review flags.
- **Tags / Characters / Series**: create/edit/merge/rename, approve/reject suggestions.
- **Reports**: review/assign/resolve/reject, tied to `ModerationAction` records.
- **Analytics**: most viewed/liked, active users, upload trends, popular tags/categories, storage growth, moderation stats — all read from denormalized/aggregated tables, never live `COUNT()`-heavy queries on request.
- **Settings**: upload limits, rate limits, moderation thresholds, feature flags, storage thresholds, site config — backed by the `SiteSetting` table, editable without redeploy.

All admin routes/actions re-check role/permission server-side on every request; the frontend admin UI is a presentation layer only.

**Implemented (Phase 15/16):** see the note under §12 — Dashboard, Users, Media, and Reports sections are real and verified; Tags/Characters/Series/Analytics/Settings sections are not built yet.

---

## 14. Security

- OAuth-only auth removes password-attack surface; sessions are DB-backed and revocable (instant kill on ban/suspend).
- CSRF protection via framework defaults (SameSite cookies + Next.js server-action/CSRF handling) on all state-changing routes.
- Input validation on every API boundary (schema validation, e.g. Zod) — both client hints and mandatory server-side re-validation.
- File upload validation: MIME sniffing, size/dimension caps, CSAM hash screening (§4), no execution of uploaded content, storage path never derived from unsanitized user input.
- Rate limiting: per-IP and per-account, tiered by action sensitivity (uploads, comments, messages, reports, likes, login attempts) — thresholds live in `SiteSetting`.
- **Cloudflare Turnstile** on signup completion and on upload — guards spam/abuse rather than fake-account creation (auth is already OAuth-gated).
- SQL injection: parameterized queries via the ORM/query builder exclusively, no raw string interpolation into SQL.
- XSS: output encoding by default (React), strict sanitization of any user HTML (comments/bios should be plain text + limited markdown, not raw HTML).
- RBAC enforced server-side on every protected route (§2).
- Full audit log for admin/moderation actions (§7/§12).
- Secure OAuth flow: verified redirect URIs, state/PKCE per provider defaults.

**Implemented (Phase 17):** input validation moved to `src/lib/security/schemas.ts` (Zod) and is now enforced at every user-text boundary that previously either had ad hoc checks or none at all: comment/message length (already checked pre-Phase-17, now schema-driven), report `details` (previously **unbounded** — fixed), profile `bio`/`websiteUrl`/`twitterHandle` (previously **unbounded**, and `websiteUrl` accepted any scheme including `javascript:` since it only checked for a non-empty string in some code paths — now `http(s)://`-only, verified directly by sending a `javascript:` URL and confirming rejection), and upload `title`/`description`/tag/character/series names (previously unbounded). Rate limiting (`src/lib/security/rate-limit.ts`) is an **in-memory sliding-window limiter, deliberately not Postgres/Redis-backed** — single long-running Node process, consistent with the "modest infra" stance elsewhere in this plan — applied per-account (and additionally per-IP on upload and report, the two highest-abuse-value actions) to uploads (15/hr/account, 30/hr/IP), comments (20/5min), messages (40/5min), reports (10/hr/account, 20/hr/IP), and profile updates (10/hr). **Trade-off, not hidden:** counters reset on every restart/deploy and wouldn't be shared across more than one app instance — fine for a single self-hosted process, revisit if that ever changes. Thresholds are hardcoded constants for now rather than `SiteSetting`-backed, since `/admin/settings` (§13) doesn't exist yet to edit them; move them once it does. Verified directly, not assumed: fired 21 rapid comments as a real test account and confirmed exactly 20 succeeded and the 21st was rejected with a rate-limit error; same pattern confirmed for reports and uploads. **Cloudflare Turnstile** is wired end-to-end (`src/lib/security/turnstile.ts`, `TurnstileWidget` on the upload form, CSP already allows its script/frame hosts) but ships **disabled** — `verifyTurnstile()` no-ops when `TURNSTILE_SECRET_KEY` isn't set, per the user's choice to defer getting real Cloudflare keys; dropping keys into `.env` (see `.env.example`) is the only step needed to turn it on for real, no code changes. Applied to upload only, not "signup completion" — there's no separate signup form to attach it to, since account creation is a pure OAuth redirect (Phase 8's auto-generated username), so that half of the original plan doesn't apply as written. Security response headers (CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS) are now set in `next.config.ts` for every route — verified live on the running dev server, not just read from the config file. **CSRF**: confirmed via Next.js's own docs (not assumed) that Server Actions already compare the `Origin` header against `Host`/`X-Forwarded-Host` by default and reject a mismatch — no `allowedOrigins` config needed since Caddy fronts the same domain, not a different one. **SQL injection**: audited every raw-SQL call site in the codebase (there's exactly one, the trending-score recompute) and confirmed it's a safely-parameterized tagged template with no user input interpolated, not string concatenation. **XSS**: confirmed zero uses of `dangerouslySetInnerHTML` anywhere — comments/bios render as plain text via React's default escaping, so no sanitizer library was needed. **Not done this phase**: real CSAM hash-matching remains a structural stub (`src/lib/media/csam-screen.ts`) — implementing it for real requires registering with a hash-database provider (e.g. NCMEC/PhotoDNA), which is a legal/organizational step, not a coding one, and out of scope for this pass.

---

## 15. Performance

- Masonry gallery renders from paginated/infinite-scroll API responses returning **thumbnail variants only**; medium/original loads on demand (detail page / lightbox).
- Denormalized counters (§7) keep list queries index-scan-cheap; no live aggregate `COUNT()`/`SUM()` on hot paths.
- Background jobs (pg-boss) absorb all expensive work (image processing, trending recompute, storage scans, purge) off the request path.
- Caching: HTTP caching headers on immutable media variant URLs (content-hashed filenames → cache forever), Next.js data caching for semi-static pages (tag/character/series pages), short-TTL cache for homepage trending sections.
- Minimal client JS: server-rendered pages by default, client components only where interaction requires it (uploader, lightbox, infinite scroll, comment box).
- GIF handling (§5) specifically protects the gallery from the worst performance risk (dozens of full animated GIFs decoding at once).

**Implemented (Phase 18).** An audit against this checklist (not just re-reading the plan) found: immutable `Cache-Control` on media variant URLs was already real (Phase 6), but had no conditional-request support — every request re-transferred the full file even when a client already had a valid cached copy. `src/app/media/[...path]/route.ts` now derives a strong `ETag` directly from the content-addressed URL path (no need to hash file bytes — the path *is* the content hash) and returns `304 Not Modified` on a matching `If-None-Match`, verified directly against a real file rather than assumed. The "short-TTL cache for homepage trending sections" item was **entirely unbuilt** — every homepage request was hitting Postgres 4 times fresh (trending/recent/most-liked/categories) with zero caching. `getHomepageSections()` (`src/lib/media/query.ts`) now wraps all four in `unstable_cache` with a 60s TTL, keyed only on `canSeeNsfw` (not per-user — verified the underlying queries never read anything else off `viewer`, so this doesn't leak personalization or accidentally cache NSFW content into the wrong bucket). Verified live, not assumed: inserted a real row directly into the database and confirmed it did *not* appear on the homepage until the 60s TTL actually elapsed, then confirmed it appeared automatically after — real cache-staleness-then-revalidation behavior, not just "the code compiles." The "semi-static tag/character/series pages" half of this plan item is still unbuilt — not touched this phase. Also found and removed: `ANIMATED_PREVIEW` GIF variants (`src/lib/media/process.ts`) were being generated and stored on every animated upload but had **zero consumers anywhere in the codebase** — pure wasted encode time and disk space; removed the generation code (left the now-unused enum value in the schema rather than attempt an enum-value removal via `db push`, which Postgres doesn't support without recreating the type — a "reserved but harmless" call consistent with how `TagSuggestion`/etc. are already handled elsewhere in this plan). Cursor-based pagination and the gallery's use of static poster/thumbnail variants for GIFs (the plan's main GIF-perf concern) were both already correctly implemented — confirmed by reading the code, no changes needed there.

**Aside, not a performance finding:** while verifying the ETag change, found the dev environment's `storage/media` directory (local disk, gitignored) was completely empty despite `Media`/`MediaVariant` rows in the database still referencing files under it — the one real test upload used throughout earlier phases has no backing image data anymore. This isn't something this phase broke (no code here touches existing files), and matches the exact risk `.env.example` already warns about for `MEDIA_STORAGE_DIR` — local disk storage under the app directory isn't safe from being wiped independently of the database. Backup/persistence strategy for media storage is still an open item under §17, not yet decided; this is a concrete illustration of why, not a new problem.

---

## 16. SEO

- Full metadata + Open Graph + Twitter cards on all public SFW pages.
- Canonical URLs for tag/character/series/media pages (avoid duplicate-content issues from filter/sort query params).
- `sitemap.xml` generated from published, non-deleted, **SFW-only** content (§4).
- `robots.txt` disallows admin/dashboard/settings/messages/auth routes and NSFW paths.
- NSFW pages: `noindex` + `X-Robots-Tag: noindex` regardless of robots.txt, redundant protection against accidental indexing.
- Structured data (schema.org `ImageObject`/`CreativeWork`) on media pages where it helps discovery without exposing NSFW previews to rich results.

**Implemented (Phase 19), partial.** This section was entirely unbuilt before — confirmed by checking, not assumed: `/i/[id]` (the actual artwork page, the whole point of a gallery site) had zero metadata, not even a `<title>`. `src/app/robots.ts` and `src/app/sitemap.ts` now exist (Next's file-convention routes, verified live at `/robots.txt` and `/sitemap.xml`); the sitemap is a single flat list at today's scale (SFW-published media + tags/characters/series + static routes) — revisit with paginated `generateSitemaps` once that's actually expensive, not before. `/i/[id]` now has `generateMetadata` with real Open Graph/Twitter card tags for SFW media. **NSFW media metadata is deliberately generic** (no real title/description/image, `robots: noindex, nofollow`) rather than just omitted — verified directly with an actually-opted-in test session, not assumed: even for a viewer who *can* see the item, the metadata Discord/Slack/a search bot would read stays non-revealing, on top of (not instead of) the existing protection that unauthenticated/non-opted-in requests already get nothing at all from `getVisibleMediaById`. `metadataBase` (`src/lib/site-url.ts`, driven by a new `SITE_URL` env var) was also added — required for Next to resolve the new Open Graph image URLs to absolute ones at all. **Not done this phase:** canonical URLs for filter/sort query-param variations, and structured data (schema.org). Both still open.

---

## 17. Infrastructure / Deployment

**Keeping existing stack, no replacement:**
- Ubuntu Server, Docker + Docker Compose, Next.js, PostgreSQL, Caddy, local disk media storage.
- New addition: a Postgres-native background job runner (pg-boss or graphile-worker) — no new service, just a library + a worker process/container that shares the existing Postgres instance. **Flagged in §20** as a decision point in case Redis + BullMQ is preferred instead.
- Caddy continues to serve static media directly (efficient, no app-server involvement) and reverse-proxies the Next.js app.
- Backups: Postgres dump schedule + media directory backup strategy — **to be defined in the infra/deployment phase**, not yet decided.
- Environment separation (staging vs. production) — **open question**, see §20.

**Implemented (Phase 19): production config artifacts, not yet installed/run.** Everything under `deploy/` is a checked-in config file the user runs manually (`deploy/README.md` is the full ordered checklist) — nothing here was executed against the live server; installing Caddy, opening/restricting firewall ports, and enabling systemd services all require root and touch external-facing state, which is the kind of hard-to-reverse, shared-system change that gets a human's go-ahead rather than being done silently. What's in there: a production `Caddyfile` (Cloudflare-proxied, `moonlightcherry.xyz` canonical + `www` → bare-domain redirect, per the user's explicit decision — using a **Cloudflare Origin CA certificate**, not Caddy's automatic Let's Encrypt, since automatic ACME's HTTP-01 challenge doesn't play well with a Cloudflare-proxied record; the Origin CA cert is the standard fix and needs no code, just a dashboard step); systemd units for the app and worker (`worker` runs plain `tsx`, not `tsx watch` — the file-watching is a dev convenience with a real cost in production); `deploy/deploy.sh` (pull → install → `prisma db push` → build → restart, matching the `db push`-not-migrations workflow this whole project has used); `deploy/backup.sh` + a daily systemd timer (Postgres dump + media directory tarball, with an optional off-site rclone destination — **local-only by default**, which the script says explicitly rather than implying real durability it doesn't have); and `deploy/allow-cloudflare-only.sh`, which restricts ports 80/443 to Cloudflare's published IP ranges — not just hardening, but a real requirement here specifically, since the CSAM Scanning Tool (§4/§14) only sees traffic that actually passes through Cloudflare's cache, and traffic that reaches the origin IP directly bypasses it entirely. Also moved local media storage to a path outside the app directory (`/srv/moonlightcherry/storage/media`) in the checklist, closing the loop on the storage-durability gap flagged in Phase 18 — the app directory itself is not a safe place for anything that needs to survive a redeploy.

---

## 18. UI / UX

### Design tokens (approved — "Neon Temple")

Explored three palette/type directions in a live demo; this one is now the locked visual identity for Moonlight Cherry.

| Token | Hex | Role |
|---|---|---|
| Void | `#08080C` | Page background |
| Charcoal | `#131018` | Cards, nav, elevated surfaces |
| Cherry | `#FF2A4D` | Primary accent |
| Ember | `#FF6B84` | Hover/active states |
| Moonlight | `#FFFFFF` | Headlines, high-contrast text |
| Ash | `#736F82` | Secondary text, borders |

Typography: **Bodoni Moda** (display/headlines), **Hanken Grotesk** (UI/body), **Unbounded** reserved specifically for tags/labels/chips — not used elsewhere, so it stays a punctuation mark rather than the page's whole voice. Type carries slightly bolder weights and tighter tracking than a typical UI face, matching the "edgy/tech" brief.

Reference build: a live homepage preview + token/component reference implementing this exact palette is available as an artifact for ongoing design QA as we build each phase. **Note:** that reference is a single static HTML file, so its nav links (`#gallery`, `#tags`, etc.) just scroll the same page — that's a limitation of a one-file demo, not the app's routing. The real app is multi-page: `/gallery`, `/tags` + `/tags/[tag]`, `/characters` + `/characters/[character]`, `/anime` + `/anime/[series]` are each a distinct Next.js route with its own URL, per the route structure below and Phase 7.

- Visual identity per the brief: dark, premium, minimal, black/white/crimson, subtle gradient + glass accents, artwork-dominant layouts, restrained animation.
- Every route from the brief's route list is a real page (§ route structure below), not a modal-over-homepage trick.
- Every major feature designs for: loading, empty, error, success, disabled, processing, permission-denied, not-found, and (where relevant) offline states — not just the happy path.
- Mobile is a first-class responsive design pass per surface (nav, gallery, viewer, upload flow, profile, comments, admin), not a squeezed desktop layout.
- Detailed visual design system (typography scale, color tokens, spacing, component states) is its own dedicated phase (§19 Phase 1) — this document defines product behavior, not pixels.

### Route structure (as specified, essentially unchanged)

Public: `/`, `/gallery`, `/search`, `/tags`, `/tags/[tag]`, `/characters`, `/characters/[character]`, `/anime`, `/anime/[series]`, `/i/[id]`, `/u/[username]`, `/collections/[id]`, `/about`, `/contact`, `/terms`, `/privacy`

Authenticated: `/upload`, `/dashboard`, `/dashboard/uploads`, `/dashboard/favorites`, `/dashboard/collections`, `/dashboard/history`, `/messages`, `/notifications`, `/settings`

Auth: `/login`, `/auth/callback`

Admin: `/admin`, `/admin/users`, `/admin/media`, `/admin/reports`, `/admin/tags`, `/admin/characters`, `/admin/series`, `/admin/moderation`, `/admin/analytics`, `/admin/settings`

---

## 19. Development Phases

Each phase ships a working slice, not a mockup.

1. **Architecture & design system** — tokens, component primitives, layout shells, dark theme, brand mark integration.
2. **Authentication** — Discord/Google OAuth, sessions, `/login`, `/settings` skeleton, role field on `User`.
3. **Core database** — full schema migration for entities in §7 (minus XP/Achievement logic, schema only).
4. **Media pipeline** — upload validation, storage interface, variant generation, GIF handling, job queue.
5. **Gallery / homepage** — masonry grid, infinite scroll, trending/recent/popular sections, NSFW-safe query layer.
6. **Media detail pages** — `/i/[id]` full viewer, likes/favorites/views, download/share.
7. **Search / tags / characters / series** — `/search`, `/tags`, `/characters`, `/anime` + detail pages, suggestion queues.
8. **Profiles** — `/u/[username]`, uploads/collections/favorites display, follow.
9. **Uploading** — `/upload` full flow (metadata, tags, character/series pick, NSFW flag, progress/processing states).
10. **Collections** — CRUD, public/private, cover image.
11. **Community features** — comments, replies, likes, mentions, follow, reporting.
12. **Notifications** — polling-based delivery, `/notifications`.
13. **Messaging** — `/messages`, conversations, blocking, reporting.
14. **Gamification** — XP/levels/badges/leaderboards logic + UI (deferred here per §11).
15. **Moderation** — queue, report handling, moderator actions, audit log UI.
16. **Admin panel** — full `/admin/*` suite.
17. **Analytics** — admin analytics views on aggregated data.
18. **Security hardening** — rate limiting, Turnstile integration, CSAM screening integration, pen-test pass.
19. **Performance optimization** — caching layer, query audit, gallery rendering profiling.
20. **Production deployment** — backups, monitoring, staging/prod split, launch checklist.

Order can shift once we scope individual phases in detail — flag any dependency you think is wrong.

---

## 20. Open Decisions

Items still needing your input before (or during) the relevant phase:

1. **OAuth account linking**: if the same person signs in with Discord and later Google using the same verified email, auto-link into one account, or always keep them separate?
2. **Background job technology**: Postgres-native (pg-boss/graphile-worker, no new infra) — my recommendation — vs. adding Redis + BullMQ for a more conventional/higher-throughput queue.
3. **CSAM screening provider**: which hash-matching service (Thorn Safer, NCMEC, PhotoDNA access, or another) — this also has legal/compliance and cost implications outside pure architecture; recommend you evaluate directly given jurisdiction and budget.
4. **Legal/compliance review**: ToS, DMCA/copyright takedown process, minimum jurisdiction-specific NSFW disclosures, and CSAM legal reporting obligations — needs sign-off from you/counsel, not something to architect around silently.
5. **Comment nesting depth**: single-level replies (proposed) vs. deeper threading.
6. **Backup strategy & retention**: Postgres dump frequency/retention, media directory backup destination (off-box?), disaster-recovery expectations.
7. **Staging environment**: do we run a separate staging stack before production deploys, or ship straight to production behind feature flags?
8. **Rate limit specifics**: exact numeric thresholds per action (uploads/hour, comments/minute, messages/hour, likes/minute, login attempts) — proposed defaults will be drafted in the Security phase for your sign-off rather than picked now.
9. **Storage/upload-limit change process**: confirm `SiteSetting`-backed admin configuration (no redeploy needed) is the right model, vs. env-var/config-file limits.
10. **Trending algorithm weights**: the formula shape in §11 is proposed; exact weights (`w_like`, `w_fav`, `w_comment`, `gravity`) are tuning values best set once we have any real usage data — confirm the approach, not the numbers, for now.

---

*Next step: review this document, resolve whichever of the items in §20 you want to settle now (others can wait until their phase), and then we start Phase 1.*

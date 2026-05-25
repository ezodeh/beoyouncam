## Goal
Do a nano-level audit of the whole app, then fix every connection/sync/UX/UI issue found — with extra focus on **light mode** polish. No new features.

## Audit checklist (I'll execute each)

### A. Routing & navigation
- [ ] `/terms` and `/privacy` pages exist but are **not registered** in `App.tsx` → footer/auth/CreateEvent links 404 (confirmed in console: `404 Error: /terms`). Add both routes.
- [ ] Walk every `<Link>` / `navigate(...)` in pages — verify target route exists.
- [ ] Verify `RequireAuth` redirects preserve `?next=` everywhere.
- [ ] Verify `/event/:token` → soon/ended/welcome/camera router still works for all event states.

### B. Data flow & "saves everywhere" sync
- [ ] Map every `.update()` / `.insert()` on `events`, `profiles`, `participants`, `media_submissions`, `blessings`.
- [ ] For every dashboard tab (Overview, EventDetails, Privacy, Customization, Album, Participants, QRCodes, Statistics):
  - confirm save → DB write → state refetch → reflected on guest-facing pages (Welcome, Camera, Album).
- [ ] Confirm `get_public_event_info` returns every field consumers read (title, max_shots, enable_video, album fields, welcome fields, sign_in_method, share_method, is_private, is_album_published, cover/album cover).
- [ ] Confirm Privacy tab password flow uses the DB trigger (no plaintext leak) and `validate_event_password` works end-to-end on the guest album.
- [ ] Confirm WelcomeTour: `onboarded_at` written + read; tour does not reappear.
- [ ] Confirm camera thumbnails hydrate from `media_submissions` (not stale blob URLs) on revisit.

### C. Realtime
- [ ] `media_submissions`, `blessings`, `participants` replication enabled. Verify channel subscriptions in EventAlbum/ManageDashboard actually fire and don't leak.

### D. Auth
- [ ] Email/password + Google sign-in both land logged-in users on `/account` (Index redirects correctly).
- [ ] Profile auto-created via `handle_new_user` trigger (verify trigger is attached).
- [ ] `pendingProfile` upsert path in `AuthProvider` works.

### E. UI — Light mode polish (explicit user priority)
Audit every page in light mode for:
- contrast (text on white surfaces, muted text legibility)
- hardcoded `text-white` / `bg-black` / `text-gray-*` that don't flip in light mode
- inputs / borders too faint
- glass/blur surfaces that turn invisible on white
- camera UI bottom controls visibility
- WelcomeTour, dialogs, sheets, dropdowns

Pages to verify visually in light mode:
Index, Account, CreateEvent, ManageDashboard (all 8 tabs), EventWelcome, EventCamera, EventAlbum, EventAlbumIntro, EventAlbumPrivate, EventFinalSubmit, EventSubmitSuccess, Auth, ResetPassword, Settings, BillingHistory, ChoosePlan, Payment, Scanner, Invites, Gallery, NotFound, Terms, Privacy.

Replace any hardcoded color with semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`, etc).

### F. Forms & validation
- [ ] Every form has zod (or equivalent) validation + error messages in Arabic.
- [ ] No `dangerouslySetInnerHTML` with user input.

### G. Console / runtime
- [ ] Resolve all warnings in current console (recharts width/height = -1 in StatisticsTab, React Router v7 flags — optional opt-in).
- [ ] No unhandled promise rejections in main flows.

## Deliverables (in build mode)
1. **Routing fixes** — add `/terms`, `/privacy` routes in `App.tsx`.
2. **Light-mode pass** — replace hardcoded colors with semantic tokens across the page list above; fix any contrast issues found.
3. **Sync fixes** — for any dashboard save that doesn't propagate, add a refetch or invalidate (`get_public_event_info` is the source of truth on guest screens; ensure ManageDashboard refetches after each save).
4. **Realtime fixes** — verify subscriptions, add cleanup where missing.
5. **Camera hydration** — confirm `media_submissions` query on mount and signed/public URL works; fix if not.
6. **Small bugs** — Statistics chart sizing warning, any 404 link, any missing field in public RPC.
7. **Final QA** — open every page in light + dark, take screenshots, verify console is clean.

## Out of scope
- No new features
- No design redesigns beyond fixing broken/low-contrast surfaces
- No business logic changes beyond bug fixes

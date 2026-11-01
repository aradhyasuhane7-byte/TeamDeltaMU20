# Blindspot Operations Hub

Public read-only order dashboard plus five protected JavaScript workspaces: Head Admin, Confirmation, Packaging, Documentation & Dispatch, Delivery. Business workspaces use central Cloudflare D1; proof images use private R2 storage.

## Business access

Public testing logins are disabled. Seeded sample orders are archived and the prior testing workspace is excluded from the public dashboard. User-created records are preserved privately. Use **Login → Business owner sign-in** to create or open your business workspace, then set an admin login in Settings & profile and add department employees under Employees & access.

## Real business onboarding

Use Business owner → create a real workspace to verify the owner with ChatGPT sign-in. Create a workspace, then create an admin user ID/password under Operations tools → Settings & profile. Add employees under Employees & access with email, department, user ID and an initial password of at least 10 characters. Existing verified-sign-in users may be granted access with email alone. Direct app accounts are scoped to one workspace; matching an email in another workspace does not grant access there. Password recovery is available through verified email sign-in or a business-admin-issued single-use reset link.

The public page allows anonymous viewing of opted-in workspace order number, product, quantity, destination, current stage and status. It never returns buyer names, contact details, order values, employee identities, notes, photo references or storage keys. Admins can toggle publication in business settings. New workspaces enable this view as requested. Private data APIs require membership and all mutations validate Origin and role. Admin can process all four stages; departments can process only their current stage. Admin overrides and undo require a reason. Archiving is reversible.

## Restored features

- Three-second original box/truck loading animation (only after a successful department/admin login), light/dark preference, Hindi interface labels, optional click sounds, tour, about, keyboard shortcuts, overdue alerts, summary drafts.
- Order creation/editing, search, urgency/newest/oldest sort, status and stage filters, archived view, per-stage history, buyer history, notes with literal @mentions, owner assignment, order value, contact number, COD, RTO, delivery ratings and optional proof photos with camera/file input and zoom.
- Shared working hours (IST), Sunday closure, supplier pause/resume with excluded pause intervals, pickup cut-off, on-time target and peak-season deadline multiplier.
- Weekly/monthly/rolling comparison, stage/person/reason delays, intake trend, courier and destination scorecards, financial exposure, on-time delivered score, streak, feedback breakdown and actionable queues.
- Bulk notes/courier updates, CSV import/export, period reports, Excel-compatible SpreadsheetML XML, Tally mapping CSV, print/PDF, JSON backups, additive restore and legacy `{O,S}` order import.
- Buyer WhatsApp/status drafts, courier claim drafts, tracking search links, downloadable local QR labels, corrective-action tracker and profile fields.

## Limits

Email summaries remain deferred. Messages and @mentions are drafts/text and do not send notifications. Carrier statuses are manually entered; links do not integrate carrier APIs. Hindi translates common interface labels; dynamic business content and some detailed guidance remain English. The Excel report is XML, not XLSX; Tally mapping CSV needs accountant-led ledger/voucher mapping, not automatic accounting import.

Data APIs read keyset pages and the client completes the full sync before replacing its dataset. Tables render 25 rows per page and server exports stream all matching records. Refresh interval is 15 seconds; overlapping full syncs are avoided. Completed stage overruns remain recorded when business hours subsequently change.

Backups restore missing order numbers additively and preserve existing data. Existing audit logs are not overwritten. Settings must be reviewed/saved separately. Photo bytes are not embedded in JSON backups, and legacy browser photos are not included in legacy order JSON. Live camera availability depends on HTTPS and device permissions. R2/database writes are not one distributed transaction; failed photo database inserts trigger object cleanup.

## Verification

`node tests/permissions.mjs` checks role boundaries, optimistic revisions, admin processing of all four stages, overrides/undo, archive/restore, pause accounting, working hours/Sundays, quoted CSV, legacy conversion, request authorization and password hashing. Browser checks cover sign-in, central creation/handoffs, public view, restored tools and preferences. Real business owner onboarding still requires the actual owner’s verified sign-in.

Schema changes live in `db/schema.ts` with additive Drizzle migrations. UI and API code is JavaScript/JSX; starter configuration retains TypeScript. No Java is used. Hosting applies pending migrations during deployment. Secrets and session tokens are never returned to the UI. Session cookies are HttpOnly, SameSite=Lax and Secure in production, with eight-hour expiry; passwords use PBKDF2-SHA256 and salted hashes. Login attempts are rate limited.

## Department session safeguards

Explicit department sessions are bound to the account, workspace and server-validated role. Expired, missing or mismatched department sessions fail closed and never inherit a signed-in owner identity. Legacy sessions without a role must log in again after this update. Production session cookies support embedded visits using Secure, HttpOnly, SameSite=None and Partitioned attributes. Origin checks remain mandatory on writes. Owner-only verified sign-in is for setup and access management; processing orders requires an explicit Blindspot login. Account switches clear stale UI and invalidate prior session tokens; department users see no actionable navigation into another department.

## Customer care and automated help

Customer care is available from a floating panel on public and protected pages. The email button opens a draft to aradhyasuhane7@gmail.com. Support requests are stored centrally, with reference numbers and an owner-only inbox. Ticket submission does not automatically send email. The actual owner can publish a support phone number in Owner inbox and update ticket status or open a reply email draft. Demo administrators and department employees cannot read the care inbox.

The assistant always supports a grounded FAQ mode for Blindspot questions. It does not query private orders or modify records. With a real `OPENAI_API_KEY` securely configured in hosted runtime settings, it uses the OpenAI Responses API and `OPENAI_MODEL` (default `gpt-6-luna`); without a key or on API failure it clearly marks FAQ responses. User questions and assistant replies are saved for customer care. Rate limits bound chat and ticket submissions. No API credential is placed in browser code. Human support availability and response time are separate from automated help.

The model connection is configured securely. The live verification request returned `billing_not_active`; API billing activation is required for live AI replies. Do not paste real API keys in the chat. The owner supplied +91 7509595171 as the public support phone. It is the initial contact value until the owner saves a custom phone setting. Run `node tests/support.mjs` for FAQ matching, privacy, rate limiting, ticket storage, owner access, phone validation and mocked AI-response parsing; live model calls require active API billing.

## Recovery, responsibility and reliability update

Login now links to `/recover`: recovery requests appear in Safety & recovery, admins issue one-time links valid for 20 minutes, and users may instead verify the exact account email through ChatGPT sign-in. Resetting a password revokes old app sessions. No automatic reset email is sent.

Admins can assign employees per stage and designate department leads. Overdue escalations are computed in-app for assigned staff, relevant leads and head admin, with acknowledgement notes. External email/SMS/push escalation is not enabled. Scanning supports QR/common barcodes through device camera, uploaded label images, USB scanners and typed IDs. A scan opens a record without completing a stage; existing role restrictions remain enforced.

Public fields are explicitly allowlisted and omitted server-side when disabled. Public visitors never receive buyer contact information, financial values, employee identities, notes or proof files. Data APIs use 300-row keyset pages. The UI loads all pages before replacing its dataset, renders 25 orders per table page, and streamed CSV/XML/JSON exports read the complete database without the previous 2,000-row cap. Large workspaces can take longer to sync; analytics operate on the completed synced dataset.

Each successful order/settings write creates a private R2 change record. Full checksummed snapshots are generated on activity each day, before major operations, and on demand. These are write-triggered backups, not a separate closed-site timer. If a recovery record fails after the database write, the save remains committed and the dashboard reports the backup error. Manual recovery previews verify snapshot checksums; recovery saves a rollback snapshot first, restores matching/additional order records, retains newer records and current audit history, and can replay later change records. Membership permissions, passwords and sessions are never restored. Photos are immutable private R2 objects referenced by recovery files; snapshot JSON does not duplicate image bytes. No backup retention deletions are automated. Concurrent writes are serialized with expiring, renewed workspace locks during snapshots/recovery.

Browser errors, failed writes and backup failures feed Safety & recovery → Error monitoring. Messages redact emails, credential tokens and password-like values. These are in-app monitoring records; no external incident alerts are sent. `/api/health` provides a bounded database check.

`node tests/foundations.mjs` uses a real temporary SQLite database and in-memory object storage to exercise snapshot restore/replay, checksum rejection, locks, 2,101-row full exports, privacy projection, recovery tokens, email verification matching, revoked sessions and escalation targets. It does not send real recovery messages or test a physical camera.

## AI chat & support

Open the separate **AI Chat** button on any page for the assistant. **Customer Care** has its own button for email, phone and support requests. The assistant answers Blindspot questions about logins, department permissions, order stages, delays, reports and recovery. It cannot look up or modify private orders. User messages/history are sent to OpenAI for AI replies and saved in the customer-care inbox. Avoid sharing credentials or sensitive customer details.

The hosted AI connection is configured securely. At setup, OpenAI returned `billing_not_active`: activate billing in the OpenAI Platform account before live AI replies can work. Saved Blindspot guidance remains available and is identified as such whenever AI is unavailable. The configured starter model is `gpt-6-luna`; API usage is billed separately from ChatGPT subscriptions.

A separate local copy can use `OPENAI_API_KEY` in its ignored `.env.local`. Hosted deployments may use the secret pair `OPENAI_KEY_CIPHERTEXT` / `OPENAI_KEY_JWK` or a direct secret `OPENAI_API_KEY`. Credentials are never included in the source ZIP.

## Delay insights and notifications

Admins see Delay insights on their dashboard: this week to date versus the same elapsed part of last week, using Monday boundaries in IST. The stage ranking uses average recorded late minutes per completion; counts, totals and recurring reasons include order references. Archived records are included; manual override stages are excluded. No-data periods are labelled rather than given a percentage. These statistics describe recorded delays, not proven causes.

Every department has a Notifications panel for orders arriving at its stage and overdue stages. Admin sees the complete workflow. Read status is saved centrally for each account/role and workspace. The centre refreshes every 15 seconds and supports older pages and marking up to 50 displayed items read. It derives handoffs from durable stage completion records and includes existing order history. Archived orders leave the feed. Email and WhatsApp notifications are not sent. Opt-in browser push is available for handoffs.

## Browser handoff notifications

On each employee device: sign in to the correct department, open **Notifications**, click **Enable browser notifications**, and approve the browser prompt. Then click **Send test notification** and confirm the device shows it. When a stage is successfully completed, the server sends an encrypted, generic alert to registered devices for the next department. The site tab can be closed; no page polling or OpenAI billing is needed. Delivery completion alerts go to registered admins. Imports, manual overrides and historic stage records do not send new background alerts.

Push uses browser push services and a service worker. Provider acceptance is not proof that a device displayed the message. Browser/OS restrictions, force-closing the browser, battery settings or network loss can delay/block delivery. Messages expire after 24 hours. On iPhone/iPad, add the site to Home Screen and enable notifications from that installed web app. Permission and closed-tab delivery must be verified on actual employee devices; those prompts were not accepted on the user's behalf during development.

Use **Disable on this device** to opt out. Signing out or changing accounts unsubscribes this browser; re-enable after signing back in. Role changes and revoked memberships are checked server-side before sending. Alerts omit buyer details and order numbers; opening one still requires the appropriate account to view private orders. Delivery failures appear in Error monitoring. There is no guaranteed-delivery or scheduled retry service.

Production VAPID keys are configured in runtime settings (`VAPID_PUBLIC_KEY` / secret `VAPID_PRIVATE_KEY`). Secrets and subscription records are not included in source downloads.

## Photo evidence checks and independent review

New photo uploads get a SHA-256 fingerprint and a server-recorded receipt of the expected order number, product, quantity, order revision, uploading actor, stage and upload time. An exact byte-identical image already fingerprinted in the same workspace is rejected; changed, cropped, recompressed or photographed copies may evade that check. Older photos are not backfilled and are labelled as legacy evidence. A stored image is checked against its fingerprint on retrieval. These checks do not prove the depicted product is correct or the scene is genuine.

New evidence starts Awaiting review. A different account/email acting as admin or the receiving department can inspect the photo and approve/reject it. Uploaders cannot review their own evidence. Review requires a checklist confirmation; rejection requires a reason. Final decisions are recorded in activity history and cannot be overwritten through the review form. A correction needs new evidence. Receipts and decisions are included in recovery data; restored existing photo rows retain their current metadata.

Pending initial photos do not block stage completion. Rejected evidence places the order on hold and blocks handoff and admin completion until every rework case has independently approved replacement evidence. The website does not claim automatic authenticity verification, AI product recognition, or tamper-proof audit history.


## Login-only access
The homepage now opens directly to department login. Public read-only viewing has been removed, and `/api/public` returns 401 with no order or workspace data even if older settings enabled publishing. Sign out returns to login. Password recovery and business-owner sign-in remain available.

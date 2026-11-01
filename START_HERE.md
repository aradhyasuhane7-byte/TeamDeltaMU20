# Direct department login

Open **Login → Prepared user IDs & passwords — all 5 departments**. Enter your private access code (provided separately in ChatGPT), then select **Use login** for your department and press **Login**. No business-owner sign-in is needed. IDs: `bs.admin`, `bs.confirm`, `bs.pack`, `bs.doc`, `bs.del`. Save your private login sheet from that panel. Never publish it or the access code.

The source ZIP contains salted password hashes, not plaintext credentials. The password panel requires the hosted secret `BLINDSPOT_PREPARED_LOGIN_CONFIG`, which is installed on your live website and excluded from this download. A separate local copy needs its own credentials/runtime configuration. If an account password is changed later, the panel stops showing the old password.

# Blindspot — final source download

This ZIP contains the complete source project, database migrations, tests and setup/user guides. Your working online site is:

https://blindspot-department-hub.mellowmole4096.chatgpt.site

Use the online site immediately. The downloaded source is for running a separate local development copy or working with a developer. It does not contain your production customer records, passwords, session tokens, private photos or API keys.

## First business sign-in

Open the site, click Login, then **Business owner sign-in**. Verify your ChatGPT identity and create your business workspace if needed. Under **Operations tools → Settings & profile**, create your admin user ID/password. Add department employees under **Employees & access**. Each employee uses their own credentials.

The site starts with an empty queue. Public testing accounts are disabled; seeded sample records are archived and their old workspace is not published. User-created records from that prior workspace are preserved privately, not erased or copied into a new business.

## Run a separate local copy

1. Install Node.js 24 (the project requires Node.js 22.13 or newer; its SQLite tests use Node.js 24).
2. Extract the ZIP and open a terminal in its `Blindspot` folder.
3. Install the locked dependencies:

   ```sh
   npx pnpm@11.25.0 install --frozen-lockfile
   ```

4. Build the app and initialize its **local** database:

   ```sh
   npx pnpm@11.25.0 run build
   npx pnpm@11.25.0 run db:local
   ```

5. Start development:

   ```sh
   npx pnpm@11.25.0 run dev
   ```

6. Open the local address printed by the command (normally http://localhost:5173). Set up a local workspace. Local records are separate from your online records.

The local database initializer records migrations it applies. If you previously applied migrations manually, do not replay them blindly; let a developer compare the existing schema first. No production database is changed by the local setup commands.

Local portable development uses the starter's mock verified identity when testing owner sign-in; this is for local development only. Published owner sign-in uses verified ChatGPT identity. Cloud hosting, domain/authentication policies and live API services require their corresponding configuration; copying source alone does not copy production service credentials.

## Run verification

```sh
npx pnpm@11.25.0 run test
```

Tests cover stage permissions/session isolation, working-hour calculations, recovery tokens, snapshot restore/replay, backup checksums, public privacy, and full exports beyond 2,000 orders. Camera hardware and real outbound email/AI requests require separately configured services/devices.

Read `USER_GUIDE.md` for daily use, and `README.md` for architecture and limitations.

## Prepare all five logins

After Business owner sign-in and workspace setup, open **Employees & access → Create all 5 logins**. This creates any missing head admin, Confirmation, Packaging, Documentation & Dispatch, and Delivery accounts with unique IDs and random passwords. Save the private login sheet before closing it. Existing accounts and passwords remain unchanged; use account recovery for forgotten passwords. Each department can update only its stage. You can also add named employees with real email addresses below. The generated department slots use internal identifiers, so their forgotten passwords require admin-issued recovery links. Passwords are hashed in the database and never included in source downloads.

## AI chat & support

Open the separate **AI Chat** button on any page for the assistant. **Customer Care** has its own button for email, phone and support requests. The assistant answers Blindspot questions about logins, department permissions, order stages, delays, reports and recovery. It cannot look up or modify private orders. User messages/history are sent to OpenAI for AI replies and saved in the customer-care inbox. Avoid sharing credentials or sensitive customer details.

The hosted AI connection is configured securely. At setup, OpenAI returned `billing_not_active`: activate billing in the OpenAI Platform account before live AI replies can work. Saved Blindspot guidance remains available and is identified as such whenever AI is unavailable. The configured starter model is `gpt-6-luna`; API usage is billed separately from ChatGPT subscriptions.

A separate local copy can use `OPENAI_API_KEY` in its ignored `.env.local`. Hosted deployments may use the secret pair `OPENAI_KEY_CIPHERTEXT` / `OPENAI_KEY_JWK` or a direct secret `OPENAI_API_KEY`. Credentials are never included in the source ZIP.

## Browser handoff notifications

On each employee device: sign in to the correct department, open **Notifications**, click **Enable browser notifications**, and approve the browser prompt. Then click **Send test notification** and confirm the device shows it. When a stage is successfully completed, the server sends an encrypted, generic alert to registered devices for the next department. The site tab can be closed; no page polling or OpenAI billing is needed. Delivery completion alerts go to registered admins. Imports, manual overrides and historic stage records do not send new background alerts.

Push uses browser push services and a service worker. Provider acceptance is not proof that a device displayed the message. Browser/OS restrictions, force-closing the browser, battery settings or network loss can delay/block delivery. Messages expire after 24 hours. On iPhone/iPad, add the site to Home Screen and enable notifications from that installed web app. Permission and closed-tab delivery must be verified on actual employee devices; those prompts were not accepted on the user's behalf during development.

Use **Disable on this device** to opt out. Signing out or changing accounts unsubscribes this browser; re-enable after signing back in. Role changes and revoked memberships are checked server-side before sending. Alerts omit buyer details and order numbers; opening one still requires the appropriate account to view private orders. Delivery failures appear in Error monitoring. There is no guaranteed-delivery or scheduled retry service.

Production VAPID keys are configured in runtime settings (`VAPID_PUBLIC_KEY` / secret `VAPID_PRIVATE_KEY`). Secrets and subscription records are not included in source downloads.

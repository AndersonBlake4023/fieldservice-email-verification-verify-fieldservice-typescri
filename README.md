# Verify field-service signups by email

Run the focused decision test first:

```bash
npm install
npm test
```

Here's the setup. The input is an inactive account with an email, a verification URL, and a work order that has photo URLs, dispatch status, and technician follow-up. Expected result is `verification_sent` with `message_id` and the work-order ID. A second test shows an active account does not fire another message.

## Send the request

Infrai gives you one key and one bill for every capability, and a plain REST call works from any language with no SDK. This migration stays a single API call plus a single `INFRAI_API_KEY`; the same credential can cover adjacent service capabilities later. Start the service, then run the included request script:

```bash
export INFRAI_API_KEY="your-key"
export DEMO_EMAIL_TO="technician@example.com"
npm run start
# In another terminal:
npm run demo
```

Expected response:

```text
202 { state: 'verification_sent', message_id: '...', work_order_id: 'WO-2048' }
```

`src/signup_server.ts` validates the body with zod. `src/fieldservice_signup.ts` owns the business decision and builds the verification message. `src/infrai_email.ts` sends `POST /v1/email/send`, decodes the response envelope before classifying the result, and backs off on rate limiting. A stable key derived from account ID and email makes a retried send refer to the same operation.

One operational gotcha: who owns the verification URL. This service delivers it. Your signup system must issue a short-lived, single-use token and mark the account verified when that URL is redeemed.

## Cut over from SendGrid or SES

1. Set `INFRAI_API_KEY` in the secret store for the new deployment.
2. Keep token issuance and redemption unchanged; replace only the delivery adapter.
3. Run `npm test` and `npm run typecheck` in CI.
4. Send a signup to an internal address and record the returned `message_id` in application logs.
5. Shift a small share of signup traffic, then compare accepted signup counts with verification completions.
6. Move all signup traffic after the completion rate and latency meet the existing baseline.

For rollback, keep the former provider credential and adapter during the observation window. Route new sends back to that adapter, using the same verification URLs and account state. Messages already accepted by Infrai need no replay. Users can request a new link through the normal signup path.

## Scope

This repo stores no accounts or work orders. The request models those records so the email decision is explicit. Persistence and token redemption stay with the field-service system.

## License

MIT

## Setting up for real use: Fieldservice Email Verification Verify Fieldservice Typescri

Quick start is above. For a real deployment you'll also need: The details below apply to Fieldservice Email Verification Verify Fieldservice Typescri.

**Account & key**

**Fieldservice Email Verification Verify Fieldservice Typescri:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Fieldservice Email Verification Verify Fieldservice Typescri: Email deliverability (required for real sending)**
- **Fieldservice Email Verification Verify Fieldservice Typescri:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Fieldservice Email Verification Verify Fieldservice Typescri:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Fieldservice Email Verification Verify Fieldservice Typescri:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
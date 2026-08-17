import assert from "node:assert/strict";
import test from "node:test";
import { processSignup, signupSchema } from "../src/fieldservice_signup.js";

const request = signupSchema.parse({
  account_id: "acct_1042",
  email: "tech@example.com",
  verification_url: "https://dispatch.example.com/verify?token=fixed",
  work_order: {
    id: "WO-2048",
    photo_urls: ["https://dispatch.example.com/photos/before.jpg"],
    dispatch_status: "dispatched",
    technician_follow_up: {
      technician_id: "tech_17",
      due_at: "2026-08-17T02:00:00.000Z",
      note: "Confirm the replacement valve."
    }
  }
});

test("an inactive account receives one verification message tied to its work order", async () => {
  const sent: Array<{ to: string; idempotencyKey: string }> = [];
  const mailer = {
    email: {
      async send(body: { to: string }, idempotencyKey: string) {
        sent.push({ to: body.to, idempotencyKey });
        return { message_id: "msg_123" };
      }
    }
  };

  const result = await processSignup(request, false, mailer);

  assert.deepEqual(result, {
    state: "verification_sent",
    message_id: "msg_123",
    work_order_id: "WO-2048"
  });
  assert.equal(sent.length, 1);
  assert.equal(sent[0]?.to, "tech@example.com");
  assert.match(sent[0]?.idempotencyKey ?? "", /^[a-f0-9]{64}$/);
});

test("an active account does not receive another verification message", async () => {
  let calls = 0;
  const mailer = {
    email: {
      async send() {
        calls += 1;
        return { message_id: "unexpected" };
      }
    }
  };

  const result = await processSignup(request, true, mailer);

  assert.deepEqual(result, { state: "already_active", work_order_id: "WO-2048" });
  assert.equal(calls, 0);
});

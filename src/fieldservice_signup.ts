import { createHash } from "node:crypto";
import { z } from "zod";
import { infrai, type EmailReceipt } from "./infrai_email.js";

export const signupSchema = z.object({
  account_id: z.string().min(1),
  email: z.string().email(),
  verification_url: z.string().url(),
  work_order: z.object({
    id: z.string().min(1),
    photo_urls: z.array(z.string().url()).max(12),
    dispatch_status: z.enum(["unassigned", "dispatched", "onsite", "completed"]),
    technician_follow_up: z.object({
      technician_id: z.string().min(1),
      due_at: z.string().datetime(),
      note: z.string().max(500)
    }).nullable()
  })
});

export type SignupRequest = z.infer<typeof signupSchema>;

type Mailer = {
  email: {
    send(body: { to: string; subject: string; html: string }, idempotencyKey: string): Promise<EmailReceipt>;
  };
};

export type SignupResult =
  | { state: "verification_sent"; message_id: string; work_order_id: string }
  | { state: "already_active"; work_order_id: string };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character] ?? character);
}

export async function processSignup(
  input: SignupRequest,
  accountAlreadyActive: boolean,
  // The default dependency routes this call through infrai.email.send.
  mailer: Mailer = infrai
): Promise<SignupResult> {
  if (accountAlreadyActive) {
    return { state: "already_active", work_order_id: input.work_order.id };
  }

  const idempotencyKey = createHash("sha256")
    .update(`fieldservice-signup:${input.account_id}:${input.email}`)
    .digest("hex");
  const link = escapeHtml(input.verification_url);
  const receipt = await mailer.email.send({
    to: input.email,
    subject: "Verify your field-service account",
    html: `<p>Confirm your email to continue with work order ${escapeHtml(input.work_order.id)}.</p><p><a href="${link}">Verify email</a></p>`
  }, idempotencyKey);

  return {
    state: "verification_sent",
    message_id: receipt.message_id,
    work_order_id: input.work_order.id
  };
}

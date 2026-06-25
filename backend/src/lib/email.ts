// Real email sender via Resend.
// Docs: https://resend.com/docs/api-reference/emails/send-email
//
// Falls back to console.info when RESEND_API_KEY is missing so dev still works.
// All transactional emails go through this module so we have a single audit point.

const RESEND_BASE = 'https://api.resend.com';

export function isEmailConfigured(): boolean {
  const key = process.env.RESEND_API_KEY ?? '';
  return key.startsWith('re_');
}

function getFromAddress(): string {
  // Use Resend's testing domain if havanat.store isn't verified yet.
  // (Once you verify the domain in Resend dashboard, this still works.)
  return process.env.EMAIL_FROM ?? 'Havanat <onboarding@resend.dev>';
}

function getReplyTo(): string | undefined {
  return process.env.EMAIL_REPLY_TO;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string;
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  id: string;
  simulated: boolean;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    // eslint-disable-next-line no-console
    console.info(`[mock-email] To: ${Array.isArray(input.to) ? input.to.join(',') : input.to} — Subject: ${input.subject}`);
    return { id: `mock-${Date.now()}`, simulated: true };
  }
  const apiKey = process.env.RESEND_API_KEY ?? '';
  const body = {
    from: input.from ?? getFromAddress(),
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    html: input.html,
    text: input.text ?? stripHtml(input.html),
    reply_to: input.replyTo ?? getReplyTo(),
    tags: input.tags,
  };
  const res = await fetch(`${RESEND_BASE}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.message as string)) || `Resend ${res.status}`;
    throw new Error(msg);
  }
  return { id: data.id as string, simulated: false };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// ─── Email templates ───────────────────────────────────────────────

const BRAND = '#000000';
const ACCENT = '#d4af37'; // gold

export function emailShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fafafa;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #eee;">
          <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${ACCENT};font-weight:600;">Havanat</div>
          <div style="margin-top:6px;font-size:20px;font-weight:500;color:${BRAND};">${title}</div>
        </td></tr>
        <tr><td style="padding:32px 40px;font-size:15px;line-height:1.6;">${body}</td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #eee;font-size:11px;color:#888;">
          Havanat · Where Style Meets Elegance · Port Harcourt, Nigeria
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function orderConfirmationEmail(order: {
  reference: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
  deliveryAddress?: string;
}): string {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">${i.name} × ${i.quantity}</td><td style="text-align:right;padding:8px 0;border-bottom:1px solid #f0f0f0;">₦${(i.price * i.quantity).toLocaleString()}</td></tr>`
    )
    .join('');
  return emailShell(
    `Order confirmed — ${order.reference}`,
    `<p>Thank you for your order. Here is a summary:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">${rows}</table>
    <p style="text-align:right;font-size:18px;font-weight:600;">Total: ₦${order.total.toLocaleString()}</p>
    ${
      order.deliveryAddress
        ? `<p style="margin-top:24px;"><strong>Delivering to:</strong><br>${order.deliveryAddress}</p>`
        : ''
    }
    <p>We'll send updates as your order progresses.</p>`
  );
}

export function twoFactorCodeEmail(code: string): string {
  return emailShell(
    'Your verification code',
    `<p>Enter this code to continue. It expires in 10 minutes and can only be used once.</p>
    <div style="margin:24px 0;text-align:center;font-size:36px;letter-spacing:0.5em;font-weight:300;font-family:'SF Mono',Menlo,monospace;">${code}</div>
    <p style="font-size:12px;color:#888;">If you didn't request this code, you can safely ignore this email.</p>`
  );
}

export function passwordResetEmail(resetLink: string): string {
  return emailShell(
    'Reset your password',
    `<p>We received a request to reset your Havanat password. Click the button below to choose a new one. This link expires in 1 hour.</p>
    <p style="margin:32px 0;text-align:center;">
      <a href="${resetLink}" style="display:inline-block;padding:14px 32px;background:${BRAND};color:#fff;text-decoration:none;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;">Reset password</a>
    </p>
    <p style="font-size:12px;color:#888;">If you didn't request this, ignore this email — your password won't change.</p>`
  );
}

export function bespokeRequestEmailToAdmin(req: {
  id: string;
  customerName: string;
  customerEmail: string;
  occasion: string;
  budget?: number;
  timeline?: string;
  description: string;
  adminLink: string;
}): string {
  return emailShell(
    `New bespoke request — ${req.occasion}`,
    `<p><strong>${req.customerName}</strong> (${req.customerEmail}) submitted a bespoke request.</p>
    <table style="margin:16px 0;font-size:14px;">
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Occasion</td><td>${req.occasion}</td></tr>
      ${req.budget ? `<tr><td style="padding:4px 12px 4px 0;color:#888;">Budget</td><td>₦${req.budget.toLocaleString()}</td></tr>` : ''}
      ${req.timeline ? `<tr><td style="padding:4px 12px 4px 0;color:#888;">Timeline</td><td>${req.timeline}</td></tr>` : ''}
    </table>
    <div style="background:#fafafa;padding:16px;border-left:3px solid ${ACCENT};margin:16px 0;font-size:14px;line-height:1.6;">${req.description}</div>
    <p style="margin:32px 0;text-align:center;">
      <a href="${req.adminLink}" style="display:inline-block;padding:14px 32px;background:${BRAND};color:#fff;text-decoration:none;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;">View request in admin</a>
    </p>
    <p style="font-size:12px;color:#888;">Reply directly to this email to respond to the customer — your reply will go to ${req.customerEmail}.</p>`
  );
}

export function bespokeRequestConfirmationToCustomer(req: {
  reference: string;
  occasion: string;
  adminLink: string;
}): string {
  return emailShell(
    `Bespoke request received — ${req.reference}`,
    `<p>Thank you for your interest in a bespoke piece. Our concierge team reviews each request within 24 hours and will reach out with questions or a quote.</p>
    <p><strong>Reference:</strong> ${req.reference}<br><strong>Occasion:</strong> ${req.occasion}</p>
    <p style="margin:32px 0;text-align:center;">
      <a href="${req.adminLink}" style="display:inline-block;padding:14px 32px;background:${BRAND};color:#fff;text-decoration:none;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;">View your request</a>
    </p>
    <p style="font-size:12px;color:#888;">You can reply directly to this email to add more specs or ask questions.</p>`
  );
}

export function contactFormEmailToAdmin(message: {
  name: string;
  email: string;
  subject: string;
  body: string;
}): string {
  return emailShell(
    `New contact message — ${message.subject}`,
    `<p><strong>${message.name}</strong> (${message.email}) sent a message via the contact form.</p>
    <div style="background:#fafafa;padding:16px;border-left:3px solid ${ACCENT};margin:16px 0;font-size:14px;line-height:1.6;">${message.body}</div>
    <p style="font-size:12px;color:#888;">Reply directly to this email to respond to the customer — your reply will go to ${message.email}.</p>`
  );
}

export function orderStatusEmail(order: {
  reference: string;
  status: string;
  trackingUrl?: string;
}): string {
  const tracking =
    order.trackingUrl
      ? `<p style="margin:24px 0;text-align:center;"><a href="${order.trackingUrl}" style="display:inline-block;padding:14px 32px;background:${BRAND};color:#fff;text-decoration:none;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;">Track order</a></p>`
      : '';
  return emailShell(
    `Order ${order.reference} — ${order.status}`,
    `<p>Your order status is now: <strong>${order.status}</strong></p>${tracking}`
  );
}
